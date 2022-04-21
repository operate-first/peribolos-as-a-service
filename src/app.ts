import { ProbotOnKube } from './probotOnKube';
import { Probot } from 'probot';
import { V1Secret } from '@kubernetes/client-node';
import { InstallationAccessTokenAuthentication } from '@octokit/auth-app';

export default (appBase: Probot) => {
  const app = appBase as ProbotOnKube;
  // Respond to the GitHub app installation
  app.on('installation.created', async (context) => {
    // Get the installation token  and expiry time from the installation
    const appAuth = (await context.octokit.auth({
      type: 'installation',
    })) as InstallationAccessTokenAuthentication;
    const repos = context.payload.repositories;
    const orgName = context.payload.installation.account.login;

    // Iterate over the list of repositories for .github repo
    const repo_exist = Boolean(repos.find((r) => r.name === '.github'));

    if (!repo_exist) {
      app.log.info("Creating '.github' repository.");
      context.octokit.repos
        .createInOrg({ org: orgName, name: '.github' })
        .catch((err) => {
          app.log.warn(err, 'Error creating repository');
        });
    }

    const secret: V1Secret = {
      metadata: {
        name: 'peribolos-' + context.payload.installation.id,
        labels: {
          'app.kubernetes.io/created-by': 'peribolos',
        },
        annotations: {
          expiresAt: appAuth.expiresAt,
        },
      },
      stringData: {
        token: appAuth.token,
        orgName: orgName,
      },
    };
    await app.kube.core.createNamespacedSecret(app.kube.namespace, secret);

    // Create task run
    const payload = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        generateName: 'peribolos-dump-config-',
      },
      spec: {
        taskRef: {
          name: 'peribolos-dump-config',
        },
        params: [
          {
            name: 'INSTALLATION_ID',
            value: context.payload.installation.id.toString(),
          },
        ],
      },
    };

    // No need to check for token expiration since it was just created
    try {
      await app.kube.custom.createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        app.kube.namespace,
        'taskruns',
        payload
      );
    } catch (e: unknown) {
      app.log.error(e as object, 'Failed to schedule peribolos dump task run');
    }
  });

  //handle push event
  app.on('push', async (context) => {
    const configExists = Boolean(
      context.payload.commits
        ?.reduce(
          (acc, commit) => [
            ...acc,
            ...commit.added,
            ...commit.modified,
            ...commit.removed,
          ],
          []
        )
        .find((name: string) => name == 'peribolos.yaml')
    );
    if (!configExists) {
      app.log.info('No changes in peribolos.yaml, skipping peribolos run');
      return;
    }

    if (context.payload.installation?.id) {
      await app.updateToken(context.payload.installation.id)
    }

    const payload = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        generateName: 'peribolos-push-task-',
      },
      spec: {
        taskRef: {
          name: 'peribolos-run',
        },
        params: [
          { name: 'REPO_NAME', value: '.github' },
          {
            name: 'INSTALLATION_ID',
            value: context.payload.installation?.id.toString(),
          },
        ],
      },
    };
    try {
      await app.kube.custom.createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        app.kube.namespace,
        'taskruns',
        payload
      );
    } catch (e: unknown) {
      app.log.error(e as object, 'Failed to schedule peribolos run');
    }
  });

  // Respond to the GitHub app installation deleted
  app.on('installation.deleted', async (context) => {
    const name = 'peribolos-' + context.payload.installation.id;
    await app.kube.core.deleteNamespacedSecret(name, app.kube.namespace);
  });
};
