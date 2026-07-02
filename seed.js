const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const STAFF = require('./model/staff');
const { encryptData } = require('./utils/crypto');

const seedStaff = async () => {
  await connectDB();

  const existing = await STAFF.findOne({ email: 'prince@gmail.com' });
  if (existing) {
    console.log('Staff already exists:', existing.email);
    process.exit(0);
  }

  await STAFF.create({
    fullName: 'Admin',
    email: 'admin@gmail.com',
    phone: '9999999999',
    password: encryptData('123456'),
  });

  console.log('Staff seeded successfully!');
  console.log('Email    : admin@gmail.com');
  console.log('Password : 123456');
  process.exit(0);
};

seedStaff().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
