import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongooseS.chema.Types.ObjectId,
        ref: "User",
        required : true,
    },
    receiverId: {
        type: mongooseS.chema.Types.ObjectId,
        ref: "User",
        required : true,
    },
    texts: {
        type:String,
    },
    image: {
        type:String,
    },
    video: {
        type:String,
    },
    pdf: {
        type:String,
    }

},
    {
        timestamps: true
    });

const Message = mongoose.model("Message", messageSchema);

export default Message;