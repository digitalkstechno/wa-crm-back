const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;

        // Migrate users to customers
        const usersCount = await db.collection('users').countDocuments();
        console.log(`Found ${usersCount} documents in 'users' collection.`);
        
        if (usersCount > 0) {
            const users = await db.collection('users').find({}).toArray();
            await db.collection('customers').insertMany(users);
            console.log(`Copied ${usersCount} documents to 'customers' collection.`);
        }

        // Migrate usergroups to customergroups
        const userGroupsCount = await db.collection('usergroups').countDocuments();
        console.log(`Found ${userGroupsCount} documents in 'usergroups' collection.`);
        
        if (userGroupsCount > 0) {
            const userGroups = await db.collection('usergroups').find({}).toArray();
            await db.collection('customergroups').insertMany(userGroups);
            console.log(`Copied ${userGroupsCount} documents to 'customergroups' collection.`);
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
