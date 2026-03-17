const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    recipientType: {
      type: String,
      enum: ['new', 'customers', 'groups'],
      required: true,
    },
    // For 'customers' or 'new' if we want to link it
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    // For 'customers' (multiple)
    customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
    // For 'groups'
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup' }],
    // Fallback for 'new'
    newName: { type: String, default: '' },
    newPhone: { type: String, default: '' },

    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Scheduled', 'Pending', 'Sent', 'Failed'],
      default: 'Scheduled',
    },
    type: { type: String, default: 'WhatsApp' },

    repeat: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['day', 'week', 'month', 'year'],
      },
      interval: { type: Number, default: 1 },
      days: [{ type: Number }], // 0-6 for Sunday-Saturday
      monthDay: { type: Number },
      startDate: { type: Date },
      ends: {
        type: String,
        enum: ['never', 'on', 'after'],
        default: 'never',
      },
      endDate: { type: Date },
      afterCount: { type: Number },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', ReminderSchema);
