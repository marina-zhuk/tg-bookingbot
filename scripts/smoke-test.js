const assert = require('node:assert');
const { mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

const tempDir = mkdtempSync(join(tmpdir(), 'fitadmin-smoke-'));

process.env.DB_PATH = join(tempDir, 'bot.db');
process.env.NOTIFIERS_PATH = join(tempDir, 'notifiers.json');
process.env.SUBSCRIPTIONS_PATH = './config/subscriptions.json';
process.env.BOT_TOKEN = process.env.BOT_TOKEN || '0000000000:demo_token_for_smoke_test_only';
process.env.ADMIN_IDS = process.env.ADMIN_IDS || '1';
process.env.TEST_MODE = 'true';
process.env.NODE_ENV = 'test';

try {
  const { runMigrations } = require('../src/db/migrations');
  const subscriptionService = require('../src/services/subscriptionService');
  const notifierService = require('../src/services/notifierService');
  const { createServer } = require('../src/webhook/server');

  runMigrations();

  const subscriptions = subscriptionService.loadAll(true);
  const types = subscriptionService.getTypes();
  const specialOffers = subscriptionService.loadSpecialOffers(true);

  assert.ok(subscriptions.length > 0, 'expected demo subscriptions to load');
  assert.ok(types.length > 0, 'expected subscription types to load');
  assert.ok(Array.isArray(specialOffers), 'expected special offers list');
  assert.ok(Array.isArray(notifierService.getAll()), 'expected notifiers list');

  const app = createServer();
  assert.equal(typeof app.listen, 'function', 'expected Express app');

  console.log('Smoke test OK');
  console.log(`subscriptions=${subscriptions.length}`);
  console.log(`types=${types.length}`);
  console.log(`specialOffers=${specialOffers.length}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
