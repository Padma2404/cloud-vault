
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "FILE_UPLOADED",
        "FILE_DOWNLOADED",
        "FILE_DELETED",
        "FILE_RESTORED",
        "FILE_PERMANENTLY_DELETED",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
      ],
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
