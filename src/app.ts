import { Probot } from 'probot';
import { Router } from 'express';
import { exposeMetrics, useCounter } from '@operate-first/probot-metrics';
import {
  APIS,
  createTokenSecret,
  deleteTokenSecret,
  getNamespace,
  getTokenSecretName,
  updateTokenSecret,
  useApi,
} from '@operate-first/probot-kubernetes';

export default (
  app: Probot,
  {
    getRouter,
  }: { getRouter?: ((path?: string | undefined) => Router) | undefined }
) => {
  // Expose additional routes for /healthz and /metrics
  if (!getRouter) {
    app.log.error('Missing router.');
    return;
  }
  const router = getRouter();
  router.get('/healthz', (_, response) => response.status(200).send('OK'));
  exposeMetrics(router, '/metrics');

  // Register tracked metrics
  const numberOfInstallTotal = useCounter({
    name: 'num_of_install_total',
    help: 'Total number of installs received',
    labelNames: [],
  });
  const numberOfUninstallTotal = useCounter({
    name: 'num_of_uninstall_total',
    help: 'Total number of uninstalls received',
    labelNames: [],
  });
  const numberOfActionsTotal = useCounter({
    name: 'num_of_actions_total',
    help: 'Total number of actions received',
    labelNames: ['install', 'action'],
  });
  const operationsTriggered = useCounter({
    name: 'operations_triggered',
    help: 'Metrics for action triggered by the operator with respect to the kubernetes operations.',
    labelNames: ['install', 'operation', 'status', 'method'],
  });

  // Simple callback wrapper - executes and async operation and based on the result it inc() operationsTriggered counted
  const wrapOperationWithMetrics = (callback: Promise<any>, labels: any) => {
    const response = callback
      .then(() => ({
        status: 'Succeeded',
      }))
      .catch((err) => {
        app.log.error(err);
        return {
          status: 'Failed',
        };
      });

    response.then((r) =>
      operationsTriggered
        .labels({
          ...labels,
          ...r,
          operation: 'k8s',
        })
        .inc()
    );
  };

  const createTaskRun = (
    name: string,
    context: any,
    extraParams: Array<Record<string, unknown>> = []
  ) => {
    const params = [
      {
        name: 'SECRET_NAME',
        value: getTokenSecretName(context),
      },
      ...extraParams,
    ];
    const taskRunpayload = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        generateName: name + '-',
      },
      spec: {
        taskRef: {
          name,
        },
        params: params,
      },
    };

    wrapOperationWithMetrics(
      useApi(APIS.CustomObjectsApi).createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        getNamespace(),
        'taskruns',
        taskRunpayload
      ),
      {
        install: context.payload.installation.id,
        method: name,
      }
    );
  };

  app.onAny((context: any) => {
    // On any event inc() the counter
    numberOfActionsTotal
      .labels({
        install: context.payload.installation.id,
        action: context.payload.action,
      })
      .inc();
  });

  app.on('installation.created', async (context: any) => {
    numberOfInstallTotal.labels({}).inc();

    // Iterate over the list of repositories for .github repo
    const repo_exist = Boolean(
      context.payload.repositories?.find((r: any) => r.name === '.github')
    );

    if (!repo_exist) {
      app.log.info("Creating '.github' repository.");

      context.octokit.repos
        .createInOrg({
          org: context.payload.installation.account.login,
          name: '.github',
        })
        .catch((err: any) => {
          app.log.warn(err, 'Error creating repository');
        });
    }

    // Create secret holding the access token
    wrapOperationWithMetrics(createTokenSecret(context), {
      install: context.payload.installation.id,
      method: 'createSecret',
    });

    // Trigger dump-config taskrun
    createTaskRun('peribolos-dump-config', context);
  });

  app.on('push', async (context: any) => {
    // Check if 'peribolos.yaml' was modified
    const modified = Boolean(
      context.payload.commits
        ?.reduce(
          (acc: any, commit: any) => [
            ...acc,
            ...commit.added,
            ...commit.modified,
            ...commit.removed,
          ],
          [] as string[]
        )
        .find((name: string) => name == 'peribolos.yaml')
    );
    if (!modified) {
      app.log.info('No changes in peribolos.yaml, skipping peribolos run');
      return;
    }

    // Update token in case it expired
    wrapOperationWithMetrics(updateTokenSecret(context), {
      install: context.payload.installation.id,
      method: 'updateSecret',
    });

    // I think for now we can use the taskName Prefix and edit it when we
    // are adding additional information to the check
    const checkResponse = await context.octokit.checks.create({
      owner: context.payload.organization.login,
      repo: '.github',
      name: 'peribolos-run',
      head_sha: context.payload.after,
      status: 'queued',
    });

    // Trigger taskrun to apply config changes to org
    createTaskRun('peribolos-run', context, [
      {
        name: 'CHECK_RUN_ID',
        value: checkResponse.data.id.toString(),
      },
    ]);
  });

  app.on('check_run.rerequested', async (context: any) => {
    // In the future a check is needed if this is the peribolos-run check
    const checkCommit = context.payload.check_run.head_sha;
    const comRepo = await context.octokit.repos.get({
      owner: context.payload.organization.login,
      repo: '.github',
    });
    const defaultBranch = await context.octokit.repos.getBranch({
      owner: context.payload.organization.login,
      repo: '.github',
      branch: comRepo.data.default_branch,
    });
    const headCommit = defaultBranch.data.commit.sha;

    if (checkCommit !== headCommit) {
      // When adding aditional information to the created check, update
      // the body here too with the reason the check was skipped
      context.octokit.checks.update({
        owner: context.payload.organization.login,
        repo: '.github',
        check_run_id: context.payload.check_run.id,
        status: 'completed',
        conclusion: 'skipped',
      });
      return;
    }

    context.octokit.checks.update({
      owner: context.payload.organization.login,
      repo: '.github',
      check_run_id: context.payload.check_run.id,
      status: 'queued',
    });

    createTaskRun('peribolos-run', context, [
      {
        name: 'CHECK_RUN_ID',
        value: context.payload.check_run.id.toString(),
      },
    ]);
  });

  app.on('installation.deleted', async (context: any) => {
    numberOfUninstallTotal.labels({}).inc();

    // Delete secret containing the token
    wrapOperationWithMetrics(deleteTokenSecret(context), {
      install: context.payload.installation.id,
      method: 'deleteSecret',
    });
  });
};
