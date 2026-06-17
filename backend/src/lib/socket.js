import express from "express";
import http from "http";
import { Server } from "socket.io";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, { cors: { origin: [allowedOrigin] } });

function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// online users map = { userId: socketId }
const userSocketMap = {};

io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        userSocketMap[userId] = socket.id;
        
        // Sync online status in MongoDB
        try {
            await User.findByIdAndUpdate(userId, { status: "online" });
        } catch (err) {
            console.error("Error setting user status online:", err.message);
        }
    }

    // Broadcast online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle typing start
    socket.on("typing:start", async (data) => {
        const { receiverId, groupId } = data;
        
        if (receiverId) {
            const socketId = getReceiverSocketId(receiverId);
            if (socketId) {
                io.to(socketId).emit("typing:start", { senderId: userId, receiverId });
            }
        } else if (groupId) {
            try {
                const group = await Group.findById(groupId);
                if (group) {
                    group.members.forEach(memberId => {
                        if (String(memberId) === String(userId)) return;
                        const socketId = getReceiverSocketId(memberId);
                        if (socketId) {
                            io.to(socketId).emit("typing:start", { senderId: userId, groupId });
                        }
                    });
                }
            } catch (err) {
                console.error("Typing start group relay error:", err.message);
            }
        }
    });

    // Handle typing stop
    socket.on("typing:stop", async (data) => {
        const { receiverId, groupId } = data;
        
        if (receiverId) {
            const socketId = getReceiverSocketId(receiverId);
            if (socketId) {
                io.to(socketId).emit("typing:stop", { senderId: userId, receiverId });
            }
        } else if (groupId) {
            try {
                const group = await Group.findById(groupId);
                if (group) {
                    group.members.forEach(memberId => {
                        if (String(memberId) === String(userId)) return;
                        const socketId = getReceiverSocketId(memberId);
                        if (socketId) {
                            io.to(socketId).emit("typing:stop", { senderId: userId, groupId });
                        }
                    });
                }
            } catch (err) {
                console.error("Typing stop group relay error:", err.message);
            }
        }
    });

    // Handle message read status
    socket.on("message:read", async (data) => {
        const { messageId, senderId } = data;
        if (!messageId) return;

        try {
            const message = await Message.findByIdAndUpdate(
                messageId,
                { status: "read" },
                { new: true }
            );

            if (message && senderId) {
                const socketId = getReceiverSocketId(senderId);
                if (socketId) {
                    io.to(socketId).emit("message:read", { messageId, status: "read" });
                }
            }
        } catch (err) {
            console.error("Error marking message read:", err.message);
        }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
        if (userId) {
            delete userSocketMap[userId];
            
            // Sync offline status and lastSeen in MongoDB
            try {
                await User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() });
            } catch (err) {
                console.error("Error setting user status offline:", err.message);
            }
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, server, io, getReceiverSocketId };