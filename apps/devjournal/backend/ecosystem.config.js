module.exports = {
  apps: [
    {
      name: 'devjournal-backend',
      script: '/home/ubuntu/devjournal-backend/main.js',
      cwd: '/home/ubuntu/devjournal-backend',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
    },
  ],
};
