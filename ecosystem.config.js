const path = require('path');

module.exports = {
  apps: [
    {
      name: 'chhiyapasal-api',
      cwd: path.resolve(__dirname, 'apps/api'),
      script: 'dist/main.js',

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      // Process settings
      instances: 1,          // Use 'max' for cluster mode on multi-core servers
      exec_mode: 'fork',     // Change to 'cluster' for multi-core
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Logging
      error_file: path.resolve(__dirname, 'logs/pm2-error.log'),
      out_file: path.resolve(__dirname, 'logs/pm2-out.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: false,

      // .env file — PM2 will load this automatically
      env_file: path.resolve(__dirname, '.env.production'),
    },
  ],
};
