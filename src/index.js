require('dotenv').config();
const { createBot } = require('./bot/bot');
const { runMigrations } = require('./db/migrations');
const { createServer } = require('./webhook/server');
const { registerYookassaWebhook } = require('./webhook/yookassaWebhook');
const { startScheduler } = require('./services/reportService');

function validateEnv() {
  const required = ['BOT_TOKEN'];
  if (process.env.NODE_ENV === 'production') required.push('WEBHOOK_DOMAIN');
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env variables: ${missing.join(', ')}`);
    process.exit(1);
  }
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
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    await bot.telegram.setWebhook(`${domain}${webhookPath}`);
    console.log(`Telegram webhook set to ${domain}${webhookPath}`);
  } else {
    app.listen(port, () => {
      console.log(`Express listening on port ${port} (YooKassa webhook)`);
    });
    console.log('Bot starting in polling mode...');
    bot.launch({ dropPendingUpdates: true });
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
