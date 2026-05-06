const userService = require('../../services/userService');

function requireAuth(ctx, next) {
  if (ctx.session.step && ctx.session.step !== 'done') return next();

  const user = userService.findByTelegramId(ctx.from?.id);
  if (!user) {
    return ctx.reply('Пожалуйста, начните с команды /start для регистрации.');
  }
  ctx.state.user = user;
  return next();
}

module.exports = { requireAuth };
