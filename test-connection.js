import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing MongoDB connection...');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGO_URI starts with mongodb+srv:', process.env.MONGO_URI?.startsWith('mongodb+srv:'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Connection failed:', error.message);
    process.exit(1);
  });
