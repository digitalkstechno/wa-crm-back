const mongoose = require('mongoose');

const TaskTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: '#3b82f6' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaskType', TaskTypeSchema);
