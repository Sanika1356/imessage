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