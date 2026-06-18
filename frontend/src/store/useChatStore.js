import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create(
  persist(
    (set, get) => ({
      users: [],
      conversations: [],
      messages: [],
      groups: [],
      channels: [],
      emails: [],
      selectedUser: null,
      activeGroup: null,
      activeChannel: null,
      activeEmailFolder: "inbox",
      selectedEmail: null,
      isConversationsLoading: false,
      isUsersLoading: false,
      isMessagesLoading: false,
      isGroupsLoading: false,
      isChannelsLoading: false,
      isEmailsLoading: false,
      activeConversationId: null, // represents active DM, group, or channel ID
      searchQuery: "",
      sidebarTab: "chats", // "chats" | "groups" | "channels" | "emails" | "users"
      composerText: "",
      isSoundEnabled: true,
      isSendingMedia: false,
      typingUsers: {}, // { [userId/groupId]: true/false or object of users }

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set((state) => ({
            users: res.data,
            selectedUser:
              state.selectedUser && res.data.some((user) => user._id === state.selectedUser._id)
                ? state.selectedUser
                : null,
          }));
        } catch (error) {
          console.log("Error in getUsers", error.message);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
          const res = await axiosInstance.get("/messages/conversations");
          set({ conversations: res.data });
        } catch (error) {
          console.log("Error in getConversations", error.message);
        } finally {
          set({ isConversationsLoading: false });
        }
      },

      getMessages: async (userId) => {
        if (!userId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return false;

        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          set({ messages: [...messages, res.data], composerText: "" });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
          return false;
        }
      },

      // Groups actions
      getGroups: async () => {
        set({ isGroupsLoading: true });
        try {
          const res = await axiosInstance.get("/groups");
          set({ groups: res.data });
        } catch (error) {
          console.log("Error in getGroups", error.message);
        } finally {
          set({ isGroupsLoading: false });
        }
      },

      createGroup: async (groupData) => {
        try {
          const res = await axiosInstance.post("/groups/create", groupData);
          set((state) => ({ groups: [...state.groups, res.data] }));
          toast.success("Group created successfully!");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to create group");
          return null;
        }
      },

      joinGroup: async (inviteCode) => {
        try {
          const res = await axiosInstance.post("/groups/join", { inviteCode });
          set((state) => ({ groups: [...state.groups, res.data] }));
          toast.success("Joined group successfully!");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to join group");
          return null;
        }
      },

      getGroupMessages: async (groupId) => {
        if (!groupId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/groups/${groupId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load group messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendGroupMessage: async (groupId, messageData) => {
        try {
          const res = await axiosInstance.post(`/groups/send/${groupId}`, messageData);
          set((state) => ({ messages: [...state.messages, res.data], composerText: "" }));
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send group message");
          return false;
        }
      },

      // Channels actions
      getChannels: async () => {
        set({ isChannelsLoading: true });
        try {
          const res = await axiosInstance.get("/channels");
          set({ channels: res.data });
        } catch (error) {
          console.log("Error in getChannels", error.message);
        } finally {
          set({ isChannelsLoading: false });
        }
      },

      createChannel: async (channelData) => {
        try {
          const res = await axiosInstance.post("/channels/create", channelData);
          set((state) => ({ channels: [...state.channels, res.data] }));
          toast.success("Channel created successfully!");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to create channel");
          return null;
        }
      },

      subscribeChannel: async (inviteCode) => {
        try {
          const res = await axiosInstance.post("/channels/subscribe", { inviteCode });
          set((state) => ({ channels: [...state.channels, res.data] }));
          toast.success("Subscribed to channel successfully!");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to subscribe to channel");
          return null;
        }
      },

      getChannelPosts: async (channelId) => {
        if (!channelId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/channels/${channelId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load channel posts");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      postToChannel: async (channelId, postData) => {
        try {
          const res = await axiosInstance.post(`/channels/send/${channelId}`, postData);
          set((state) => ({ messages: [...state.messages, res.data], composerText: "" }));
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to post to channel");
          return false;
        }
      },

      pinPost: async (channelId, messageId) => {
        try {
          await axiosInstance.post("/channels/pin", { channelId, messageId });
          toast.success("Post pinned!");
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to pin post");
        }
      },

      // Emails actions
      getEmails: async (folder) => {
        set({ isEmailsLoading: true });
        try {
          const res = await axiosInstance.get(`/emails?folder=${folder}`);
          set({ emails: res.data });
        } catch (error) {
          console.log("Error in getEmails", error.message);
        } finally {
          set({ isEmailsLoading: false });
        }
      },

      sendEmail: async (emailData) => {
        try {
          const res = await axiosInstance.post("/emails/send", emailData);
          toast.success("Email sent successfully!");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send email");
          return null;
        }
      },

      saveDraft: async (draftData) => {
        try {
          const res = await axiosInstance.post("/emails/draft", draftData);
          toast.success("Draft saved!");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to save draft");
          return null;
        }
      },

      updateEmailStatus: async (emailId, statusData) => {
        try {
          const res = await axiosInstance.put(`/emails/${emailId}`, statusData);
          set((state) => ({
            emails: state.emails.map(email => email._id === emailId ? res.data : email)
          }));
          return res.data;
        } catch (error) {
          console.log("Error in updateEmailStatus", error.message);
          return null;
        }
      },

      searchUsers: async (query) => {
        try {
          const res = await axiosInstance.get(`/messages/search?query=${encodeURIComponent(query)}`);
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to search users");
          return [];
        }
      },

      // Global socket events (subscribed once on socket connection)
      subscribeToGlobalEvents: (socket) => {
        if (!socket) return;

        socket.off("newMessage");
        socket.off("newGroupMessage");
        socket.off("newChannelPost");
        socket.off("newEmail");

        socket.on("newMessage", (newMessage) => {
          const activeConversationId = get().activeConversationId;
          const sidebarTab = get().sidebarTab;

          // If we are currently chatting with this sender/receiver, append to messages
          if (sidebarTab === "chats" && (String(newMessage.senderId) === String(activeConversationId) || String(newMessage.receiverId) === String(activeConversationId))) {
            set({ messages: [...get().messages, newMessage] });
            // Emit read receipt back to sender
            if (String(newMessage.senderId) === String(activeConversationId)) {
              socket.emit("message:read", { messageId: newMessage._id, senderId: newMessage.senderId });
            }
          }
          get().getConversations();
        });

        socket.on("newGroupMessage", (newMessage) => {
          const activeConversationId = get().activeConversationId;
          const sidebarTab = get().sidebarTab;

          if (sidebarTab === "groups" && String(newMessage.groupId) === String(activeConversationId)) {
            set({ messages: [...get().messages, newMessage] });
          }
          get().getGroups();
        });

        socket.on("newChannelPost", (newMessage) => {
          const activeConversationId = get().activeConversationId;
          const sidebarTab = get().sidebarTab;

          if (sidebarTab === "channels" && String(newMessage.channelId) === String(activeConversationId)) {
            set({ messages: [...get().messages, newMessage] });
          }
          get().getChannels();
        });

        socket.on("newEmail", (email) => {
          toast.success(`New Email from ${email.sender}: ${email.subject}`);
          set((state) => ({ emails: [email, ...state.emails] }));
        });
      },

      // Socket subscriptions for active conversation specific events (typing, read receipts)
      subscribeToMessages: (activeId) => {
        if (!activeId) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("typing:start");
        socket.off("typing:stop");
        socket.off("message:read");

        // Typing indicators
        socket.on("typing:start", (data) => {
          const { senderId, groupId } = data;
          if (groupId && String(groupId) === String(activeId)) {
            set((state) => ({
              typingUsers: {
                ...state.typingUsers,
                [groupId]: { ...(state.typingUsers[groupId] || {}), [senderId]: true }
              }
            }));
          } else if (!groupId && String(senderId) === String(activeId)) {
            set((state) => ({
              typingUsers: { ...state.typingUsers, [senderId]: true }
            }));
          }
        });

        socket.on("typing:stop", (data) => {
          const { senderId, groupId } = data;
          if (groupId && String(groupId) === String(activeId)) {
            const groupTyping = { ...(get().typingUsers[groupId] || {}) };
            delete groupTyping[senderId];
            set((state) => ({
              typingUsers: { ...state.typingUsers, [groupId]: groupTyping }
            }));
          } else if (!groupId && String(senderId) === String(activeId)) {
            set((state) => ({
              typingUsers: { ...state.typingUsers, [senderId]: false }
            }));
          }
        });

        // Read receipts
        socket.on("message:read", (data) => {
          const { messageId } = data;
          set((state) => ({
            messages: state.messages.map((m) =>
              m._id === messageId ? { ...m, status: "read" } : m
            )
          }));
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("typing:start");
        socket.off("typing:stop");
        socket.off("message:read");
      },

      sendTypingStatus: (isTyping) => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        const { activeConversationId, sidebarTab } = get();
        if (!activeConversationId) return;

        const payload = sidebarTab === "groups" 
          ? { groupId: activeConversationId } 
          : { receiverId: activeConversationId };

        if (isTyping) {
          socket.emit("typing:start", payload);
        } else {
          socket.emit("typing:stop", payload);
        }
      },

      setSelectedUser: (selectedUser) => set({ 
        selectedUser, 
        activeGroup: null, 
        activeChannel: null, 
        selectedEmail: null 
      }),
      
      setActiveGroup: (activeGroup) => set({ 
        activeGroup, 
        selectedUser: null, 
        activeChannel: null, 
        selectedEmail: null 
      }),
      
      setActiveChannel: (activeChannel) => set({ 
        activeChannel, 
        selectedUser: null, 
        activeGroup: null, 
        selectedEmail: null 
      }),

      setActiveConversationId: (activeConversationId) => {
        set((state) => {
          let selectedUser = null;
          let activeGroup = null;
          let activeChannel = null;

          if (state.sidebarTab === "chats" || state.sidebarTab === "users") {
            selectedUser = state.users.find((user) => user._id === activeConversationId) ||
                           state.conversations.find((user) => user._id === activeConversationId) || null;
          } else if (state.sidebarTab === "groups") {
            activeGroup = state.groups.find((g) => g._id === activeConversationId) || null;
          } else if (state.sidebarTab === "channels") {
            activeChannel = state.channels.find((c) => c._id === activeConversationId) || null;
          }

          return {
            activeConversationId,
            selectedUser,
            activeGroup,
            activeChannel,
            selectedEmail: null,
            messages: activeConversationId ? state.messages : [],
          };
        });
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab, activeConversationId: null, selectedUser: null, activeGroup: null, activeChannel: null, selectedEmail: null }),
      setComposerText: (composerText) => set({ composerText }),
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),
      setActiveEmailFolder: (activeEmailFolder) => set({ activeEmailFolder, selectedEmail: null }),
      setSelectedEmail: (selectedEmail) => set({ selectedEmail }),

      sendTextMessage: async (conversationId) => {
        const { composerText, sidebarTab } = get();
        const messageText = composerText.trim();
        if (!conversationId || !messageText) return false;

        if (sidebarTab === "groups") {
          return get().sendGroupMessage(conversationId, { text: messageText });
        } else if (sidebarTab === "channels") {
          return get().postToChannel(conversationId, { text: messageText });
        } else {
          return get().sendMessage({ text: messageText });
        }
      },

      sendMediaMessage: async ({ conversationId, file }) => {
        if (!conversationId || !file) return false;
        const { sidebarTab } = get();

        const formData = new FormData();
        formData.append("media", file);

        set({ isSendingMedia: true });
        try {
          if (sidebarTab === "groups") {
            return await get().sendGroupMessage(conversationId, formData);
          } else if (sidebarTab === "channels") {
            return await get().postToChannel(conversationId, formData);
          } else {
            return await get().sendMessage(formData);
          }
        } finally {
          set({ isSendingMedia: false });
        }
      },

      // Voice message support
      sendVoiceMessage: async (conversationId, audioBlob) => {
        if (!conversationId || !audioBlob) return false;
        const { sidebarTab } = get();

        const formData = new FormData();
        formData.append("media", audioBlob, "voice-message.webm");

        set({ isSendingMedia: true });
        try {
          if (sidebarTab === "groups") {
            return await get().sendGroupMessage(conversationId, formData);
          } else if (sidebarTab === "channels") {
            return await get().postToChannel(conversationId, formData);
          } else {
            return await get().sendMessage(formData);
          }
        } finally {
          set({ isSendingMedia: false });
        }
      },

      // Message reactions
      addReaction: async (messageId, emoji) => {
        try {
          const res = await axiosInstance.post(`/groups/messages/${messageId}/reactions`, { emoji });
          set((state) => ({
            messages: state.messages.map((m) =>
              m._id === messageId ? { ...m, reactions: res.data.reactions } : m
            )
          }));
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to add reaction");
          return false;
        }
      },

      // Public groups discovery
      getPublicGroups: async () => {
        try {
          const res = await axiosInstance.get("/groups/public");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load public groups");
          return [];
        }
      },
    }),
    {
      name: "imessage-storage",
      partialize: (state) => ({ isSoundEnabled: state.isSoundEnabled }),
    },
  ),
);