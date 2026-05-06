const userService = require('../../services/userService');
const { touchVisitor } = userService;
const { showMainMenu } = require('./catalog');

const PHONE_RE = /^(\+7|8)\d{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    touchVisitor(ctx.from.id, ctx.from.username);
    const user = userService.findByTelegramId(ctx.from.id);
    if (user) {
      await ctx.reply(`С возвращением, ${user.full_name}! 👋`);
      return showMainMenu(ctx);
    }

    ctx.session.step = 'name';
    ctx.session.draft = {};
    await ctx.reply(
      'Добро пожаловать в спортивный клуб Gravity Sport! 🏋️\n\n' +
        'Для покупки абонемента нужно зарегистрироваться.\n' +
        'Пожалуйста, введите ваше <b>ФИО</b> (фамилия имя отчество).\n' +
        'Если отчества нет — поставьте прочерк: <i>Иванова Мария —</i>',
      { parse_mode: 'HTML' }
    );
  });

  bot.on('text', async (ctx, next) => {
    const step = ctx.session.step;
    if (!step || step === 'done' || step === 'admin_broadcast') return next();

    const text = ctx.message.text.trim();

    if (step === 'name') {
      const parts = text.split(/\s+/);
      if (parts.length < 2) {
        return ctx.reply(
          'Пожалуйста, введите минимум фамилию и имя.\nЕсли нет отчества — поставьте прочерк: <i>Иванова Мария —</i>',
          { parse_mode: 'HTML' }
        );
      }
      ctx.session.draft.fullName = text;
      ctx.session.step = 'phone';
      return ctx.reply(
        'Отлично! Теперь введите ваш <b>номер телефона</b> (например: +79991234567):',
        { parse_mode: 'HTML' }
      );
    }

    if (step === 'phone') {
      const phone = text.replace(/[\s\-()]/g, '');
      if (!PHONE_RE.test(phone)) {
        return ctx.reply(
          'Некорректный формат. Введите номер в формате <b>+79991234567</b> или <b>89991234567</b>:',
          { parse_mode: 'HTML' }
        );
      }
      ctx.session.draft.phone = phone;
      ctx.session.step = 'email';
      return ctx.reply('Введите ваш <b>email</b>:', { parse_mode: 'HTML' });
    }

    if (step === 'email') {
      if (!EMAIL_RE.test(text)) {
        return ctx.reply('Некорректный email. Попробуйте ещё раз:');
      }
      const { fullName, phone } = ctx.session.draft;
      userService.create({ telegramId: ctx.from.id, fullName, phone, email: text });

      ctx.session.step = 'done';
      ctx.session.draft = {};

      await ctx.reply(
        '✅ Регистрация завершена!\n\n' +
          '📋 <b>Обратите внимание:</b> договор об оказании услуг вы подпишете ' +
          'при первом посещении клуба.',
        { parse_mode: 'HTML' }
      );
      return showMainMenu(ctx);
    }

    return next();
  });
}

module.exports = { registerStartHandler };
