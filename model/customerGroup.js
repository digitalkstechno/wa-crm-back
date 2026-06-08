const mongoose = require('mongoose');

const CustomerGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#10b981' },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

CustomerGroupSchema.virtual('members', {
  ref: 'Customer',
  localField: '_id',
  foreignField: 'group'
});

module.exports = mongoose.model('CustomerGroup', CustomerGroupSchema);
