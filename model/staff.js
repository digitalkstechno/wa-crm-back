let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let StaffSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    firmId: {
      type: Schema.Types.ObjectId,
      ref: 'Firm',
      default: null,
    },
    roleType: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Manager', 'Member'],
      default: 'Member',
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    joiningDate: { type: Date },
    notes: { type: String, default: '' },
    employeeCode: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    permissions: {
      type: Object,
      default: {
        leads: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        customers: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        tasks: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        followups: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        products: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        expenses: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        reports: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        whatsapp: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        reminders: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        staff: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
        settings: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
      }
    }
  },
  { timestamps: true },
);

let STAFF = mongoose.model("Staff", StaffSchema);
module.exports = STAFF;
