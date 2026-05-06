const { adminGuard, isAdmin } = require('../middlewares/adminGuard');
const { generateCSV } = require('../../services/exportService');
const { broadcast } = require('../../services/broadcastService');
const notifierService = require('../../services/notifierService');
const db = require('../../db/database');
const { escapeHtml } = require('../../utils/html');

function registerAdminHandler(bot) {
  bot.command('admin', adminGuard, showAdminMenu);
  bot.command('broadcast', adminGuard, startBroadcast);
  bot.command('admins', adminGuard, (ctx) => showNotifiersMenu(ctx));

  // Handle forwarded messages and plain IDs for notifier_add step
  bot.on('message', async (ctx, next) => {
    if (ctx.session.step !== 'notifier_add') return next();
    if (!isAdmin(ctx.from?.id)) return next();

    const msg = ctx.message;
    let telegram_id, username;

    if (msg.forward_from) {
      telegram_id = msg.forward_from.id;
      username = msg.forward_from.username || null;
    } else if (msg.forward_sender_name) {
      return ctx.reply(
        'У этого пользователя закрытый профиль — ID получить нельзя.\n' +
          'Попросите его отправить вам свой Telegram ID или введите его вручную числом.'
      );
    } else if (msg.text) {
      const parsed = parseInt(msg.text.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        return ctx.reply('Введите числовой Telegram ID или перешлите любое сообщение от нужного человека.');
      }
      telegram_id = parsed;
      username = null;
    } else {
      return ctx.reply('Введите числовой Telegram ID или перешлите любое сообщение от нужного человека.');
    }

    ctx.session.step = 'done';
    const added = notifierService.add({ telegram_id, username });
    const label = username ? `@${username}` : String(telegram_id);
    await ctx.reply(added ? `✅ Добавлен: ${label}` : `ℹ️ Уже в списке: ${label}`);
    return showNotifiersMenu(ctx);
  });

  bot.on('callback_query', async (ctx, next) => {
    const data = ctx.callbackQuery.data;

    const adminPrefixes = ['admin_back', 'admin_list', 'admin_export', 'admin_broadcast_start',
      'admin_bc_send', 'admin_bc_cancel', 'notif_menu', 'notif_add', 'notif_del_list'];
    const isAdminCb = adminPrefixes.includes(data) || data.startsWith('notif_del:');

    if (!isAdminCb) return next();

    if (!isAdmin(ctx.from?.id)) {
      await ctx.answerCbQuery('⛔ Нет доступа');
      return;
    }

    if (data === 'admin_back') {
      await ctx.answerCbQuery();
      return showAdminMenu(ctx);
    }
    if (data === 'admin_list') {
      await ctx.answerCbQuery();
      return showPaidList(ctx);
    }
    if (data === 'admin_export') {
      await ctx.answerCbQuery();
      return exportCSV(ctx);
    }
    if (data === 'admin_broadcast_start') {
      await ctx.answerCbQuery();
      return startBroadcast(ctx);
    }
    if (data === 'admin_bc_send') {
      await ctx.answerCbQuery();
      return runBroadcast(ctx, bot);
    }
    if (data === 'admin_bc_cancel') {
      await ctx.answerCbQuery();
      ctx.session.step = 'done';
      ctx.session.broadcastText = null;
      return ctx.reply('Рассылка отменена.');
    }
    if (data === 'notif_menu') {
      await ctx.answerCbQuery();
      return showNotifiersMenu(ctx);
    }
    if (data === 'notif_add') {
      await ctx.answerCbQuery();
      ctx.session.step = 'notifier_add';
      return ctx.reply(
        'Перешлите любое сообщение от нужного человека\nили введите его Telegram ID числом:'
      );
    }
    if (data === 'notif_del_list') {
      await ctx.answerCbQuery();
      return showNotifierDeleteList(ctx);
    }
    if (data.startsWith('notif_del:')) {
      await ctx.answerCbQuery();
      const id = parseInt(data.slice(10), 10);
      notifierService.remove(id);
      return showNotifiersMenu(ctx);
    }
  });

  bot.on('text', async (ctx, next) => {
    if (ctx.session.step !== 'admin_broadcast_input') return next();
    if (!isAdmin(ctx.from?.id)) return next();

    const text = ctx.message.text;
    ctx.session.broadcastText = text;
    ctx.session.step = 'admin_broadcast_preview';

    const count = db.prepare(
      'SELECT COUNT(*) as n FROM visitors WHERE is_blocked = 0'
    ).get().n;

    await ctx.reply(
      `📋 <b>Предпросмотр рассылки</b>\n\nПолучателей: <b>${count}</b>\n\n` +
        `─────────────────\n${text}\n─────────────────\n\nОтправить?`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Отправить', callback_data: 'admin_bc_send' },
              { text: '❌ Отмена', callback_data: 'admin_bc_cancel' },
            ],
          ],
        },
      }
    );
  });
}

async function showNotifiersMenu(ctx) {
  const notifiers = notifierService.getAll();

  let text = '👥 <b>Управление уведомлениями</b>\n\n';
  if (notifiers.length === 0) {
    text += '<i>Дополнительных получателей нет.</i>';
  } else {
    text += 'Текущие получатели:\n';
    text += notifiers
      .map((n) => `• ${n.username ? '@' + n.username : n.telegram_id}`)
      .join('\n');
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: '➕ Добавить', callback_data: 'notif_add' },
        { text: '🗑 Удалить', callback_data: 'notif_del_list' },
      ],
    ],
  };

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() =>
      ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
    );
  }
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

async function showNotifierDeleteList(ctx) {
  const notifiers = notifierService.getAll();

  if (notifiers.length === 0) {
    return ctx.editMessageText('👥 <b>Управление уведомлениями</b>\n\n<i>Список пуст — некого удалять.</i>', {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'notif_menu' }]] },
    }).catch(() => ctx.reply('Список пуст.'));
  }

  const buttons = notifiers.map((n) => [
    {
      text: `🗑 ${n.username ? '@' + n.username : n.telegram_id}`,
      callback_data: `notif_del:${n.telegram_id}`,
    },
  ]);
  buttons.push([{ text: '◀️ Назад', callback_data: 'notif_menu' }]);

  return ctx.editMessageText('Выберите получателя для удаления:', {
    reply_markup: { inline_keyboard: buttons },
  }).catch(() =>
    ctx.reply('Выберите получателя для удаления:', { reply_markup: { inline_keyboard: buttons } })
  );
}

async function startBroadcast(ctx) {
  ctx.session.step = 'admin_broadcast_input';
  ctx.session.broadcastText = null;
  await ctx.reply('📝 Введите текст рассылки (поддерживается HTML-форматирование):');
}

async function runBroadcast(ctx, bot) {
  const text = ctx.session.broadcastText;
  if (!text) return ctx.reply('Текст рассылки не найден. Начните заново: /broadcast');

  ctx.session.step = 'done';
  ctx.session.broadcastText = null;

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
  const waitMsg = await ctx.reply('⏳ Отправляем рассылку...');

  const result = await broadcast(bot, text);

  await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});
  await ctx.reply(
    `✅ Рассылка завершена\n\n` +
      `📤 Отправлено: ${result.sent}\n` +
      `❌ Ошибок: ${result.failed}\n` +
      `👥 Всего получателей: ${result.total}`
  );
}

async function showAdminMenu(ctx) {
  const totalVisitors = db.prepare('SELECT COUNT(*) as n FROM visitors').get().n;
  const totalPaid = db
    .prepare("SELECT COUNT(*) as n FROM payments WHERE status = 'succeeded'")
    .get().n;

  const text = `🛠 <b>Панель администратора</b>\n\n` +
    `👤 Пользователей бота: ${totalVisitors}\n` +
    `✅ Оплат: ${totalPaid}`;
  const opts = {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Список оплативших', callback_data: 'admin_list' }],
        [{ text: '📥 Экспорт CSV', callback_data: 'admin_export' }],
        [{ text: '📣 Рассылка', callback_data: 'admin_broadcast_start' }],
        [{ text: '🏷 Абонементы и цены', callback_data: 'subs_menu' }],
        [{ text: '👥 Уведомления', callback_data: 'notif_menu' }],
      ],
    },
  };

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, opts).catch(() => ctx.reply(text, opts));
  }
  await ctx.reply(text, opts);
}

async function showPaidList(ctx) {
  const rows = db
    .prepare(
      `SELECT u.full_name, u.phone, u.email, p.subscription_name, p.paid_at
       FROM payments p JOIN users u ON u.id = p.user_id
       WHERE p.status = 'succeeded'
       ORDER BY p.paid_at DESC LIMIT 20`
    )
    .all();

  if (!rows.length) return ctx.reply('Оплат пока нет.');

  const lines = rows.map(
    (r, i) =>
      `${i + 1}. <b>${escapeHtml(r.full_name)}</b>\n` +
      `   📞 ${escapeHtml(r.phone)} | 📧 ${escapeHtml(r.email)}\n` +
      `   🏷 ${escapeHtml(r.subscription_name)}\n` +
      `   📅 ${r.paid_at?.slice(0, 10) || '—'}`
  );

  await ctx.reply(
    `✅ <b>Оплатившие (последние 20)</b>\n\n${lines.join('\n\n')}` +
      (rows.length === 20 ? '\n\n<i>Для полного списка используйте экспорт CSV.</i>' : ''),
    { parse_mode: 'HTML' }
  );
}

async function exportCSV(ctx) {
  const csv = generateCSV();
  const date = new Date().toISOString().slice(0, 10);
  await ctx.replyWithDocument({ source: csv, filename: `payments_${date}.csv` });
}

module.exports = { registerAdminHandler };
