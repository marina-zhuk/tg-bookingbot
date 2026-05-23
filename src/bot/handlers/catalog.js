const subscriptionService = require('../../services/subscriptionService');

const back = (to) => ({ text: '◀️ Назад', callback_data: to });
const home = () => ({ text: '🏠 Главное меню', callback_data: 'main_menu' });

async function showMainMenu(ctx) {
  const clubName = process.env.CLUB_NAME || 'Demo Fitness Club';
  const text = `👋 Привет! Добро пожаловать в ${clubName}\n\nВыбери, что тебя интересует:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: '🎟 Абонементы', callback_data: 'menu_subscriptions' }],
      [{ text: '⭐ Специальные предложения', callback_data: 'menu_special' }],
      [{ text: '🚶 Разовое посещение', callback_data: 'plan_single_visit' }],
    ],
  };
  return editOrReply(ctx, text, keyboard);
}

async function showSubscriptionTypes(ctx) {
  const config = subscriptionService.loadConfig();
  const lines = config.types.map((type) => `${type.name} — ${type.description}`);
  const text = `Отлично! Выбери тип абонемента:\n${lines.join('\n')}`;
  const keyboard = {
    inline_keyboard: [
      ...config.types.map((type) => [{ text: type.name, callback_data: `menu_type:${type.id}` }]),
      [back('main_menu'), home()],
    ],
  };
  return editOrReply(ctx, text, keyboard);
}

async function showTypePlans(ctx, typeId) {
  const config = subscriptionService.loadConfig();
  const type = config.types.find((t) => t.id === typeId);
  if (!type) return ctx.reply('Тип абонемента не найден.');

  const text = `${type.name} абонемент\n${type.description}\nНа какой срок?`;
  const planButtons = type.plans.map((p) => [
    {
      text: `${p.duration} — ${subscriptionService.formatPrice(p.price)}`,
      callback_data: `plan_${p.id}`,
    },
  ]);
  const keyboard = {
    inline_keyboard: [...planButtons, [back('menu_subscriptions'), home()]],
  };
  return editOrReply(ctx, text, keyboard);
}

async function showPlanCard(ctx, planId) {
  const config = subscriptionService.loadConfig();

  if (config.single && config.single.id === planId) {
    const s = config.single;
    const price = subscriptionService.formatPrice(s.price);
    const text = `${s.name}\n${s.description}\n⏳ Срок: ${s.duration}\n💰 Цена: ${price}`;
    const keyboard = {
      inline_keyboard: [
        [{ text: `✅ Выбрать — ${price}`, callback_data: `buy_${s.id}` }],
        [back('main_menu'), home()],
      ],
    };
    return editOrReply(ctx, text, keyboard);
  }

  let foundPlan = null;
  let foundType = null;
  for (const type of config.types) {
    const plan = type.plans.find((p) => p.id === planId);
    if (plan) { foundPlan = plan; foundType = type; break; }
  }
  if (!foundPlan) return ctx.reply('Абонемент не найден.');

  const price = subscriptionService.formatPrice(foundPlan.price);
  let text =
    `${foundType.name} — ${foundPlan.duration}\n` +
    `${foundType.description}\n` +
    `⏳ Срок: ${foundPlan.durationDisplay}\n` +
    `💰 Цена: ${price}`;
  if (foundPlan.badge) text += `\n${foundPlan.badge}`;

  const keyboard = {
    inline_keyboard: [
      [{ text: `✅ Выбрать — ${price}`, callback_data: `buy_${foundPlan.id}` }],
      [back(`menu_type:${foundType.id}`), home()],
    ],
  };
  return editOrReply(ctx, text, keyboard);
}

async function showSpecialOffers(ctx) {
  const config = subscriptionService.loadConfig();
  const clubName = process.env.CLUB_NAME || 'Demo Fitness Club';
  const { offers } = config.special;
  const phone = process.env.CLUB_PHONE || 'администратора клуба';

  let text = `⭐ Специальные предложения ${clubName}\n`;
  for (const offer of offers) {
    const price = subscriptionService.formatPrice(offer.price);
    text += `\n${offer.name} — ${price}\n${offer.description}\n`;
  }
  text += `\n📞 Оформление только через отдел продаж в клубе или по телефону ${phone}`;

  const keyboard = {
    inline_keyboard: [[back('main_menu'), home()]],
  };
  return editOrReply(ctx, text, keyboard);
}

async function editOrReply(ctx, text, keyboard) {
  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { reply_markup: keyboard }).catch(() =>
      ctx.reply(text, { reply_markup: keyboard })
    );
  }
  return ctx.reply(text, { reply_markup: keyboard });
}

function registerCatalogHandler(bot) {
  bot.command('catalog', (ctx) => showMainMenu(ctx));
}

module.exports = {
  registerCatalogHandler,
  showMainMenu,
  showSubscriptionTypes,
  showTypePlans,
  showPlanCard,
  showSpecialOffers,
};
