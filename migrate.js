const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        console.log('Connected to MongoDB');

        // Migrate customers to customers
        const customersCount = await db.collection('customers').countDocuments();
        if (customersCount > 0) {
            console.log(`Migrating ${customersCount} documents from customers to customers...`);
            const customers = await db.collection('customers').find({}).toArray();
            await db.collection('customers').insertMany(customers);
            await db.collection('customers').drop();
            console.log('Successfully migrated customers and dropped old collection.');
        } else {
            console.log('No documents in customers collection to migrate.');
        }

        // Migrate customergroups to customergroups
        const groupsCount = await db.collection('customergroups').countDocuments();
        if (groupsCount > 0) {
            console.log(`Migrating ${groupsCount} documents from customergroups to customergroups...`);
            const groups = await db.collection('customergroups').find({}).toArray();
            await db.collection('customergroups').insertMany(groups);
            await db.collection('customergroups').drop();
            console.log('Successfully migrated customergroups and dropped old collection.');
        } else {
            console.log('No documents in customergroups collection to migrate.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
