import { Probot } from "probot";
import fs from 'fs';
import k8s, { V1Secret } from '@kubernetes/client-node';
const { createAppAuth } = require("@octokit/auth-app");
require('dotenv').config();


const EXPIRATION_THRESHOLD = 5 * 60000;

// K8s client for using k8s apis.
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sContext = kc.getCurrentContext();
const k8snamespace = (() => {
  if (k8sContext === 'inClusterContext') {
    return fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf8');
  } else {
    return k8sContext.split('/')[0];
  }
})();
console.info(`Operating in the namespace: ${k8snamespace}`);

/**
* Function that patches K8s secret with updated token and expiry time
* @param    {Number} installId    Installation ID
* @return   None
*/
async function checkExpiryUpdateToken(installId: Number){

  const appSecret: any = await k8sApi.readNamespacedSecret("peribolos-"+installId, k8snamespace);

  console.info(`Working on the Installation: ${appSecret.body.metadata.name}`);
  const current_date = new Date();
  const expiry_date = new Date(appSecret.body.metadata.annotations.expiresAt);

  // check if token not expired
  if (expiry_date.getTime() > (current_date.getTime() + EXPIRATION_THRESHOLD)){
    console.info(`Token is still fresh for Installation: ${appSecret.body.metadata.name}`);
    return
  }

  console.info(`Token is expired for Installation: ${appSecret.body.metadata.name}`);
  const auth = await createAppAuth({ appId: process.env.APP_ID, privateKey: process.env.PRIVATE_KEY });
  const resToken = await auth({ type: "installation", installationId: installId });


  const secret: V1Secret = {
    metadata: {
      annotations: {
        "expiresAt": resToken.expiresAt
      }
    },
    stringData: {
      "token": resToken.token
    }
  }
  const headers = { 'content-type': 'application/merge-patch+json' };
  k8sApi.patchNamespacedSecret(appSecret.body.metadata.name, k8snamespace, secret, undefined, undefined, undefined, undefined, { headers }).then(
    (response: any) => {
      console.info(`Successfully update the token in secret ${appSecret.body.metadata.name}: ${response.statusCode}`);
      console.info();
    },
    (err: any) => {
      console.warn(`Failed to patch secret ${appSecret.body.metadata.name}: ${err}`);
  });
};

export = (app: Probot) => {

  // Respond to an issue opened
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    await context.octokit.issues.createComment(issueComment);
  });

  // Respond to the GitHub app installation
  app.on("installation.created", async (context) =>{

    // Get the installation token  and expiry time from the installation
    const appAuth: any  = await context.octokit.auth({ type: "installation" });
    const repos = context.payload.repositories;
    const orgName = repos[0].full_name.split("/")[0];
    app.log.info(`Operating on the Github Org: ${orgName}`);

    // Iterate over the list of repositories for .github repo
    const repo_exist = Boolean(repos.find(r => r.name === ".github"));

    // TODO: Do exception handling for not having perm for repo creation.
    if (! repo_exist) {
      app.log.info("Peribolos as services requires .github repo. \
                    \nDidnt find .github repo. \
                    \nCreating  the repository for app workflow.")
      context.octokit.repos.createInOrg({ org: orgName, name: ".github" }).then(
        (response: any) => {
          app.log.info('Created .github repository');
          app.log.info(response.status);
        },
        (err) => {
          app.log.warn(`Error creating repository: ${err}`);
        });
    };

    // TODO: check if secret exists with try catch
    const secret: V1Secret = {
        metadata :{
          name: "peribolos-"+context.payload.installation.id,
          labels: {
              "app.kubernetes.io/created-by": "peribolos"
            },
          annotations: {
              "expiresAt": appAuth.expiresAt
            },
          },
        stringData: {
          "token": appAuth.token,
          "orgName": orgName
        }
    };
    await k8sApi.createNamespacedSecret(k8snamespace,secret);
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
