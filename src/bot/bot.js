const { Telegraf } = require('telegraf');
const { createSessionMiddleware } = require('./session');
const { registerStartHandler } = require('./handlers/start');
const { registerCatalogHandler } = require('./handlers/catalog');
const { registerCallbackHandler } = require('./handlers/callbacks');
const { registerAdminHandler } = require('./handlers/admin');
const { registerAdminSubscriptionsHandler } = require('./handlers/adminSubscriptions');

function createBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN);

  bot.use(createSessionMiddleware());

  registerStartHandler(bot);
  registerCatalogHandler(bot);
  registerCallbackHandler(bot);
  registerAdminHandler(bot);
  registerAdminSubscriptionsHandler(bot);

  bot.catch((err, ctx) => {
    console.error(`Bot error for ${ctx.updateType}:`, err);
    ctx.reply('Произошла ошибка. Попробуйте ещё раз или напишите /start').catch(() => {});
  });

  return bot;
}

module.exports = { createBot };
