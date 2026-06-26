import { useMediaQuery } from "./useMediaQuery";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// John Doe -> JD
export function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("");
}

// mapUserToConversation is an adapter — it converts the raw backend shapes into the clean view-model
function mapUserToConversation({ user, messages, authUser, onlineUsers }) {
  const mappedMessages = messages.map((message) => ({
    id: message._id,
    role: String(message.senderId) === String(authUser?._id) ? "me" : "them",
    text: message.text || "",
    time: formatMessageTime(message.createdAt),
    imageUrl: message.image,
    videoUrl: message.video,
    audioUrl: message.audio,
    reactions: message.reactions || [],
    status: message.status || "sent",
    senderId: message.senderId,
  }));

  return {
    id: user._id,
    type: "user",
    peer: {
      name: user.fullName,
      subtitle: user.email,
      isOnline: onlineUsers.includes(user._id),
      avatarUrl: user.profilePic,
      initials: getInitials(user.fullName),
      status: user.status,
      lastSeen: user.lastSeen,
      bio: user.bio || "",
      phoneNumber: user.phoneNumber || "",
    },
    messages: mappedMessages,
  };
}

export function useSelectedConversation() {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const users = useChatStore((state) => state.users);
  const groups = useChatStore((state) => state.groups);
  const channels = useChatStore((state) => state.channels);
  const messages = useChatStore((state) => state.messages);
  const sidebarTab = useChatStore((state) => state.sidebarTab);

  const authUser = useAuthStore((state) => state.authUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);

  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  let activeConversation = null;

  if (activeConversationId) {
    if (sidebarTab === "groups") {
      const selectedGroup = groups.find((g) => g._id === activeConversationId);
      if (selectedGroup) {
        activeConversation = {
          id: selectedGroup._id,
          type: "group",
          peer: {
            name: selectedGroup.name,
            subtitle: selectedGroup.description || `${selectedGroup.members?.length || 0} members`,
            isOnline: false,
            avatarUrl: selectedGroup.groupPhoto || "",
            initials: getInitials(selectedGroup.name).substring(0, 2),
            membersCount: selectedGroup.members?.length || 0,
          },
          inviteCode: selectedGroup.inviteCode,
          telegramUsername: selectedGroup.telegramUsername,
          messages: messages.map((m) => ({
            id: m._id,
            role: String(m.senderId?._id || m.senderId) === String(authUser?._id) ? "me" : "them",
            senderName: m.senderId?.fullName || "Group Member",
            text: m.text || "",
            time: formatMessageTime(m.createdAt),
            imageUrl: m.image,
            videoUrl: m.video,
            audioUrl: m.audio,
            reactions: m.reactions || [],
          })),
        };
      }
    } else if (sidebarTab === "channels") {
      const selectedChannel = channels.find((c) => c._id === activeConversationId);
      if (selectedChannel) {
        const isOwner = String(selectedChannel.owner?._id || selectedChannel.owner) === String(authUser?._id);
        const isAdmin = isOwner || selectedChannel.admins?.some(admin => String(admin?._id || admin) === String(authUser?._id));
        
        activeConversation = {
          id: selectedChannel._id,
          type: "channel",
          peer: {
            name: selectedChannel.name,
            subtitle: selectedChannel.description || `${selectedChannel.subscribers?.length || 0} subscribers`,
            isOnline: false,
            avatarUrl: "",
            initials: getInitials(selectedChannel.name).substring(0, 2),
            subscribersCount: selectedChannel.subscribers?.length || 0,
          },
          inviteCode: selectedChannel.inviteCode,
          telegramUsername: selectedChannel.telegramUsername,
          isAdmin,
          messages: messages.map((m) => ({
            id: m._id,
            role: String(m.senderId?._id || m.senderId) === String(authUser?._id) ? "me" : "them",
            senderName: m.senderId?.fullName || "Channel Admin",
            text: m.text || "",
            time: formatMessageTime(m.createdAt),
            imageUrl: m.image,
            videoUrl: m.video,
            audioUrl: m.audio,
            reactions: m.reactions || [],
          })),
        };
      }
    } else {
      const selectedUser = users.find((user) => user._id === activeConversationId) ||
                          conversations.find((user) => user._id === activeConversationId);
      if (selectedUser) {
        activeConversation = mapUserToConversation({ user: selectedUser, messages, authUser, onlineUsers });
      }
    }
  }

  return {
    activeConversation,
    activeConversationId,
    isLargeScreen,
  };
}