const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    body: { type: String, required: true },
    templateType: { type: String, enum: ['reminder', 'payment'], default: 'reminder' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', TemplateSchema);
