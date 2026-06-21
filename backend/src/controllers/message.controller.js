import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId }
    }).select("-clerkId");

    res.status(200).json(filteredUsers);
  }
  catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getConversationsForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await Message.aggregate([
      // 1. Keep only the messages I sent or received.
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      // 2. Collapse them into one row per chat partner, noting our latest message time.
      {
        $group: {
          // The partner is the other person on the message (not me).
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      // 3. Put the most recent conversation at the top.
      { $sort: { lastMessageAt: -1 } },
      // 4. Look up each partner's user profile (comes back as an array).
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      // 5. Exclude conversations with users that no longer exist
      { $match: { user: { $ne: [] } } },
      // 6. Pull that profile out of the array and make it the document.
      { $replaceRoot: { newRoot: { $first: "$user" } } },
      // 7. Hide the private clerkId field from the result.
      { $project: { clerkId: 0 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversationsForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;
    let audioUrl;

    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }

      const url = await uploadChatMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) videoUrl = url;
      else if (req.file.mimetype.startsWith("audio/")) audioUrl = url;
      else imageUrl = url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    // Populate replyTo message if exists
    if (replyTo) {
      await newMessage.populate('replyTo', 'text senderId');
    }

    // Populate sender info for real-time display
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'fullName profilePic email phoneNumber')
      .populate('receiverId', 'fullName profilePic email phoneNumber');

    const receiverSocketId = getReceiverSocketId(receiverId);
    // Send message to receiver if online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
      console.log(`[MESSAGE-DELIVERY] Message sent to receiver ${receiverId} via socket`);
    } else {
      console.log(`[MESSAGE-DELIVERY] Receiver ${receiverId} is offline - message saved to DB`);
    }
    
    // Also send to sender for immediate UI update
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSent", populatedMessage);
    }

    console.log(`[MESSAGE-CREATED] Message ${newMessage._id} created from ${senderId} to ${receiverId}`);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function searchUsers(req, res) {
  try {
    const loggedInUserId = req.user._id;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchQuery = query.trim();

    // Find users excluding the logged-in user that match email, phone, or fullName
    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { email: searchQuery },
        { phoneNumber: searchQuery },
        { fullName: { $regex: searchQuery, $options: "i" } }
      ]
    }).select("-clerkId");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}