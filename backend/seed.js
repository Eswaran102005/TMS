require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Department = require('./models/Department');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_test';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // 1. Create a default Department
    let dept = await Department.findOne({ shortName: 'GEN' });
    if (!dept) {
      dept = await Department.create({ name: 'General Department', shortName: 'GEN' });
      console.log('Created General Department');
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const usersToCreate = [
      {
        username: 'admin',
        email: 'admin@tms.com',
        phone: '1234567890',
        password: hashedPassword,
        role: 'SuperAdmin',
        department: dept._id
      },
      {
        username: 'staff_net',
        email: 'networking@tms.com',
        phone: '1234567891',
        password: hashedPassword,
        role: 'Networking Staff',
        department: dept._id
      },
      {
        username: 'staff_elec',
        email: 'electrician@tms.com',
        phone: '1234567892',
        password: hashedPassword,
        role: 'Electrician',
        department: dept._id
      },
      {
        username: 'staff_plum',
        email: 'plumber@tms.com',
        phone: '1234567893',
        password: hashedPassword,
        role: 'Plumber',
        department: dept._id
      },
      {
        username: 'user1',
        email: 'user1@tms.com',
        phone: '1234567894',
        password: hashedPassword,
        role: 'User',
        department: dept._id
      }
    ];

    for (const userData of usersToCreate) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`Created user: ${userData.username} (${userData.role})`);
      } else {
        console.log(`User already exists: ${userData.username}`);
      }
    }

    console.log('Database Seeding Completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
