import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB connection error');
    process.exit(1);
  }
};

export default connectDB;
