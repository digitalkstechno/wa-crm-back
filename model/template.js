const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', TemplateSchema);
