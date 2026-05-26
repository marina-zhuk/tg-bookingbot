const paymentService = require('../services/paymentService');

function buildSuccessMessage(subscriptionId) {
  const isSingleVisit = subscriptionId === 'single_visit';
  const isDemoPayment = process.env.TEST_MODE === 'true';

  const header = isDemoPayment
    ? '<b>Демо-оплата успешно пройдена!</b>\n\n' +
      'Это demo/mock оплата для портфолио.\n' +
      'Реальная платежная система не подключена.\n' +
      'Реальные деньги не списываются.\n\n'
    : isSingleVisit
      ? '<b>Оплата подтверждена!</b>\n\n'
      : '<b>Оплата подтверждена! Ваш абонемент оформлен.</b>\n\n';

  const activation = isSingleVisit
    ? ''
    : '<b>Активация абонемента:</b>\n' +
      '• На первый визит можно прийти в течение 1 месяца после покупки\n' +
      '• После первого визита срок абонемента начинает действовать\n\n';

  return (
    header +
    `<b>Адрес:</b> ${process.env.CLUB_ADDRESS || 'уточните у менеджера'}\n` +
    `<b>Телефон:</b> ${process.env.CLUB_PHONE || 'уточните у менеджера'}\n` +
    `<b>Режим работы:</b> ${process.env.CLUB_HOURS || 'уточните у менеджера'}\n\n` +
    '<b>При первом посещении:</b>\n' +
    '• Подойдите на ресепшн\n' +
    '• Возьмите документ для оформления\n' +
    '• Возьмите сменную обувь и полотенце\n\n' +
    activation +
    'Ждем вас!'
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
          'Оплата отменена или время истекло.\n\nВыберите абонемент еще раз:',
          {
            reply_markup: {
              inline_keyboard: [[{ text: 'К абонементам', callback_data: 'menu_subscriptions' }]],
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
