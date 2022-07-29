// You can import your modules
// import index from '../src/index'

import nock from 'nock';
// Requiring our app implementation
import peribolosController from '../src/app';
import { ProbotOctokit } from 'probot';
import App from '../src/app'
import { CoreV1Api, V1Secret, CustomObjectsApi } from '@kubernetes/client-node';
import { IncomingMessage } from 'node:http';
// Requiring our fixtures
const fs = require('fs');
const path = require('path');
const installationCreated = require('./fixtures/installation.created');
const installationCreatedGithubExists = require('./fixtures/installation.created.githubExists');

const privateKey = fs.readFileSync(
  path.join(__dirname, 'fixtures/mock-cert.pem'),
  'utf-8'
);

describe('My Probot app', () => {
  let application: any;

  beforeEach(() => {
    nock.disableNetConnect();
    application = new App({
      appId: 123,
      privateKey,
      githubToken: 'test',
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    application.load(peribolosController);
  });

  describe('on installation', () => {
    it('creates new k8 secret', async () => {
      const mockCreateSecret = jest
        .spyOn(CoreV1Api.prototype, 'createNamespacedSecret')
        .mockReturnValue(
          null as unknown as Promise<{
            response: IncomingMessage;
            body: V1Secret;
          }>
        );
      // .mockImplementation(() => {
      //   return new Promise(resolve => {
      //     resolve({response: null as unknown as IncomingMessage, body: null as unknown as V1Secret});
      //   });
      // });
      await application.receive({
        name: 'installation',
        payload: installationCreated,
      });
      expect(mockCreateSecret).toHaveBeenCalled();
    });

    it('creates .github repo', async () => {
      const repoCreated = nock('https://api.github.com')
        .post('/orgs/test_user/repos', '{"name":".github"}')
        .reply(200, 'ok');
      await application.receive({
        name: 'installation',
        payload: installationCreated,
      });
      expect(repoCreated.isDone()).toBe(true);
    });

    it("doesn't create .github if it already exists", async () => {
      const repoCreated = nock('https://api.github.com')
        .post('/orgs/test_user/repos', '{"name":".github"}')
        .reply(200, 'ok');
      await application.receive({
        name: 'installation',
        payload: installationCreatedGithubExists,
      });
      expect(repoCreated.isDone()).toBe(false);
    });

    it('schedules tekton task for config dump', async () => {
      const mockCreateCRD = jest
        .spyOn(CustomObjectsApi.prototype, 'createNamespacedCustomObject')
        .mockReturnValue(
          null as unknown as Promise<{
            response: IncomingMessage;
            body: object;
          }>
        );
      await application.receive({
        name: 'installation',
        payload: installationCreated,
      });
      const funcCall = mockCreateCRD.mock.calls[0];
      expect(funcCall[0]).toBe('tekton.dev'); // NOTE: I'm not sure if this is a sufficient test as we may add more tekton tasks to installation
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
