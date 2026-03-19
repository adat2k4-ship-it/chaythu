module.exports = {
  apps: [{
    name: 'expense-manager',
    script: 'node_modules/next/dist/bin/next',
    args: 'dev',
    cwd: 'C:/Users/adat2/expense-manager',
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3003
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true
  }]
};