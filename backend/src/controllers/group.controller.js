import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import crypto from "crypto";

export async function createGroup(req, res) {
  try {
    const { name, description, members } = req.body;
    const ownerId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Generate a unique invite code
    const inviteCode = crypto.randomBytes(6).toString("hex");

    // Include owner in members list if not already present
    const memberIds = Array.isArray(members) ? [...members] : [];
    if (!memberIds.includes(String(ownerId))) {
      memberIds.push(ownerId);
    }

    const newGroup = new Group({
      name,
      description,
      owner: ownerId,
      admins: [ownerId],
      members: memberIds,
      inviteCode,
    });

    await newGroup.save();

    // Populate members for response
    const populatedGroup = await Group.findById(newGroup._id).populate("members", "-clerkId");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function joinGroup(req, res) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code or Telegram username is required" });
    }

    const cleanCode = inviteCode.trim();
    let group;

    if (cleanCode.startsWith("@") || cleanCode.startsWith("t.me/") || cleanCode.startsWith("https://t.me/")) {
      const username = cleanCode.replace("https://t.me/", "").replace("t.me/", "").replace("@", "").trim();

      group = await Group.findOne({ telegramUsername: username });
      if (!group) {
        const generatedInviteCode = crypto.randomBytes(6).toString("hex");
        group = new Group({
          name: `@${username} (Telegram Group)`,
          description: `Real-world Telegram group/channel for @${username}`,
          owner: userId,
          admins: [userId],
          members: [userId],
          inviteCode: generatedInviteCode,
          telegramUsername: username
        });
        await group.save();
      } else {
        if (!group.members.includes(userId)) {
          group.members.push(userId);
          await group.save();
        }
      }
    } else {
      group = await Group.findOne({ inviteCode: cleanCode });
      if (!group) {
        if (!/^[0-9a-fA-F]{12}$/.test(cleanCode)) {
          const username = cleanCode.replace("@", "").trim();
          group = await Group.findOne({ telegramUsername: username });
          if (!group) {
            const generatedInviteCode = crypto.randomBytes(6).toString("hex");
            group = new Group({
              name: `@${username} (Telegram Group)`,
              description: `Real-world Telegram group/channel for @${username}`,
              owner: userId,
              admins: [userId],
              members: [userId],
              inviteCode: generatedInviteCode,
              telegramUsername: username
            });
            await group.save();
          } else {
            if (!group.members.includes(userId)) {
              group.members.push(userId);
              await group.save();
            }
          }
        } else {
          return res.status(404).json({ message: "Group or Channel not found" });
        }
      } else {
        if (!group.members.includes(userId)) {
          group.members.push(userId);
          await group.save();
        }
      }
    }

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "-clerkId")
      .populate("owner", "-clerkId");

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.error("Error in joinGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getGroups(req, res) {
  try {
    const userId = req.user._id;

    // Find groups where the user is a member
    const groups = await Group.find({ members: userId })
      .populate("members", "-clerkId")
      .populate("owner", "-clerkId");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getGroupMessages(req, res) {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.telegramUsername) {
      const { scrapeTelegramChannel } = await import("../lib/telegramScraper.js");
      const tgPosts = await scrapeTelegramChannel(group.telegramUsername);
      return res.status(200).json(tgPosts);
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName profilePic email phoneNumber");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendGroupMessage(req, res) {
  try {
    const { text } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
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
      senderId,
      groupId,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic email phoneNumber");

    // Emit to all members of the group who are online
    group.members.forEach((memberId) => {
      // Don't send back to the sender
      if (String(memberId) === String(senderId)) return;
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
