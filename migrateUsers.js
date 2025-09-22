import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const updateExistingUsers = async () => {
  try {
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { role: { $exists: false } }, 
      { $set: { role: 'user' } }    
    );

    console.log(`Updated ${result.modifiedCount} users with default role 'user'`);

    const result2 = await User.updateMany(
      { $or: [{ role: null }, { role: undefined }] },
      { $set: { role: 'user' } }
    );

    console.log(`Updated ${result2.modifiedCount} users with null/undefined role`);

    await mongoose.disconnect();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

updateExistingUsers();
