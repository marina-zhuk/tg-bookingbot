const express = require('express');

function createServer() {
  const app = express();
  app.use(express.json());
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

module.exports = { createServer };
