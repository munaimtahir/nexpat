/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env jest */
const detox = require('detox');
const config = require('../detox.config.js');
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(120000);

beforeAll(async () => {
  await detox.init(config, { reuse: true });
}, 120000);

afterAll(async () => {
  await detox.cleanup();
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterEach(async () => {
  await adapter.afterEach();
});
