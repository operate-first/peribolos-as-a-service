# Peribolos as a service

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/open-services-group/peribolos-as-a-service/blob/main/LICENSE)
![GitHub Tag](https://img.shields.io/github/v/tag/open-services-group/peribolos-as-a-service?style=plastic)
[![Docker Repository on Quay](https://quay.io/repository/open-services-group/peribolos-as-a-service/status "Docker Repository on Quay")](https://quay.io/repository/open-services-group/peribolos-as-a-service)

Learning exercise for OSG in how to make a managed service.

In this exercise we would like to take a [Peribolos](https://github.com/kubernetes/test-infra/tree/master/prow/cmd/peribolos) tool and turn it into an automated, subscribable, and consumable service for declarative github organization management.

<!-- Following instructions were taken from generated README file and headers were edited to be better understandable - more information about generating Probot app can be found here: https://probot.github.io/docs/development/#generating-a-new-app-->
## Run directly using npm

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Run inside container

```sh
# 1. Run supplied script which will create image
./scripts/build-image.sh

# 2. Start container
podman run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> peribolos-as-a-service
```

## Dev Setup

The application is a Github app. For development, the developers have to replicate the same flow as Github App.
Required steps:

1. Working on Source code for dev: Under your control :jack_o_lantern:
2. Configure the environment: [Setup launch pad :basecamp:](#set-environment)
3. Configure the webhook payload: [Ready for launch :fuelpump:](#provide-webhooks)
4. Starting the service: [Launch :rocket:](#methods-of-developments)

### Set Environment

The environment variable can be set:

1. In the [.env](./.env) file for local setup.
2. In the secrets manifests for cluster setup.

Required Environment variables: `APP_ID` and `PRIVATE_KEY`
Other Environment variable: `WEBHOOK_PROXY_URL` and `WEBHOOK_SECRET`
Example: [.env.example](./.env.example)
Reference: [docs](https://probot.github.io/docs/configuration/)

### Methods of developments

1. In Local system

    Start the server for services.

    ```sh
        # Install dependencies
        npm install

        # Build all the requirements
        npm run build

        # Run the bot
        npm start
    ```

    Linking the local server to get the webhook payload,
    we can use a redirect hook which would relay the webhook from Github to our local server.
    Use: https://smee.io/

    Set `WEBHOOK_PROXY_URL` env var in local with smee URL and Use the smee URL in the webhook setup.
2. On OCP cluster:
    One can use the deployment manifest, provided [here](./manifests/)
    To deploy the app in an openshift/k8s cluster.

    Then create a custom image of the dev work and swap the image in deployment with it.
    There are two ways to do this:
    1. Create a custom image by yourself and push it to the registry.

        ```sh
            ./scripts/build-image.sh
            podman login quay.io
            podman push localhost/peribolos-as-a-service <quay repo>
        ```

    2. Use the CI tool(Available for only Github org members listed in [here](./OWNERS)).
        * Create a PR with all the changes.
        * In comment type `/deploy`
        * aicoe-ci would create a PR image at [quay.io/open-services-group/peribolos-as-service](https://quay.io/repository/open-services-group/peribolos-as-service?tab=tags).

    Use the route URL from the openshift routes in the webhook setup.

### Provide Webhooks

The App requires a webhook payload of the GitHub application.
Developer can utilize different methods to provide the webhook payload:

* Provide Direct Github app webhook payload:
  * Setup a Github App Under your Github user.
    * Goto your `Github user setting` > `Developer Settings`
        Reference: [Github Docs](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
    * Create a new github app:
      * Fill in name and other details
      * For **Webhook URL** use the url setup in the [section](#methods-of-developments)
      * Select permission required for development
      * **Note**: At the end, select the app for your account to keep it simple.
    * Once app is created, create the client secret for authentication.
      * Reference: [docs](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps)
      * Set the `APP_ID` and `PRIVATE_KEY` in [environment](#set-environment)
    * Install it on one repo or on your whole account.
    * Triggered Webhook can be viewed under `Advance` section of the app.
* Simulate Github app webhook payload:
  * Provide payload from [test/fixtures](./test/fixtures/), where different payloads pertaining to different github event can be stored.
    * Payload from fixture can be simulated via probot. Reference: [docs](https://probot.github.io/docs/simulating-webhooks/)
    * Test suites can also be used. Reference: [docs](https://probot.github.io/docs/testing/)
