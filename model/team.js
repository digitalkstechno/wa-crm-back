let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let TeamSchema = new Schema(
  {
    teamName: {
      type: String,
      required: true,
    },
    teamCode: {
      type: String,
      unique: true,
    },
    firmId: {
      type: Schema.Types.ObjectId,
      ref: 'Firm',
      default: null,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    teamLeadId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    target: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

let TEAM = mongoose.model("Team", TeamSchema);
module.exports = TEAM;
