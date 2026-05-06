const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((id) => parseInt(id.trim(), 10))
  .filter(Boolean);

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

function adminGuard(ctx, next) {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('⛔ Доступ запрещён.');
  }
  return next();
}

module.exports = { adminGuard, isAdmin };
