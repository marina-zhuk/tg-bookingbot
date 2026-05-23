const paymentService = require('../../services/paymentService');
const userService = require('../../services/userService');
const subscriptionService = require('../../services/subscriptionService');
const notifierService = require('../../services/notifierService');
const { buildSuccessMessage } = require('../../webhook/yookassaWebhook');

const TEST_MODE = process.env.TEST_MODE === 'true';

function userLabel(ctx) {
  const user = userService.findByTelegramId(ctx.from.id);
  if (!user) return ctx.from.username ? `@${ctx.from.username}` : String(ctx.from.id);
  const uname = ctx.from.username ? ` (@${ctx.from.username})` : '';
  return `${user.full_name}${uname} | ${user.phone} | ${user.email}`;
}

async function initiatePayment(ctx, subscriptionId) {
  const user = userService.findByTelegramId(ctx.from.id);
  if (!user) return ctx.reply('Пожалуйста, зарегистрируйтесь через /start');

  const sub = subscriptionService.findById(subscriptionId);
  if (!sub) return ctx.reply('Абонемент не найден. Попробуйте выбрать снова.');

  const paymentDbId = paymentService.createPaymentRecord({
    userId: user.id,
    subscriptionId: sub.id,
    subscriptionName: sub.name,
    amount: sub.price,
  });

  if (TEST_MODE) {
    const price = subscriptionService.formatPrice(sub.price);
    return ctx.reply(
      `💳 <b>Demo payment flow</b>\n\n` +
        `<b>${sub.name}</b>\nСумма: <b>${price}</b>\n\n` +
        'Это demo-режим: реальные деньги не списываются.',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Тестовая оплата успешно пройдена', callback_data: `tpay_ok:${paymentDbId}:${sub.id}` }],
            [{ text: '❌ Тестовая оплата отклонена', callback_data: `tpay_fail:${paymentDbId}:${sub.id}` }],
          ],
        },
      }
    );
  }

  const waitMsg = await ctx.reply('⏳ Создаём платёж...');

  try {
    const payment = await paymentService.createYookassaPayment({
      paymentDbId,
      amount: sub.price,
      subscriptionName: sub.name,
      returnUrl: 'https://t.me',
    });

    await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});

    await ctx.reply(
      `💳 <b>Оплата абонемента</b>\n\n<b>${sub.name}</b>\nСумма: <b>${subscriptionService.formatPrice(sub.price)}</b>\n\nНажмите кнопку ниже для оплаты. После успешной оплаты вы получите подтверждение здесь.`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: `💳 Оплатить ${subscriptionService.formatPrice(sub.price)}`, url: payment.confirmation.confirmation_url }],
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
          ],
        },
      }
    );
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});
    console.error('Payment creation error:', err);
    await ctx.reply('Ошибка при создании платежа. Попробуйте позже.');
  }
}

async function handleTestSuccess(ctx, paymentDbId, subId) {
  const sub = subscriptionService.findById(subId);
  const price = sub ? subscriptionService.formatPrice(sub.price) : '—';
  const subName = sub ? sub.name : subId;

  paymentService.markSucceededById(Number(paymentDbId));

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});

  await ctx.reply(buildSuccessMessage(subId), { parse_mode: 'HTML' });

  await notifierService.notifyAll(
    ctx.telegram,
    `💰 Demo payment completed: ${subName} — ${price}\nПользователь: ${userLabel(ctx)}`
  );
}

async function handleTestFail(ctx, paymentDbId, subId) {
  const sub = subscriptionService.findById(subId);
  const price = sub ? subscriptionService.formatPrice(sub.price) : '—';
  const subName = sub ? sub.name : subId;

  paymentService.markCanceledById(Number(paymentDbId));

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});

  await ctx.reply(
    `😔 Тестовая оплата отклонена.\n\n` +
      `Это demo-режим: реальные деньги не списываются.\n` +
      `Попробуйте ещё раз или обратитесь к администратору: ${process.env.CLUB_PHONE || 'администратору клуба'}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Попробовать снова', callback_data: `buy_${subId}` },
            { text: '🏠 Главное меню', callback_data: 'main_menu' },
          ],
        ],
      },
    }
  );

  await notifierService.notifyAll(
    ctx.telegram,
    `⚠️ Demo payment declined: ${subName} — ${price}\nПользователь: ${userLabel(ctx)}`
  );
}

module.exports = { initiatePayment, handleTestSuccess, handleTestFail };
