const { isAdmin } = require('../middlewares/adminGuard');
const svc = require('../../services/subscriptionService');
const { escapeHtml } = require('../../utils/html');

// Callback data prefixes handled by this module
const PREFIXES = [
  'subs_menu', 'subs_back', 'subs_history',
  'subs_edit:', 'subs_price:', 'subs_toggle:', 'subs_del:', 'subs_del_confirm:',
  'subs_add', 'subs_add_type:', 'subs_add_new_type',
  'subs_price_confirm', 'subs_price_cancel',
  'subs_add_confirm', 'subs_add_cancel',
  // special offers
  'spec_menu', 'spec_edit:', 'spec_toggle:', 'spec_del:', 'spec_del_confirm:',
  'spec_price:', 'spec_name:', 'spec_desc:',
  'spec_field_confirm', 'spec_field_cancel',
  'spec_add', 'spec_add_confirm', 'spec_add_cancel',
];

function isSubsCallback(data) {
  return PREFIXES.some((p) => (p.endsWith(':') ? data.startsWith(p) : data === p));
}

function adminLabel(ctx) {
  return ctx.from.first_name || ctx.from.username || String(ctx.from.id);
}

function parsePriceRubles(text) {
  const cleaned = text.replace(/\s/g, '').replace(',', '.');
  const rubles = parseFloat(cleaned);
  if (isNaN(rubles) || rubles <= 0 || rubles > 9_999_999) return null;
  return Math.round(rubles * 100);
}

function slugify(text) {
  return `type_${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

async function showSubscriptionsMenu(ctx) {
  const all = svc.loadAll(true);
  const active = all.filter((s) => s.is_active);
  const hidden = all.filter((s) => !s.is_active);

  const text =
    `🏷 <b>Управление абонементами</b>\n\n` +
    `Активных: <b>${active.length}</b>  |  Скрытых: <b>${hidden.length}</b>\n\n` +
    `Нажмите на абонемент чтобы изменить:`;

  const subButtons = all.map((s) => {
    const label = s.is_active
      ? `${s.type_name} — ${s.duration} | ${svc.formatPrice(s.price)}`
      : `🙈 [скрыт] ${s.type_name} — ${s.duration} | ${svc.formatPrice(s.price)}`;
    return [{ text: label, callback_data: `subs_edit:${s.id}` }];
  });

  const keyboard = {
    inline_keyboard: [
      ...subButtons,
      [{ text: '➕ Добавить абонемент', callback_data: 'subs_add' }],
      [{ text: '⭐ Спецпредложения', callback_data: 'spec_menu' }],
      [{ text: '📜 История изменений', callback_data: 'subs_history' }],
      [{ text: '◀️ В меню', callback_data: 'admin_back' }],
    ],
  };

  return editOrReply(ctx, text, keyboard);
}

async function showSubEditMenu(ctx, id) {
  const sub = svc.findById(id);
  if (!sub) return editOrReply(ctx, 'Абонемент не найден.', backKeyboard('subs_menu'));

  const status = sub.is_active ? '✅ активен' : '🙈 скрыт';
  const text =
    `✏️ <b>${escapeHtml(sub.type_name)} — ${escapeHtml(sub.duration)}</b>\n\n` +
    `💰 Цена: <b>${svc.formatPrice(sub.price)}</b>\n` +
    `📋 Описание: ${escapeHtml(sub.type_desc)}\n` +
    `Статус: ${status}` +
    (sub.badge ? `\n🏷 ${escapeHtml(sub.badge)}` : '');

  const toggleLabel = sub.is_active ? '🙈 Скрыть' : '👁 Показать';
  const keyboard = {
    inline_keyboard: [
      [{ text: '✏️ Изменить цену', callback_data: `subs_price:${id}` }],
      [{ text: toggleLabel, callback_data: `subs_toggle:${id}` }],
      [{ text: '🗑 Удалить', callback_data: `subs_del:${id}` }],
      [{ text: '◀️ Назад', callback_data: 'subs_menu' }],
    ],
  };

  return editOrReply(ctx, text, keyboard);
}

async function showAddTypeSelection(ctx) {
  const types = svc.getTypes();
  const typeButtons = types.map((t) => [
    { text: t.type_name, callback_data: `subs_add_type:${t.type_id}` },
  ]);
  const keyboard = {
    inline_keyboard: [
      ...typeButtons,
      [{ text: '🆕 Создать новый тип', callback_data: 'subs_add_new_type' }],
      [{ text: '❌ Отмена', callback_data: 'subs_menu' }],
    ],
  };
  return editOrReply(ctx, '📂 Выберите тип абонемента:', keyboard);
}

async function showHistory(ctx) {
  const rows = svc.getHistory(25);

  if (!rows.length) {
    return editOrReply(ctx, '📜 <b>История изменений</b>\n\n<i>Изменений пока нет.</i>', backKeyboard('subs_menu'));
  }

  const ACTION_LABELS = {
    price_change: '✏️ Изменена цена',
    added:        '➕ Добавлен',
    hidden:       '🙈 Скрыт',
    restored:     '👁 Показан',
    deleted:      '🗑 Удалён',
  };

  const lines = rows.map((r) => {
    const date = r.changed_at ? r.changed_at.slice(0, 16).replace('T', ' ') : '—';
    const subName = r.type_name
      ? `${escapeHtml(r.type_name)}${r.duration ? ' — ' + escapeHtml(r.duration) : ''}`
      : escapeHtml(r.subscription_id);
    const action = ACTION_LABELS[r.action] || escapeHtml(r.action);
    let detail = '';
    if (r.action === 'price_change') {
      try {
        const oldP = JSON.parse(r.old_value || '{}').price;
        const newP = JSON.parse(r.new_value || '{}').price;
        detail = `: ${svc.formatPrice(oldP)} → ${svc.formatPrice(newP)}`;
      } catch (_) {}
    }
    return `<b>${date}</b>  ${escapeHtml(r.admin_name || String(r.admin_telegram_id))}\n  ${action}: ${subName}${detail}`;
  });

  const text = `📜 <b>История изменений</b>\n\n${lines.join('\n\n')}`;
  return editOrReply(ctx, text, backKeyboard('subs_menu'));
}

// ---------------------------------------------------------------------------
// Special offers display
// ---------------------------------------------------------------------------

async function showSpecialOffersMenu(ctx) {
  const all = svc.loadSpecialOffers(true);
  const active = all.filter((o) => o.is_active).length;

  const text =
    `⭐ <b>Спецпредложения</b>\n\n` +
    `Активных: <b>${active}</b>  |  Скрытых: <b>${all.length - active}</b>\n\n` +
    `Нажмите на предложение чтобы изменить:`;

  const buttons = all.map((o) => {
    const label = o.is_active
      ? `${o.name} | ${svc.formatPrice(o.price)}`
      : `🙈 [скрыт] ${o.name} | ${svc.formatPrice(o.price)}`;
    return [{ text: label, callback_data: `spec_edit:${o.id}` }];
  });

  return editOrReply(ctx, text, {
    inline_keyboard: [
      ...buttons,
      [{ text: '➕ Добавить', callback_data: 'spec_add' }],
      [{ text: '◀️ Назад', callback_data: 'subs_menu' }],
    ],
  });
}

async function showSpecialEditMenu(ctx, id) {
  const o = svc.findSpecialOfferById(id);
  if (!o) return editOrReply(ctx, 'Предложение не найдено.', backKeyboard('spec_menu'));

  const status = o.is_active ? '✅ активно' : '🙈 скрыто';
  const text =
    `⭐ <b>${escapeHtml(o.name)}</b>\n\n` +
    `💰 Цена: <b>${svc.formatPrice(o.price)}</b>\n` +
    `📋 Описание: ${escapeHtml(o.description)}\n` +
    `Статус: ${status}`;

  return editOrReply(ctx, text, {
    inline_keyboard: [
      [{ text: '✏️ Изменить цену',     callback_data: `spec_price:${id}` }],
      [{ text: '✏️ Изменить название', callback_data: `spec_name:${id}` }],
      [{ text: '📝 Изменить описание', callback_data: `spec_desc:${id}` }],
      [{ text: o.is_active ? '🙈 Скрыть' : '👁 Показать', callback_data: `spec_toggle:${id}` }],
      [{ text: '🗑 Удалить',           callback_data: `spec_del:${id}` }],
      [{ text: '◀️ Назад',             callback_data: 'spec_menu' }],
    ],
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function editOrReply(ctx, text, keyboard) {
  const opts = { parse_mode: 'HTML', reply_markup: keyboard };
  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, opts).catch(() => ctx.reply(text, opts));
  }
  return ctx.reply(text, opts);
}

function backKeyboard(cb) {
  return { inline_keyboard: [[{ text: '◀️ Назад', callback_data: cb }]] };
}

function cancelKeyboard(cb) {
  return { inline_keyboard: [[{ text: '❌ Отмена', callback_data: cb }]] };
}

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

function registerAdminSubscriptionsHandler(bot) {
  // ── Callback queries ──────────────────────────────────────────────────────
  bot.on('callback_query', async (ctx, next) => {
    const data = ctx.callbackQuery?.data || '';
    if (!isSubsCallback(data)) return next();
    if (!isAdmin(ctx.from?.id)) { await ctx.answerCbQuery('⛔ Нет доступа'); return; }
    await ctx.answerCbQuery();

    if (data === 'subs_menu' || data === 'subs_back') return showSubscriptionsMenu(ctx);

    if (data.startsWith('subs_edit:')) return showSubEditMenu(ctx, data.slice(10));

    if (data.startsWith('subs_price:')) {
      const id = data.slice(11);
      const sub = svc.findById(id);
      if (!sub) return ctx.reply('Абонемент не найден.');
      ctx.session.step = 'subs_edit_price';
      ctx.session.editingSubId = id;
      return ctx.reply(
        `✏️ <b>${escapeHtml(sub.type_name)} — ${escapeHtml(sub.duration)}</b>\n` +
        `Текущая цена: <b>${svc.formatPrice(sub.price)}</b>\n\n` +
        `Введите новую цену в рублях (например: <code>15000</code>):`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard(`subs_edit:${id}`) }
      );
    }

    if (data.startsWith('subs_toggle:')) {
      const id = data.slice(12);
      svc.toggleActive(id, ctx.from.id, adminLabel(ctx));
      return showSubscriptionsMenu(ctx);
    }

    if (data.startsWith('subs_del:')) {
      const id = data.slice(9);
      const sub = svc.findById(id);
      if (!sub) return ctx.reply('Абонемент не найден.');
      return editOrReply(
        ctx,
        `🗑 Удалить абонемент?\n\n<b>${sub.type_name} — ${sub.duration}</b>\n` +
        `💰 ${svc.formatPrice(sub.price)}\n\n<b>Это действие необратимо!</b>`,
        {
          inline_keyboard: [
            [{ text: '✅ Да, удалить', callback_data: `subs_del_confirm:${id}` }],
            [{ text: '❌ Отмена', callback_data: `subs_edit:${id}` }],
          ],
        }
      );
    }

    if (data.startsWith('subs_del_confirm:')) {
      const id = data.slice(17);
      svc.deleteSubscription(id, ctx.from.id, adminLabel(ctx));
      await ctx.editMessageText('✅ Абонемент удалён.').catch(() => {});
      return showSubscriptionsMenu(ctx);
    }

    if (data === 'subs_add') return showAddTypeSelection(ctx);

    if (data.startsWith('subs_add_type:')) {
      const typeId = data.slice(14);
      const types = svc.getTypes();
      const type = types.find((t) => t.type_id === typeId);
      if (!type) return ctx.reply('Тип не найден.');
      ctx.session.pendingSub = { typeId: type.type_id, typeName: type.type_name, typeDesc: type.type_desc };
      ctx.session.step = 'subs_add_duration';
      return ctx.reply(
        `✅ Тип: <b>${type.type_name}</b>\n\nВведите срок действия\n(например: <code>3 месяца</code>):`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('subs_menu') }
      );
    }

    if (data === 'subs_add_new_type') {
      ctx.session.pendingSub = {};
      ctx.session.step = 'subs_add_type_name';
      return ctx.reply(
        'Введите название нового типа\n(например: <code>🧘 Йога</code>):',
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('subs_menu') }
      );
    }

    if (data === 'subs_price_confirm') {
      const { editingSubId: id, editingNewPrice: newPrice } = ctx.session;
      svc.updatePrice(id, newPrice, ctx.from.id, adminLabel(ctx));
      ctx.session.step = null;
      ctx.session.editingSubId = null;
      ctx.session.editingNewPrice = null;
      await ctx.editMessageText('✅ Цена обновлена!').catch(() => {});
      return showSubscriptionsMenu(ctx);
    }

    if (data === 'subs_price_cancel') {
      const id = ctx.session.editingSubId;
      ctx.session.step = null;
      ctx.session.editingSubId = null;
      ctx.session.editingNewPrice = null;
      return showSubEditMenu(ctx, id);
    }

    if (data === 'subs_add_confirm') {
      const p = ctx.session.pendingSub;
      svc.addSubscription(p, ctx.from.id, adminLabel(ctx));
      ctx.session.step = null;
      ctx.session.pendingSub = null;
      await ctx.editMessageText('✅ Абонемент добавлен!').catch(() => {});
      return showSubscriptionsMenu(ctx);
    }

    if (data === 'subs_add_cancel') {
      ctx.session.step = null;
      ctx.session.pendingSub = null;
      return showSubscriptionsMenu(ctx);
    }

    if (data === 'subs_history') return showHistory(ctx);

    // ── Special offers callbacks ────────────────────────────────────────────
    if (data === 'spec_menu') return showSpecialOffersMenu(ctx);

    if (data.startsWith('spec_edit:')) return showSpecialEditMenu(ctx, +data.slice(10));

    if (data.startsWith('spec_toggle:')) {
      svc.toggleSpecialActive(+data.slice(12), ctx.from.id, adminLabel(ctx));
      return showSpecialOffersMenu(ctx);
    }

    if (data.startsWith('spec_del:')) {
      const id = +data.slice(9);
      const o = svc.findSpecialOfferById(id);
      if (!o) return ctx.reply('Предложение не найдено.');
      return editOrReply(ctx,
        `🗑 Удалить спецпредложение?\n\n<b>${o.name}</b>\n💰 ${svc.formatPrice(o.price)}\n\n<b>Это действие необратимо!</b>`,
        { inline_keyboard: [
          [{ text: '✅ Да, удалить', callback_data: `spec_del_confirm:${id}` }],
          [{ text: '❌ Отмена',      callback_data: `spec_edit:${id}` }],
        ]}
      );
    }

    if (data.startsWith('spec_del_confirm:')) {
      svc.deleteSpecialOffer(+data.slice(17), ctx.from.id, adminLabel(ctx));
      await ctx.editMessageText('✅ Предложение удалено.').catch(() => {});
      return showSpecialOffersMenu(ctx);
    }

    // edit field: spec_price:, spec_name:, spec_desc:
    for (const [prefix, field, label] of [
      ['spec_price:', 'price',       'новую цену в рублях (например: <code>46000</code>)'],
      ['spec_name:',  'name',        'новое название (например: <code>⭐ Акция</code>)'],
      ['spec_desc:',  'description', 'новое описание'],
    ]) {
      if (data.startsWith(prefix)) {
        const id = +data.slice(prefix.length);
        ctx.session.editingSpecId    = id;
        ctx.session.editingSpecField = field;
        ctx.session.step             = 'spec_edit_field';
        const o = svc.findSpecialOfferById(id);
        const cur = field === 'price' ? svc.formatPrice(o.price) : escapeHtml(o[field]);
        return ctx.reply(
          `Текущее значение: <b>${cur}</b>\n\nВведите ${label}:`,
          { parse_mode: 'HTML', reply_markup: cancelKeyboard(`spec_edit:${id}`) }
        );
      }
    }

    if (data === 'spec_field_confirm') {
      const { editingSpecId: id, editingSpecField: field, editingSpecNewValue: val } = ctx.session;
      svc.updateSpecialOffer(id, field, val, ctx.from.id, adminLabel(ctx));
      ctx.session.step = null; ctx.session.editingSpecId = null;
      ctx.session.editingSpecField = null; ctx.session.editingSpecNewValue = null;
      await ctx.editMessageText('✅ Сохранено!').catch(() => {});
      return showSpecialEditMenu(ctx, id);
    }

    if (data === 'spec_field_cancel') {
      const id = ctx.session.editingSpecId;
      ctx.session.step = null; ctx.session.editingSpecId = null;
      ctx.session.editingSpecField = null; ctx.session.editingSpecNewValue = null;
      return showSpecialEditMenu(ctx, id);
    }

    if (data === 'spec_add') {
      ctx.session.pendingSpec = {};
      ctx.session.step = 'spec_add_name';
      return ctx.reply(
        'Введите название спецпредложения\n(например: <code>🏊 Полный — 1 год + бонусы</code>):',
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('spec_menu') }
      );
    }

    if (data === 'spec_add_confirm') {
      const p = ctx.session.pendingSpec;
      svc.addSpecialOffer(p, ctx.from.id, adminLabel(ctx));
      ctx.session.step = null; ctx.session.pendingSpec = null;
      await ctx.editMessageText('✅ Спецпредложение добавлено!').catch(() => {});
      return showSpecialOffersMenu(ctx);
    }

    if (data === 'spec_add_cancel') {
      ctx.session.step = null; ctx.session.pendingSpec = null;
      return showSpecialOffersMenu(ctx);
    }
  });

  // ── Text input for multi-step flows ───────────────────────────────────────
  bot.on('text', async (ctx, next) => {
    const step = ctx.session.step;
    if (!step || (!step.startsWith('subs_') && !step.startsWith('spec_'))) return next();
    if (!isAdmin(ctx.from?.id)) return next();

    const text = ctx.message.text.trim();

    // States waiting for button press — remind user
    if (step === 'subs_price_preview' || step === 'subs_add_preview') {
      return ctx.reply('Используйте кнопки выше для подтверждения или отмены.');
    }

    if (step === 'subs_edit_price') {
      const kopecks = parsePriceRubles(text);
      if (!kopecks) {
        return ctx.reply(
          'Неверный формат. Введите цену числом в рублях, например: <code>15000</code>',
          { parse_mode: 'HTML' }
        );
      }
      const sub = svc.findById(ctx.session.editingSubId);
      ctx.session.editingNewPrice = kopecks;
      ctx.session.step = 'subs_price_preview';
      return ctx.reply(
        `Новая цена: <b>${svc.formatPrice(kopecks)}</b>\n` +
        `Было: ${svc.formatPrice(sub.price)}\n\nПодтвердить?`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Сохранить', callback_data: 'subs_price_confirm' },
              { text: '❌ Отмена', callback_data: 'subs_price_cancel' },
            ]],
          },
        }
      );
    }

    if (step === 'subs_add_type_name') {
      ctx.session.pendingSub.typeId = slugify(text);
      ctx.session.pendingSub.typeName = text;
      ctx.session.step = 'subs_add_type_desc';
      return ctx.reply(
        `✅ Название: <b>${escapeHtml(text)}</b>\n\nВведите описание типа\n(например: <code>Йога и медитация</code>):`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('subs_menu') }
      );
    }

    if (step === 'subs_add_type_desc') {
      ctx.session.pendingSub.typeDesc = text;
      ctx.session.step = 'subs_add_duration';
      return ctx.reply(
        `✅ Описание: <b>${escapeHtml(text)}</b>\n\nВведите срок действия\n(например: <code>3 месяца</code>):`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('subs_menu') }
      );
    }

    if (step === 'subs_add_duration') {
      ctx.session.pendingSub.duration = text;
      ctx.session.pendingSub.duration_display = text;
      ctx.session.step = 'subs_add_price';
      return ctx.reply(
        `✅ Срок: <b>${escapeHtml(text)}</b>\n\nВведите цену в рублях\n(например: <code>15000</code>):`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('subs_menu') }
      );
    }

    if (step === 'subs_add_price') {
      const kopecks = parsePriceRubles(text);
      if (!kopecks) {
        return ctx.reply(
          'Неверный формат. Введите цену числом в рублях, например: <code>15000</code>',
          { parse_mode: 'HTML' }
        );
      }
      const p = ctx.session.pendingSub;
      p.price = kopecks;
      ctx.session.step = 'subs_add_preview';
      return ctx.reply(
        `<b>Новый абонемент:</b>\n\n` +
        `Тип: ${escapeHtml(p.typeName)}\n` +
        (p.typeDesc ? `Описание: ${escapeHtml(p.typeDesc)}\n` : '') +
        `Срок: ${escapeHtml(p.duration)}\n` +
        `Цена: <b>${svc.formatPrice(kopecks)}</b>\n\n` +
        `Сохранить?`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Сохранить', callback_data: 'subs_add_confirm' },
              { text: '❌ Отмена', callback_data: 'subs_add_cancel' },
            ]],
          },
        }
      );
    }

    // ── Special offers text steps ──────────────────────────────────────────
    if (step === 'spec_edit_field') {
      const field = ctx.session.editingSpecField;
      let value;
      if (field === 'price') {
        value = parsePriceRubles(text);
        if (!value) return ctx.reply('Неверный формат. Введите цену числом в рублях, например: <code>46000</code>', { parse_mode: 'HTML' });
      } else {
        value = text;
      }
      ctx.session.editingSpecNewValue = value;
      ctx.session.step = 'spec_edit_preview';
      const display = field === 'price' ? svc.formatPrice(value) : escapeHtml(value);
      return ctx.reply(
        `Новое значение: <b>${display}</b>\n\nСохранить?`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[
            { text: '✅ Сохранить', callback_data: 'spec_field_confirm' },
            { text: '❌ Отмена',    callback_data: 'spec_field_cancel' },
          ]]},
        }
      );
    }

    if (step === 'spec_edit_preview') {
      return ctx.reply('Используйте кнопки выше для подтверждения или отмены.');
    }

    if (step === 'spec_add_name') {
      ctx.session.pendingSpec.name = text;
      ctx.session.step = 'spec_add_price';
      return ctx.reply(
        `✅ Название: <b>${escapeHtml(text)}</b>\n\nВведите цену в рублях\n(например: <code>46000</code>):`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('spec_menu') }
      );
    }

    if (step === 'spec_add_price') {
      const kopecks = parsePriceRubles(text);
      if (!kopecks) return ctx.reply('Неверный формат. Введите цену числом в рублях.', { parse_mode: 'HTML' });
      ctx.session.pendingSpec.price = kopecks;
      ctx.session.step = 'spec_add_desc';
      return ctx.reply(
        `✅ Цена: <b>${svc.formatPrice(kopecks)}</b>\n\nВведите описание:`,
        { parse_mode: 'HTML', reply_markup: cancelKeyboard('spec_menu') }
      );
    }

    if (step === 'spec_add_desc') {
      const p = ctx.session.pendingSpec;
      p.description = text;
      ctx.session.step = 'spec_add_preview';
      return ctx.reply(
        `<b>Новое спецпредложение:</b>\n\n` +
        `Название: ${escapeHtml(p.name)}\n` +
        `Цена: <b>${svc.formatPrice(p.price)}</b>\n` +
        `Описание: ${escapeHtml(p.description)}\n\nСохранить?`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[
            { text: '✅ Сохранить', callback_data: 'spec_add_confirm' },
            { text: '❌ Отмена',    callback_data: 'spec_add_cancel' },
          ]]},
        }
      );
    }

    if (step === 'spec_add_preview') {
      return ctx.reply('Используйте кнопки выше для подтверждения или отмены.');
    }
  });
}

module.exports = { registerAdminSubscriptionsHandler, showSubscriptionsMenu };
