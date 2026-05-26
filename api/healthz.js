module.exports = function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: 'fitadmin-demo-club-bot',
    mode: 'portfolio-demo',
  });
};
