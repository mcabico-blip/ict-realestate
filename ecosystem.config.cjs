module.exports = {
  apps: [
    {
      name: "ictrealestate",
      script: "node_modules\\next\\dist\\bin\\next",
      args: "start",
      cwd: "D:\\sandbox\\ict_realtors",
      env: {
        NODE_ENV: "production",
        PORT: "3010",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
