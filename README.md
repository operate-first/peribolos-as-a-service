<p align="center">
  <a href="https://github.com/apps/peribolos">
    <img src="https://raw.githubusercontent.com/operate-first/peribolos-as-a-service/main/static/robot.svg" width="160" alt="Probot's logo, a cartoon robot" />
  </a>
</p>
<h3 align="center"><a href="https://github.com/apps/peribolos">Peribolos</a></h3>
<p align="center">GitHub organization management as code</p>
<p align="center">
  <a href="https://github.com/operate-first/peribolos-as-a-service/releases">
    <img alt="GitHub tag (latest by date)" src="https://img.shields.io/github/v/tag/operate-first/peribolos-as-a-service">
  </a>
  <a href="https://github.com/operate-first/peribolos-as-a-service/actions?query=workflow%3APush">
    <img alt="Build Status" src="https://img.shields.io/github/workflow/status/operate-first/peribolos-as-a-service/Push">
  </a>
  <a href="https://github.com/operate-first/peribolos-as-a-service">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/operate-first/peribolos-as-a-service">
  </a>
  <a href="https://github.com/operate-first/peribolos-as-a-service/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">
  </a>
  <a href="https://github.com/operate-first/peribolos-as-a-service/issues?q=is%3Aissue+is%3Aopen+label%3Akind%2Fbug">
    <img alt="Reported bugs" src="https://img.shields.io/github/issues-search/operate-first/peribolos-as-a-service?color=red&label=reported%20bugs&query=is%3Aopen%20label%3Akind%2Fbug">
  </a>
  <a href="https://github.com/operate-first/peribolos-as-a-service/issues?q=is%3Aissue+is%3Aopen+label%3Akind%2Fbug">
    <img alt="Feature requests" src="https://img.shields.io/github/issues-search/operate-first/peribolos-as-a-service?label=feature%20requests&query=is%3Aopen%20label%3Akind%2Ffeature">
  </a>
</p>

---

[peribolos]: https://github.com/kubernetes/test-infra/tree/master/prow/cmd/peribolos
[probot]: https://probot.github.io/

If you ever wanted to manage your GitHub organization as code where everybody can simply open a PR and ask to create a team or make a repository, wait no more! This provided [Peribolos][peribolos] instance can help you in .

We are neither the original creators or maintainers of the Peribolos code base. [Peribolos tool belongs to Kubernetes project][peribolos] and they deserve all the credit.

## How it works

Simply install this application. It will ensure a special `.github` repository exists in your organization. In addition to that, Peribolos will create a pull request to this repository for you with all your github organization settings exported to `peribolos.yaml` manifest.

Later, on any change to this manifest pushed to the default branch, Peribolos will apply those changes to your organization.

## Security implications

By installing this application you're granting a lot of permissions to our service - essentially granting Peribolos organization admin privileges. This is a great deal to us and we don't take security lightly. If you have any questions please review our [SUPPORT.md](SUPPORT.md) and [SECURITY.md](SECURITY.md) guides.

## Contributions

See [`CONTRIBUTING.md`](CONTRIBUTING.md) on how to contribute.

---

## Credit

See [`ACKNOWLEDGMENTS.md`](ACKNOWLEDGMENTS.md).

<p align="center">
  <a href="https://argocd.operate-first.cloud/applications/peribolos-as-a-service-smaug">
    <img alt="ArgoCD status" src="https://argocd.operate-first.cloud/api/badge?name=peribolos-as-a-service-smaug&revision=true">
  </a><br />
  <a href="https://console-openshift-console.apps.smaug.na.operate-first.cloud/k8s/cluster/projects/peribolos-as-a-service">
    <img alt="OpenShift namespace" src="https://img.shields.io/badge/OpenShift-peribolos--as--a--service-white?logo=redhatopenshift&logoColor=white&labelColor=ee0000">
  </a>
  <a href="https://peribolos.operate-first.cloud">
    <img alt="Route status" src="https://img.shields.io/website?label=Availability&url=https%3A%2F%2Fperibolos.operate-first.cloud%2Fhealthz">
  </a><br />
  <a href="https://quay.io/repository/operate-first/peribolos-as-a-service?tab=tags">
    <img alt="Controller image" src="https://img.shields.io/badge/Quay-operate--first%2Fperibolos--as--a--service-blue">
  </a><br />
  <a href="https://quay.io/repository/operate-first/peribolos?tab=tags">
    <img alt="Peribolos image" src="https://img.shields.io/badge/Quay-operate--first%2Fperibolos-blue">
  </a>
</p>
