module.exports = function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: 'fitness-club-telegram-mvp',
    mode: 'portfolio-demo',
  });
};
