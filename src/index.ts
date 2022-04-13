import { Probot } from 'probot';
import fs from 'fs';
import { V1Secret } from '@kubernetes/client-node';
const { createAppAuth } = require('@octokit/auth-app');
const k8s = require('@kubernetes/client-node');
require('dotenv').config();

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const EXPIRATION_THRESHOLD = 5 * 60000;

// K8s client for using k8s apis.
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomResourceApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sContext = kc.getCurrentContext();
const k8sNamespace = (() => {
  if (k8sContext === 'inClusterContext') {
    return fs.readFileSync(
      '/var/run/secrets/kubernetes.io/serviceaccount/namespace',
      'utf8'
    );
  } else {
    return k8sContext.split('/')[0];
  }
})();
console.info(`Operating in the namespace: ${k8sNamespace}`);

/**
 * Function that patches K8s secret with updated token and expiry time
 * @param    {Number} installId    Installation ID
 * @return   None
 */
async function checkExpiryUpdateToken(installId: number) {
  const appSecret = await k8sApi.readNamespacedSecret(
    'peribolos-' + installId,
    k8sNamespace
  );
  if (!appSecret) {
    console.error('Secret not found');
    return;
  }

  console.info(
    `Working on the Installation: ${appSecret.body?.metadata?.name}`
  );
  const current_date = new Date();
  const expiry_date = new Date(
    appSecret.body?.metadata?.annotations?.expiresAt || 0
  );

  // check if token not expired
  if (expiry_date.getTime() > current_date.getTime() + EXPIRATION_THRESHOLD) {
    console.info(
      `Token is still fresh for Installation: ${appSecret?.body?.metadata?.name}`
    );
    return;
  }

  console.info(
    `Token is expired for Installation: ${appSecret?.body?.metadata?.name}`
  );
  const auth = await createAppAuth({
    appId: process.env.APP_ID as string,
    privateKey: process.env.PRIVATE_KEY as string,
  });
  const resToken = await auth({
    type: 'installation',
    installationId: installId,
  });

  const secret: V1Secret = {
    metadata: {
      annotations: {
        expiresAt: resToken.expiresAt,
      },
    },
    stringData: {
      token: resToken.token,
    },
  };
  const headers = { 'content-type': 'application/merge-patch+json' };
  k8sApi
    .patchNamespacedSecret(
      appSecret?.body?.metadata?.name as string,
      k8sNamespace,
      secret,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers }
    )
    .then(
      () => {
        console.info('Successfully update the token');
      },
      (err) => {
        console.warn(err, 'Failed to patch secret');
      }
    );
}

export = (app: Probot) => {
  // Respond to the GitHub app installation
  app.on('installation.created', async (context) => {
    // Get the installation token  and expiry time from the installation
    const appAuth = (await context.octokit.auth({
      type: 'installation',
    })) as InstallationAccessTokenAuthentication;
    const repos = context.payload.repositories;
    const orgName = repos[0].full_name.split('/')[0];
    app.log.info(`Operating on the Github Org: ${orgName}`);

    // Iterate over the list of repositories for .github repo
    const repo_exist = Boolean(repos.find((r) => r.name === '.github'));

    // TODO: Do exception handling for not having perm for repo creation.
    if (!repo_exist) {
      app.log.info(
        'Peribolos as services requires .github repo. \
                    \nDidnt find .github repo. \
                    \nCreating  the repository for app workflow.'
      );
      context.octokit.repos.createInOrg({ org: orgName, name: '.github' }).then(
        () => {
          app.log.info('Created .github repository');
        },
        (err) => {
          app.log.warn(err, 'Error creating repository');
        }
      );
    }

    // TODO: check if secret exists with try catch
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
    await k8sApi.createNamespacedSecret(k8snamespace, secret);

    // Create task run
    var payload = {
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
      await k8sCustomResourceApi.createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        k8snamespace,
        'taskruns',
        payload
      );
    } catch (e: any) {
      app.log.error(e, 'Failed to schedule peribolos dump task run');
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
      await k8sCustomResourceApi.createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        k8sNamespace,
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
    await k8sApi.deleteNamespacedSecret(name, k8sNamespace);
  });
};
