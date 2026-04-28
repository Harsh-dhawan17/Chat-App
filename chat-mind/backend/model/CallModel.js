const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chatModel",
    },
    callStatus: {
      type: String,
      enum: ["initiated", "ringing", "accepted", "rejected", "missed", "ended"],
      default: "initiated",
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      default: "audio",
    },
    duration: {
      type: Number, // duration in seconds
      default: 0,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

const callModel = mongoose.model("callModel", callSchema);
module.exports = callModel;
