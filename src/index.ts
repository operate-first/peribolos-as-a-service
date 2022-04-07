import { Probot } from "probot";
import fs from 'fs';
const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomResourceApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sContext = kc.getCurrentContext();
const namespace = (() => {
  if (k8sContext === 'inClusterContext') {
    return fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf8');
  } else {
    return k8sContext.split('/')[0];
  }
})();
console.log(`Operating in the namespace: ${namespace}`);

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
        (response) => {
          console.log('Created .github repository');
          console.log(response);
        },
        (err) => {
          console.log('Error creating repository: ' + err);
        });
    };

    // TODO: check if secret exists with try catch
    var secret = {
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
    await k8sApi.createNamespacedSecret(namespace,secret);
  });

  //handle push event
  app.on("push", async (context) => {

    const configExists = Boolean(context.payload.commits?.reduce((acc, commit) => [...acc, ...commit.added, ...commit.modified,...commit.removed], []).find((name: String) => name == "peribolos.yaml"));
    if(!configExists) {
      app.log.info('No changes in peribolos.yaml, skipping peribolos run');
      return;
    }
    const payload = {
      apiVersion: "tekton.dev/v1beta1",
      kind: "TaskRun",
      metadata: {
        generateName: "peribolos-push-task-"
      },
      spec: {
        taskRef:{
          name: "peribolos-run"
        },
        params: [
          { name: "REPO_NAME", value: ".github"},
          { name: "INSTALLATION_ID", value: context.payload.installation?.id.toString()}
        ],

      }
    };
    try {
      await k8sCustomResourceApi.createNamespacedCustomObject(
        "tekton.dev",
        "v1beta1",
        namespace,
        "taskruns",
        payload
      );
    }catch(e: any){
      app.log.error(e, 'Failed to schedule peribolos run');
    }
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
