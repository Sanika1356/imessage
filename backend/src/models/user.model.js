import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    bio: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["online", "offline"],
        default: "offline",
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    }
},
    {
    timestamps: true,  //CreatedAt & UpdatedAt
    }
);

const User = mongoose.model("User", userSchema)

export default User;