module.exports = {
  apps: [
    {
      name: "ictrealestate",
      script: "node_modules\\next\\dist\\bin\\next",
      args: "start",
      cwd: "D:\\sandbox\\ict_realtors",
      env: {
        NODE_ENV: "production",
        // Port 3010 collides with the ict_services Next.js app on this server.
        // Keep ict_realtors on 3011 — the IIS site at D:\inetpub\ictrealestate\web.config
        // reverse-proxies to 127.0.0.1:3011.
        PORT: "3011",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
