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
    },
    waApiDomain: {
      type: String,
      default: null
    },
    waApiVersion: {
      type: String,
      default: null
    },
    waPhoneNumberId: {
      type: String,
      default: null
    },
    waAccessToken: {
      type: String,
      default: null
    },
    waTemplateId: {
      type: String,
      default: null
    },
    waTemplateLang: {
      type: String,
      default: null
    },
    waTemplateJson: {
      type: String,
      default: null
    },
    logo: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

let FIRM = mongoose.model("Firm", FirmSchema);
module.exports = FIRM;
