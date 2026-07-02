const mongoose = require('mongoose');
const Template = require('./model/template');
require('dotenv').config();

async function updateTemplates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const result = await Template.updateMany(
      { templateType: { $exists: false } },
      { $set: { templateType: 'reminder' } }
    );
    console.log(`Updated ${result.modifiedCount} templates to 'reminder' type.`);
  } catch (error) {
    console.error('Error updating templates:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateTemplates();
