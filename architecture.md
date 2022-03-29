# Design overview - Architecture

This issue should serve as an initial guidance and quick glance overview for Peribolos as a Service

```mermaid
flowchart LR
    gh[GitHub] -- Webhook events trigger --> c[GitHub App controller]
    c -- Auth requests --> gh
    c -- Store/fetch secret --> k[Kubernetes API]
    c -- Schedule task --> k[Kubernetes API]
```

## User subscribe

User subscribes to the application via [GitHub Marketplace](https://github.com/marketplace) and adds it to their organization. This generate an [`installation` event with `action: create`](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#installation). Internally we translate this into a Kubernetes Secret creation.

```mermaid
sequenceDiagram
    actor User
    User ->> GitHub: Add application
    activate GitHub
    GitHub ->> GitHub App controller: Install event webhook
    activate GitHub App controller
    GitHub -->> User: Success
    deactivate GitHub
    GitHub App controller ->> GitHub Auth: Get Token for installation
    activate GitHub Auth
    GitHub Auth -->> GitHub App controller: Token
    deactivate GitHub Auth
    GitHub App controller ->> Kubernetes API: Create secret
    activate Kubernetes API
    deactivate Kubernetes API
    deactivate GitHub App controller
```

## User unsubscribe

User unsubscribes from the application and removes it from their organization. This generate an [`installation` event with `action: delete`](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#installation). Internally we translate this into a Kubernetes Secret deletion.

```mermaid
sequenceDiagram
    actor User
    User ->> GitHub: Remove application
    activate GitHub
    GitHub ->> GitHub App controller: Install event webhook
    activate GitHub App controller
    GitHub -->> User: Success
    deactivate GitHub
    GitHub App controller ->> Kubernetes API: Delete secret
    activate Kubernetes API
    deactivate Kubernetes API
    deactivate GitHub App controller
```

## Github push event handler

We want to react to push events on GitHub repositories. This is triggered via [`push` webhook event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push).

```mermaid
sequenceDiagram
    actor User
    User ->> GitHub: git push
    activate GitHub
    GitHub -->> User: Success
    GitHub ->> GitHub App controller: push event webhook
    deactivate GitHub
    activate GitHub App controller
    GitHub App controller ->> Kubernetes API: Request secret with token
    activate Kubernetes API
    Kubernetes API -->> GitHub App controller: Token
    deactivate Kubernetes API
    GitHub App controller ->> Kubernetes API: Schedule Tekton Task Run
    activate Kubernetes API
    Kubernetes API -->> GitHub App controller: Success
    deactivate Kubernetes API
    deactivate GitHub App controller
```

## Token management

Github App tokens are installation specific (each organization has its own set of credentials). In order to access git and GitHub API we need to maintain set of tokens, one for each installation/organization. GitHub tokens for applications expire in 1 hour after being generated hence we need to regenerate the token before it expires (with a margin for running pipelines).

Note: If a new token is generated for an installation, the previously created token for the same installation remains valid for normal lifespan - it is not invalidated.

```mermaid
sequenceDiagram
    loop Every 30 minutes
    GitHub App controller ->> Kubernetes API: Get secret for installation
    activate GitHub App controller
    activate Kubernetes API
    Kubernetes API -->> GitHub App controller: Secret
    deactivate Kubernetes API
    GitHub App controller ->> GitHub Auth: Get Token for installation
    activate GitHub Auth
    GitHub Auth -->> GitHub App controller: Token
    deactivate GitHub Auth
    GitHub App controller ->> Kubernetes API: Update secret for instalation
    activate Kubernetes API
    Kubernetes API -->> GitHub App controller: Success
    deactivate Kubernetes API
    deactivate GitHub App controller
    end
```
