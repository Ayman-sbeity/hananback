import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const listUsers = async () => {
  try {
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 });

    console.log('\n📋 All Users:');
    console.log('='.repeat(60));
    
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach((user, index) => {
        const roleIcon = user.role === 'admin' ? '👑' : '👤';
        console.log(`${index + 1}. ${roleIcon} ${user.name} (${user.email}) - Role: ${user.role || 'user'}`);
      });
    }

    console.log('='.repeat(60));
    console.log(`Total users: ${users.length}`);
    console.log(`Admins: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`Regular users: ${users.filter(u => u.role === 'user' || !u.role).length}\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Failed to list users:', error);
  }
};

listUsers();
