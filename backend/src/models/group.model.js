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
  inviteLink: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  settings: {
    onlyAdminsCanSend: {
      type: Boolean,
      default: false,
    },
    onlyAdminsCanEditInfo: {
      type: Boolean,
      default: true,
    },
    membersCanAddOthers: {
      type: Boolean,
      default: true,
    },
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
