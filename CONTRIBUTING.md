## Contributing

[fork]: https://github.com/open-services-group/peribolos-as-a-service/fork
[pr]: https://github.com/open-services-group/peribolos-as-a-service/compare
[code-of-conduct]: CODE_OF_CONDUCT.md
[upstream]: https://github.com/kubernetes/test-infra/tree/master/prow/cmd/peribolos

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

Want to get more involved with the upstream Peribolos community? [Take a look at their repository][upstream]!

## Issues

We'd love you to open issues, if they're relevant to this repository: feature requests, bug reports, questions about our processes, declarations of gratefulness, etc. are all welcome.

In particular, if you have a large PR you want to send our way, it may make sense to open an issue to discuss it with the maintainers first.

We also use the label 'help wanted' to show issues we want help on! If you'd like to get started working in this repository, it'd be best to jump into those issues. View those issues [here](https://github.com/open-services-group/peribolos-as-a-service/help%20wanted)!

## Submitting a pull request

1. [Fork][fork] and clone the repository
2. Make your changes
3. Push to your fork and [submit a pull request][pr]
4. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Install and use [pre-commit](https://pre-commit.com/) to follow the same code style and conventions.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html), please use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

Work in Progress pull request are also welcome to get feedback early on, or if there is something blocked you. Please open such pull requests as *Draft*.

## Merging the Pull Request & releasing a new version

Releases are automated using [semantic-release](https://github.com/semantic-release/semantic-release).
The following commit message conventions determine which version is released, see [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for more details:

1. `fix: ...` or `fix(scope name): ...` prefix in subject: bumps fix version, e.g. `1.2.3` → `1.2.4`
2. `feat: ...` or `feat(scope name): ...` prefix in subject: bumps feature version, e.g. `1.2.3` → `1.3.0`
3. `BREAKING CHANGE:` in body: bumps breaking version, e.g. `1.2.3` → `2.0.0`

Only one version number is bumped at a time, the highest version change trumps the others. Besides publishing a new version to package.json, semantic-release also creates a git tag and release on GitHub, generates changelogs from the commit messages and puts them into the release notes. Semantic release is part of a larger workflow which also handles container builds for each image and pushes corresponding tags to image repository.

New container images are created from the following references:

1. `main`: Each commit is published as container image to quay using the `@latest` image tag
2. `v<version>`: For example `v1.2.3` tag. New versions are published to quay using the `@v<version>` (e.g. `@v1.2.3.`) image tag

## Development setup

The application is a Github app. For development, the developers have to replicate the same flow as Github App.

### Set Environment

The environment variable can be set:

1. In the [.env](./.env) file for local setup.
2. In the secrets manifests for cluster setup.

Required Environment variables: `APP_ID` and `PRIVATE_KEY`
Other Environment variable: `WEBHOOK_PROXY_URL` and `WEBHOOK_SECRET`
Example: [.env.example](./.env.example)
Reference: [docs](https://probot.github.io/docs/configuration/)

### Methods of developments

#### Run locally

1. It's crucial your node version matches the one installed in the container deployment.
   Using different version can make any packages installed in your development unusable when built into a container image.
   Please install [NVM](https://github.com/nvm-sh/nvm) and set it up for NodeJS v16:

   ```sh
   # Install currently locked version from .nvmrc
   nvm install
   # Use this version
   nvm use
   ```

   Note: `nvm use` can be called automatically by your shell on entering the directory, see docs on [NVM](https://github.com/nvm-sh/nvm#deeper-shell-integration) or use a plugin like [oh-my-zsh nvm](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/nvm)

2. Remember to set environment variables via `.env` file. We require:
   - `WEBHOOK_PROXY_URL` (use <https://smee.io/> to obtain it, and set it in your GitHub Application config)
   - `APP_ID` matching your GitHub Application config
   - Optionally you should also set `PRIVATE_KEY` if your app's private key is located outside of the repository directory, see [Probot documentation](https://probot.github.io/docs/development/#manually-configuring-a-github-app) for more details

3. Run the app

   ```sh
   # Install dependencies
   npm install --include=dev

   # Run local instance with hot reloading
   npm run dev
   ```

#### Run locally as a container

```sh
# 1. Run supplied script which will create image
./scripts/build-image.sh

# 2. Start container
podman run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> peribolos-as-a-service
```

#### Run in a Kubernetes cluster

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

2. Update `dev` overlay to point to your image and deploy to a connected cluster

    ```sh
    pushd manifests/overlays/dev
    kustomize edit set image quay.io/open-services-group/peribolos-as-a-service=<quay repo>
    popd

    kustomize build manifests/overlays/dev | kubectl apply -f -
    ```

Use the route URL from the openshift routes in the webhook setup.

### Provide Webhooks

The App requires a webhook payload of the GitHub application.
Developer can utilize different methods to provide the webhook payload:

- Provide Direct Github app webhook payload:
  - Setup a Github App Under your Github user.
    - Goto your `Github user setting` > `Developer Settings`
        Reference: [Github Docs](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
    - Create a new github app:
      - Fill in name and other details
      - For **Webhook URL** use the url setup in the [section](#methods-of-developments)
      - Select permission required for development
      - **Note**: At the end, select the app for your account to keep it simple.
    - Once app is created, create the client secret for authentication.
      - Reference: [docs](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps)
      - Set the `APP_ID` and `PRIVATE_KEY` in [environment](#set-environment)
    - Install it on one repo or on your whole account.
    - Triggered Webhook can be viewed under `Advance` section of the app.
- Simulate Github app webhook payload:
  - Provide payload from [test/fixtures](./test/fixtures/), where different payloads pertaining to different github event can be stored.
    - Payload from fixture can be simulated via probot. Reference: [docs](https://probot.github.io/docs/simulating-webhooks/)
    - Test suites can also be used. Reference: [docs](https://probot.github.io/docs/testing/)

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
