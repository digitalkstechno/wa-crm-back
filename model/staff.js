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
    }
  },
  { timestamps: true },
);

let STAFF = mongoose.model("Staff", StaffSchema);
module.exports = STAFF;
