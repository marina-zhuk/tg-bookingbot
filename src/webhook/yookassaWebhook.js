const paymentService = require('../services/paymentService');

function buildSuccessMessage(subscriptionId) {
  const isSingleVisit = subscriptionId === 'single_visit';

  const header = isSingleVisit
    ? '🎉 <b>Оплата подтверждена!</b>\n\n'
    : '🎉 <b>Оплата подтверждена! Ваш абонемент оформлен.</b>\n\n';

  const activation = isSingleVisit ? '' :
    'ℹ️ <b>Активация абонемента:</b>\n' +
    '• У вас есть 1 месяц с момента покупки для первого визита\n' +
    '• После истечения месяца абонемент активируется автоматически\n\n';

  return (
    header +
    `📍 <b>Адрес:</b> ${process.env.CLUB_ADDRESS || 'уточните у менеджера'}\n` +
    `📞 <b>Телефон:</b> ${process.env.CLUB_PHONE || 'уточните у менеджера'}\n` +
    `🕐 <b>Режим работы:</b> ${process.env.CLUB_HOURS || 'уточните у менеджера'}\n\n` +
    '📋 <b>При первом посещении:</b>\n' +
    '• Подойдите на ресепшн — вас внесут в систему\n' +
    '• Возьмите паспорт для подписания договора\n' +
    '• Захватите сменную обувь и полотенце\n\n' +
    activation +
    'Ждём вас! 💪'
  );
}

function registerYookassaWebhook(app, bot) {
  const path = process.env.YOOKASSA_WEBHOOK_PATH || '/webhook/yookassa';

  app.post(path, async (req, res) => {
    res.sendStatus(200);

    try {
      const { type, object } = req.body;
      if (type !== 'notification' || !object?.id) return;

      if (object.status === 'succeeded') {
        const verified = await paymentService.fetchFromYookassa(object.id);
        if (verified.status !== 'succeeded') return;

        const payment = paymentService.findByYookassaId(object.id);
        if (!payment || payment.status === 'succeeded') return;

        paymentService.markSucceeded(object.id);

        await bot.telegram.sendMessage(
          payment.telegram_id,
          buildSuccessMessage(payment.subscription_id),
          { parse_mode: 'HTML' }
        );
      } else if (object.status === 'canceled') {
        const payment = paymentService.findByYookassaId(object.id);
        if (!payment || payment.status !== 'pending') return;

        paymentService.markCanceled(object.id);

        await bot.telegram.sendMessage(
          payment.telegram_id,
          '❌ Оплата отменена или время истекло.\n\nВыберите абонемент ещё раз:',
          {
            reply_markup: {
              inline_keyboard: [[{ text: '🏷 К абонементам', callback_data: 'menu_subscriptions' }]],
            },
          }
        );
      }
    } catch (err) {
      console.error('YooKassa webhook error:', err);
    }
  });
}

module.exports = { registerYookassaWebhook, buildSuccessMessage };
