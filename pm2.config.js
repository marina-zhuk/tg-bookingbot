module.exports = {
  apps: [
    {
      name: 'fitadmin-demo-club-bot',
      script: './src/index.js',
      watch: ['src/', 'config/subscriptions.json'],
      ignore_watch: ['data/', 'node_modules/', 'logs/'],
      env: { NODE_ENV: 'development' },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 1000,
    },
  ],
};
