let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let FirmSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      unique: true,
    },
    superAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    }
  },
  { timestamps: true }
);

let FIRM = mongoose.model("Firm", FirmSchema);
module.exports = FIRM;
