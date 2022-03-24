# Peribolos as a service

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
# 1. Build container
docker build -t peribolos-as-a-service .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> peribolos-as-a-service
```
