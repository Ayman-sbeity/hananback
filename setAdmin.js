import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const setUserAsAdmin = async () => {
  try {
    
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node setAdmin.js <email>');
      console.log('Example: node setAdmin.js admin@example.com');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      console.log(`User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    const result = await User.findOneAndUpdate(
      { email: email },
      { $set: { role: 'admin' } },
      { new: true }
    );

    if (result) {
      console.log(`✅ Successfully updated user ${email} to admin role`);
      console.log(`User details:`, {
        id: result._id,
        name: result.name,
        email: result.email,
        role: result.role
      });
    }

    await mongoose.disconnect();
    console.log('Update completed');
  } catch (error) {
    console.error('Update failed:', error);
  }
};

setUserAsAdmin();
