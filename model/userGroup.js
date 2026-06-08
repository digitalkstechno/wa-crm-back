const mongoose = require('mongoose');

const UserGroupSchema = new mongoose.Schema(
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

UserGroupSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'group'
});

module.exports = mongoose.model('UserGroup', UserGroupSchema);
