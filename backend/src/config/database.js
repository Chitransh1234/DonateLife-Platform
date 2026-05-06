const mongoose = require('mongoose');

const DEFAULT_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
};

let listenersBound = false;

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment');
  }
  return uri;
}

function bindConnectionListeners() {
  if (listenersBound) return;

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  listenersBound = true;
}

async function connectDB(overrides = {}) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = overrides.uri || getMongoUri();
  const options = { ...DEFAULT_OPTIONS, ...(overrides.options || {}) };

  try {
    const conn = await mongoose.connect(uri, options);
    bindConnectionListeners();
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
}

module.exports = {
  connectDB,
  disconnectDB,
};
