process.env.DB_PATH = process.env.DB_PATH || '/tmp/bot.db';
process.env.NOTIFIERS_PATH = process.env.NOTIFIERS_PATH || '/tmp/notifiers.json';
process.env.SUBSCRIPTIONS_PATH = process.env.SUBSCRIPTIONS_PATH || './config/subscriptions.json';
process.env.TEST_MODE = process.env.TEST_MODE || 'true';

const { runMigrations } = require('../src/db/migrations');
const { createBot } = require('../src/bot/bot');

let bot;

function getBot() {
  if (!bot) {
    runMigrations();
    bot = createBot();
  }
  return bot;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'fitness-club-telegram-mvp',
      mode: 'telegram-webhook',
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!process.env.BOT_TOKEN) {
    return res.status(500).json({ ok: false, error: 'BOT_TOKEN is not configured' });
  }

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await getBot().handleUpdate(update);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return res.status(500).json({ ok: false });
  }
};

module.exports.config = {
  maxDuration: 10,
};
