import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
  },
  cc: [{
    type: String,
  }],
  bcc: [{
    type: String,
  }],
  subject: {
    type: String,
    default: "(No Subject)",
  },
  body: {
    type: String,
    default: "",
  },
  attachments: [{
    type: String,
  }],
  folder: {
    type: String,
    enum: ["inbox", "sent", "draft", "trash"],
    default: "inbox",
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const Email = mongoose.model("Email", emailSchema);

export default Email;
