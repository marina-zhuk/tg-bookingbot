const { findAllVisitors, markVisitorBlocked } = require('./userService');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function broadcast(bot, message) {
  const visitors = findAllVisitors();
  let sent = 0;
  let failed = 0;

  for (const visitor of visitors) {
    try {
      await bot.telegram.sendMessage(visitor.telegram_id, message, { parse_mode: 'HTML' });
      sent++;
    } catch (err) {
      if (err.code === 403) {
        markVisitorBlocked(visitor.telegram_id);
        failed++;
      } else if (err.code === 429) {
        const retryAfter = ((err.parameters && err.parameters.retry_after) || 30) * 1000;
        await sleep(retryAfter);
        try {
          await bot.telegram.sendMessage(visitor.telegram_id, message, { parse_mode: 'HTML' });
          sent++;
        } catch {
          failed++;
        }
      } else {
        failed++;
      }
    }
    await sleep(50);
  }

  return { sent, failed, total: visitors.length };
}

module.exports = { broadcast };
