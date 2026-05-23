require('dotenv').config();
const { createBot } = require('./bot/bot');
const { runMigrations } = require('./db/migrations');
const { createServer } = require('./webhook/server');
const { registerYookassaWebhook } = require('./webhook/yookassaWebhook');
const { startScheduler } = require('./services/reportService');

const BOT_LAUNCH_TIMEOUT_MS = 30_000;

function validateEnv() {
  const required = ['BOT_TOKEN'];
  if (process.env.NODE_ENV === 'production') required.push('WEBHOOK_DOMAIN');
  if (process.env.TEST_MODE !== 'true') required.push('YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY');
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function listen(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.once('error', reject);
  });
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function main() {
  validateEnv();
  runMigrations();

  const bot = createBot();
  const app = createServer();

  registerYookassaWebhook(app, bot);

  const port = process.env.PORT || 3000;

  if (process.env.NODE_ENV === 'production') {
    const domain = process.env.WEBHOOK_DOMAIN;
    const webhookPath = process.env.WEBHOOK_PATH || '/telegram';

    app.use(bot.webhookCallback(webhookPath));
    await listen(app, port);
    console.log(`Server running on port ${port}`);
    await bot.telegram.setWebhook(`${domain}${webhookPath}`);
    console.log(`Telegram webhook set to ${domain}${webhookPath}`);
  } else {
    await listen(app, port);
    console.log(`Express listening on port ${port} (YooKassa webhook)`);
    console.log('Bot starting in polling mode...');
    await withTimeout(
      bot.launch({ dropPendingUpdates: true }),
      BOT_LAUNCH_TIMEOUT_MS,
      'Telegram bot launch timed out. Check BOT_TOKEN, network access, VPN/proxy, or Telegram API availability.'
    );
    console.log('Bot is running. Send /start in Telegram to test.');
  }

  startScheduler(bot.telegram);

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
