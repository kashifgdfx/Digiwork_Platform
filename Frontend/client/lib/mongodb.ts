import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is not defined in .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as any).mongoose || { conn: null, promise: null };

if (!(global as any).mongoose) {
  (global as any).mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('♻️ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || 'FiverData',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log('🔌 Connecting to MongoDB...');
    console.log('DB:', opts.dbName);

    // Yahan MONGODB_URI ke sath '!' lagaya hai taaki TS error na de
    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected successfully');
        // Yahan optional chaining '?.' ka use kiya hai
        console.log('📦 Database:', mongooseInstance.connection.db?.databaseName);
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;