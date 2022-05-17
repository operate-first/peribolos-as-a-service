import { DeprecatedLogger } from 'probot/lib/types';
import fs from 'fs';
import * as k8s from '@kubernetes/client-node';
import { createAppAuth } from '@octokit/auth-app';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const EXPIRATION_THRESHOLD = 5 * 60000; // 5 minutes in milliseconds

// K8s client for using k8s apis.
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
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
export const kube = {
  custom: kc.makeApiClient(k8s.CustomObjectsApi),
  core: kc.makeApiClient(k8s.CoreV1Api),
  namespace: k8sNamespace,
};

export const updateToken = async (installId: number, log: DeprecatedLogger) => {
  const appSecret = await kube.core.readNamespacedSecret(
    'peribolos-' + installId,
    k8sNamespace
  );
  if (!appSecret) {
    log.error('Secret not found, app not installed');
    return;
  }
  const current_date = new Date();
  const expiry_date = new Date(
    appSecret.body?.metadata?.annotations?.expiresAt || 0
  );

  // check if token not expired
  if (expiry_date.getTime() > current_date.getTime() + EXPIRATION_THRESHOLD) {
    return;
  }
  log.info('Refreshing token');

  const auth = await createAppAuth({
    appId: process.env.APP_ID as string,
    privateKey: process.env.PRIVATE_KEY as string,
  });
  const resToken = await auth({
    type: 'installation',
    installationId: installId,
  });

  const secret: k8s.V1Secret = {
    metadata: {
      annotations: {
        expiresAt: resToken.expiresAt,
      },
    },
    stringData: {
      token: resToken.token,
    },
  };
  kube.core
    .patchNamespacedSecret(
      appSecret?.body?.metadata?.name as string,
      k8sNamespace,
      secret,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'content-type': 'application/merge-patch+json' } }
    )
    .catch((err) => {
      log.warn(err, 'Failed to patch secret');
    });
};
