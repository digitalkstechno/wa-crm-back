const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, default: '' },
    tags: [{ type: String }],
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup', default: null },
    notes: { type: String, default: '' },
    firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', CustomerSchema);
