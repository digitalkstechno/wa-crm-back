const mongoose = require('mongoose');

const CustomerGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#10b981' },
    firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', default: null },
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
