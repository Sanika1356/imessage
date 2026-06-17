import { useChatStore } from "../store/useChatStore";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect } from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";
import { EmailDashboard } from "../components/chat/EmailDashboard";

function ChatPage() {

  const getConversations = useChatStore((state) => state.getConversations);
  const getMessages = useChatStore((state) => state.getMessages);
  const getGroupMessages = useChatStore((state) => state.getGroupMessages);
  const getChannelPosts = useChatStore((state) => state.getChannelPosts);
  const getUsers = useChatStore((state) => state.getUsers);
  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);

  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  useEffect(() => {
    getUsers();
    getConversations();
  }, [getConversations, getUsers]);

  useEffect(() => {
    if (!activeConversationId) return;

    if (sidebarTab === "groups") {
      getGroupMessages(activeConversationId);
    } else if (sidebarTab === "channels") {
      getChannelPosts(activeConversationId);
    } else {
      getMessages(activeConversationId);
    }
    subscribeToMessages(activeConversationId);

    // cleanup
    return () => unsubscribeFromMessages();
  }, [
    activeConversationId,
    sidebarTab,
    getMessages,
    getGroupMessages,
    getChannelPosts,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  return (
    <div className="flex h-dvh w-dvw overflow-hidden bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden bg-background text-foreground">
        <ChatSidebar />

        <div
          className={`flex-1 flex-col overflow-hidden ${
            !isLargeScreen && !activeConversationId && sidebarTab !== "emails" ? "hidden lg:flex" : "flex"
          }`}
        >
          {sidebarTab === "emails" ? (
            <EmailDashboard />
          ) : (
            <>
              <ChatHeader />
              <MessageList />

              {/* Showcomposer in DMs, Groups, and Channels (only if user is admin in channels) */}
              {activeConversation &&
              (activeConversation.type !== "channel" || activeConversation.isAdmin) ? (
                <ChatComposer />
              ) : activeConversation && activeConversation.type === "channel" ? (
                <footer className="shrink-0 border-t border-border px-4 py-3 bg-surface/50 text-center text-xs text-muted">
                  Only administrators can post to this channel.
                </footer>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default ChatPage;