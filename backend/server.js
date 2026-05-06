require('dotenv').config();

const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/database');

const PORT = Number(process.env.PORT, 10) || 5000;
let server;

async function start() {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((err) => {
    console.error('Graceful shutdown failed:', err.message);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((err) => {
    console.error('Graceful shutdown failed:', err.message);
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

start();
