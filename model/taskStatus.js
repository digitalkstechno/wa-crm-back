const mongoose = require('mongoose');

const TaskStatusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: '#e2e8f0' },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaskStatus', TaskStatusSchema);
