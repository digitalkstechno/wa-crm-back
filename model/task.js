const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskType' },
    status: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskStatus', required: true },
    
    // Customer Information
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    assignedRM: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    
    // Date & Time
    taskDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    dueTime: { type: String, default: '' },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
