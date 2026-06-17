import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  groupPhoto: {
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
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true,
  },
  telegramUsername: {
    type: String,
    default: "",
  }
}, {
  timestamps: true,
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
