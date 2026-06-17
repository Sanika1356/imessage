import Channel from "../models/channel.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import crypto from "crypto";

export async function createChannel(req, res) {
  try {
    const { name, description } = req.body;
    const ownerId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    const inviteCode = crypto.randomBytes(6).toString("hex");

    const newChannel = new Channel({
      name,
      description,
      owner: ownerId,
      admins: [ownerId],
      subscribers: [ownerId], // Owner automatically subscribes
      inviteCode,
    });

    await newChannel.save();

    const populatedChannel = await Channel.findById(newChannel._id)
      .populate("owner", "-clerkId");

    res.status(201).json(populatedChannel);
  } catch (error) {
    console.error("Error in createChannel:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function subscribeChannel(req, res) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code or Telegram username is required" });
    }

    const cleanCode = inviteCode.trim();
    let channel;

    if (cleanCode.startsWith("@") || cleanCode.startsWith("t.me/") || cleanCode.startsWith("https://t.me/")) {
      const username = cleanCode.replace("https://t.me/", "").replace("t.me/", "").replace("@", "").trim();

      channel = await Channel.findOne({ telegramUsername: username });
      if (!channel) {
        const generatedInviteCode = crypto.randomBytes(6).toString("hex");
        channel = new Channel({
          name: `@${username} (Telegram Channel)`,
          description: `Real-world Telegram channel for @${username}`,
          owner: userId,
          admins: [userId],
          subscribers: [userId],
          inviteCode: generatedInviteCode,
          telegramUsername: username
        });
        await channel.save();
      } else {
        if (!channel.subscribers.includes(userId)) {
          channel.subscribers.push(userId);
          await channel.save();
        }
      }
    } else {
      channel = await Channel.findOne({ inviteCode: cleanCode });
      if (!channel) {
        if (!/^[0-9a-fA-F]{12}$/.test(cleanCode)) {
          const username = cleanCode.replace("@", "").trim();
          channel = await Channel.findOne({ telegramUsername: username });
          if (!channel) {
            const generatedInviteCode = crypto.randomBytes(6).toString("hex");
            channel = new Channel({
              name: `@${username} (Telegram Channel)`,
              description: `Real-world Telegram channel for @${username}`,
              owner: userId,
              admins: [userId],
              subscribers: [userId],
              inviteCode: generatedInviteCode,
              telegramUsername: username
            });
            await channel.save();
          } else {
            if (!channel.subscribers.includes(userId)) {
              channel.subscribers.push(userId);
              await channel.save();
            }
          }
        } else {
          return res.status(404).json({ message: "Group or Channel not found" });
        }
      } else {
        if (!channel.subscribers.includes(userId)) {
          channel.subscribers.push(userId);
          await channel.save();
        }
      }
    }

    const populatedChannel = await Channel.findById(channel._id)
      .populate("owner", "-clerkId");

    res.status(200).json(populatedChannel);
  } catch (error) {
    console.error("Error in subscribeChannel:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getChannels(req, res) {
  try {
    const userId = req.user._id;

    // Retrieve channels where user is subscribed
    const channels = await Channel.find({ subscribers: userId })
      .populate("owner", "-clerkId");

    res.status(200).json(channels);
  } catch (error) {
    console.error("Error in getChannels:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getChannelPosts(req, res) {
  try {
    const { id: channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.telegramUsername) {
      const { scrapeTelegramChannel } = await import("../lib/telegramScraper.js");
      const tgPosts = await scrapeTelegramChannel(channel.telegramUsername);
      return res.status(200).json(tgPosts);
    }

    const posts = await Message.find({ channelId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName profilePic email");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getChannelPosts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function postToChannel(req, res) {
  try {
    const { text } = req.body;
    const { id: channelId } = req.params;
    const userId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const isAdmin = channel.admins.includes(userId) || String(channel.owner) === String(userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only channel admins can post" });
    }

    let imageUrl;
    let videoUrl;

    if (req.file) {
      const { uploadChatMedia, hasImageKitConfig } = await import("../lib/imagekit.js");
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }
      const url = await uploadChatMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) videoUrl = url;
      else imageUrl = url;
    }

    const newMessage = new Message({
      senderId: userId,
      channelId,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    const populatedPost = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic email");

    // Emit channel:update to all online subscribers
    channel.subscribers.forEach((subId) => {
      if (String(subId) === String(userId)) return;
      const socketId = getReceiverSocketId(subId);
      if (socketId) {
        io.to(socketId).emit("newChannelPost", populatedPost);
      }
    });

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error in postToChannel:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function pinPost(req, res) {
  try {
    const { channelId, messageId } = req.body;
    const userId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const isAdmin = channel.admins.includes(userId) || String(channel.owner) === String(userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only channel admins can pin posts" });
    }

    if (channel.pinnedPosts.includes(messageId)) {
      return res.status(400).json({ message: "Post already pinned" });
    }

    channel.pinnedPosts.push(messageId);
    await channel.save();

    res.status(200).json({ message: "Post pinned successfully", pinnedPosts: channel.pinnedPosts });
  } catch (error) {
    console.error("Error in pinPost:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
