const mongoose = require('mongoose');

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    const uri = process.env.MONGODB_DIRECT_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/FiverData';
    connectionPromise = mongoose.connect(uri, {
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
      bufferCommands: false,
    });
  }

  try {
    await connectionPromise;
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}

module.exports = connectDB;
