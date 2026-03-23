const mongoose = require('mongoose');

const TaskStatusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: '#6b7280' },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  },
  { timestamps: true }
);

TaskStatusSchema.index({ createdBy: 1, order: 1 });

module.exports = mongoose.model('TaskStatus', TaskStatusSchema);
