const { initiatePayment, handleTestSuccess, handleTestFail } = require('./payment');
const {
  showMainMenu,
  showSubscriptionTypes,
  showTypePlans,
  showPlanCard,
  showSpecialOffers,
} = require('./catalog');

function registerCallbackHandler(bot) {
  bot.on('callback_query', async (ctx, next) => {
    const data = ctx.callbackQuery.data;

    if (data === 'main_menu') { await ctx.answerCbQuery(); return showMainMenu(ctx); }
    if (data === 'menu_subscriptions') { await ctx.answerCbQuery(); return showSubscriptionTypes(ctx); }
    if (data === 'menu_basic') { await ctx.answerCbQuery(); return showTypePlans(ctx, 'basic'); }
    if (data === 'menu_full') { await ctx.answerCbQuery(); return showTypePlans(ctx, 'full'); }
    if (data === 'menu_special') { await ctx.answerCbQuery(); return showSpecialOffers(ctx); }

    if (data.startsWith('plan_')) { await ctx.answerCbQuery(); return showPlanCard(ctx, data.slice(5)); }
    if (data.startsWith('buy_')) { await ctx.answerCbQuery(); return initiatePayment(ctx, data.slice(4)); }

    if (data.startsWith('tpay_ok:') || data.startsWith('tpay_fail:')) {
      await ctx.answerCbQuery();
      const [, paymentDbId, subId] = data.split(':');
      if (data.startsWith('tpay_ok:')) return handleTestSuccess(ctx, paymentDbId, subId);
      return handleTestFail(ctx, paymentDbId, subId);
    }

    return next();
  });
}

module.exports = { registerCallbackHandler };
