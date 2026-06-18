import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    video: {
        type: String,
    },
    pdf: {
        type: String,
    },
    audio: {
        type: String,
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
    forwarded: {
        type: Boolean,
        default: false,
    },
    edited: {
        type: Boolean,
        default: false,
    },
    editedAt: {
        type: Date,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        emoji: String,
    }],
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }]

},
    {
        timestamps: true
    });

const Message = mongoose.model("Message", messageSchema);

export default Message;