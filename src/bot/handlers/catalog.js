const subscriptionService = require('../../services/subscriptionService');

const back = (to) => ({ text: 'Назад', callback_data: to });
const home = () => ({ text: 'Главное меню', callback_data: 'main_menu' });

async function showMainMenu(ctx) {
  const clubName = process.env.CLUB_NAME || 'FitAdmin Demo Club';
  const text =
    `Привет! Это ${clubName}.\n\n` +
    'Выберите, что хотите посмотреть:';
  const keyboard = {
    inline_keyboard: [
      [{ text: 'Абонементы', callback_data: 'menu_subscriptions' }],
      [{ text: 'Разовое посещение', callback_data: 'plan_single_visit' }],
      [{ text: 'Спецпредложения', callback_data: 'menu_special' }],
    ],
  };
  return editOrReply(ctx, text, keyboard);
}

async function showSubscriptionTypes(ctx) {
  const config = subscriptionService.loadConfig();
  const lines = config.types.map((type) => `• ${type.name}: ${type.description}`);
  const text =
    'Выберите тип абонемента:\n\n' +
    lines.join('\n');
  const keyboard = {
    inline_keyboard: [
      ...config.types.map((type) => [{ text: type.name, callback_data: `menu_type:${type.id}` }]),
      [{ text: 'Разовое посещение', callback_data: 'plan_single_visit' }],
      [back('main_menu'), home()],
    ],
  };
  return editOrReply(ctx, text, keyboard);
}

async function showTypePlans(ctx, typeId) {
  const config = subscriptionService.loadConfig();
  const type = config.types.find((t) => t.id === typeId);
  if (!type) return ctx.reply('Тип абонемента не найден.');

  const text =
    `<b>${type.name}</b>\n` +
    `${type.description}\n\n` +
    'Выберите срок:';
  const planButtons = type.plans.map((p) => [
    {
      text: `${p.duration} - ${subscriptionService.formatPrice(p.price)}`,
      callback_data: `plan_${p.id}`,
    },
  ]);
  const keyboard = {
    inline_keyboard: [...planButtons, [back('menu_subscriptions'), home()]],
  };
  return editOrReply(ctx, text, keyboard, { parse_mode: 'HTML' });
}

async function showPlanCard(ctx, planId) {
  const config = subscriptionService.loadConfig();

  if (config.single && config.single.id === planId) {
    const s = config.single;
    const price = subscriptionService.formatPrice(s.price);
    const text =
      `<b>${s.name}</b>\n\n` +
      `${s.description}\n\n` +
      `Срок: <b>${s.duration}</b>\n` +
      `Цена: <b>${price}</b>`;
    const keyboard = {
      inline_keyboard: [
        [{ text: `Выбрать - ${price}`, callback_data: `buy_${s.id}` }],
        [back('main_menu'), home()],
      ],
    };
    return editOrReply(ctx, text, keyboard, { parse_mode: 'HTML' });
  }

  let foundPlan = null;
  let foundType = null;
  for (const type of config.types) {
    const plan = type.plans.find((p) => p.id === planId);
    if (plan) {
      foundPlan = plan;
      foundType = type;
      break;
    }
  }
  if (!foundPlan) return ctx.reply('Абонемент не найден.');

  const price = subscriptionService.formatPrice(foundPlan.price);
  let text =
    `<b>${foundType.name} - ${foundPlan.duration}</b>\n\n` +
    `${foundType.description}\n\n` +
    `Срок: <b>${foundPlan.durationDisplay}</b>\n` +
    `Цена: <b>${price}</b>`;
  if (foundPlan.badge) text += `\n\n${foundPlan.badge}`;

  const keyboard = {
    inline_keyboard: [
      [{ text: `Выбрать - ${price}`, callback_data: `buy_${foundPlan.id}` }],
      [back(`menu_type:${foundType.id}`), home()],
    ],
  };
  return editOrReply(ctx, text, keyboard, { parse_mode: 'HTML' });
}

async function showSpecialOffers(ctx) {
  const config = subscriptionService.loadConfig();
  const clubName = process.env.CLUB_NAME || 'FitAdmin Demo Club';
  const { offers } = config.special;
  const phone = process.env.CLUB_PHONE || 'администратора клуба';

  let text = `<b>Спецпредложения ${clubName}</b>\n`;
  for (const offer of offers) {
    const price = subscriptionService.formatPrice(offer.price);
    text += `\n<b>${offer.name} - ${price}</b>\n${offer.description}\n`;
  }
  text += `\nОформление спецпредложений: через отдел продаж или по телефону ${phone}`;

  const keyboard = {
    inline_keyboard: [[back('main_menu'), home()]],
  };
  return editOrReply(ctx, text, keyboard, { parse_mode: 'HTML' });
}

async function editOrReply(ctx, text, keyboard, extra = {}) {
  const options = { ...extra, reply_markup: keyboard };
  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, options).catch(() => ctx.reply(text, options));
  }
  return ctx.reply(text, options);
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
