import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true,
  },
  pinnedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  }],
  telegramUsername: {
    type: String,
    default: "",
  }
}, {
  timestamps: true,
});

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
