import { useState, useEffect } from "react";
import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { APP_NAME, AppLogo } from "../AppLogo";
import { UserButton } from "@clerk/react";

import { SearchField, Tabs, useOverlayState } from "@heroui/react";
import { MessageSquareIcon, Mail, UserPlus, RefreshCw } from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import { NewChatModal } from "./NewChatModal";
import { AddContactModal } from "./AddContactModal";
import { PhoneNumberSetup } from "./PhoneNumberSetup";
import { ContactSyncModal } from "./ContactSyncModal";

function mapUserForList(user, onlineUsers) {
  return {
    conversationId: user._id,
    id: user._id,
    name: user.fullName,
    avatarUrl: user.profilePic,
    initials: getInitials(user.fullName),
    isOnline: onlineUsers.includes(user._id),
  };
}

function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const users = useChatStore((state) => state.users);

  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);

  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);

  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const authUser = useAuthStore((state) => state.authUser);
  const { activeConversationId, isLargeScreen } = useSelectedConversation();

  const newChatOverlay = useOverlayState();
  
  const [showAddContact, setShowAddContact] = useState(false);
  const [showPhoneSetup, setShowPhoneSetup] = useState(false);
  const [showContactSync, setShowContactSync] = useState(false);

  const handleSyncContacts = () => {
    // Check if user has phone number
    if (!authUser?.phoneNumber) {
      setShowPhoneSetup(true);
    } else {
      setShowContactSync(true);
    }
  };

  const handleAddContact = () => {
    // Check if user has phone number
    if (!authUser?.phoneNumber) {
      setShowPhoneSetup(true);
    } else {
      setShowAddContact(true);
    }
  };

  const handlePhoneUpdate = (updatedUser) => {
    // Update auth user with new phone number
    useAuthStore.getState().checkAuth();
    setShowPhoneSetup(false);
    // Show contact sync after phone setup
    setShowContactSync(true);
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const conversationUsers = conversations.map((user) => mapUserForList(user, onlineUsers));
  const allUsers = users.map((user) => mapUserForList(user, onlineUsers));

  const filteredConversations = normalizedSearchQuery
    ? conversationUsers.filter((conversation) =>
        conversation.name.toLowerCase().includes(normalizedSearchQuery),
      )
    : conversationUsers;

  const filteredUsers = normalizedSearchQuery
    ? allUsers.filter((user) => user.name.toLowerCase().includes(normalizedSearchQuery))
    : allUsers;

  return (
    <aside
      className={`w-full shrink-0 flex-col overflow-hidden border-r border-border lg:w-76 ${
        !isLargeScreen && activeConversationId ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="shrink-0 border-b border-border px-2 pb-2 pt-2.5 sm:px-3 sm:pt-3">
        <div className="flex items-center gap-2 px-0.5 sm:gap-2.5 sm:px-1">
          <AppLogo size={32} className="size-8 shrink-0 rounded-[9px] sm:size-8.5" alt="" />
          <p className="flex-1 truncate text-base font-bold tracking-tight sm:text-lg">
            {APP_NAME}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSyncContacts}
              className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Sync phone contacts"
            >
              <RefreshCw className="size-5 text-blue-600" />
            </button>
            <button
              onClick={handleAddContact}
              className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Add contact by phone/email"
            >
              <UserPlus className="size-5 text-green-600" />
            </button>
            <NewChatModal state={newChatOverlay} />
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <ContactSyncModal 
        isOpen={showContactSync} 
        onClose={() => setShowContactSync(false)} 
      />
      
      <AddContactModal 
        isOpen={showAddContact} 
        onClose={() => setShowAddContact(false)} 
      />
      
      {showPhoneSetup && (
        <PhoneNumberSetup
          currentUser={authUser}
          onUpdate={handlePhoneUpdate}
          onClose={() => setShowPhoneSetup(false)}
        />
      )}

      <Tabs
        selectedKey={sidebarTab}
        onSelectionChange={(key) => setSidebarTab(String(key))}
        variant="secondary"
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <div className="shrink-0 border-b border-border px-3 pb-2 pt-2">
          <SearchField
            fullWidth
            variant="secondary"
            className="w-full"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search" />
              {searchQuery ? <SearchField.ClearButton /> : null}
            </SearchField.Group>
          </SearchField>
        </div>

        <Tabs.ListContainer className="shrink-0 border-b border-border px-1 pb-2 pt-1 overflow-x-auto scrollbar-none">
          <Tabs.List className="w-full gap-0.5 min-w-[240px]">
            <Tabs.Tab id="chats" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <MessageSquareIcon className="size-3.5 opacity-80" aria-hidden />
              Messages
            </Tabs.Tab>
            <Tabs.Tab id="emails" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <Mail className="size-3.5 opacity-80" aria-hidden />
              Emails
            </Tabs.Tab>
            <Tabs.Tab id="users" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <UserPlus className="size-3.5 opacity-80" aria-hidden />
              Contacts
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel
          id="chats"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No conversations. Start a new chat!
            </p>
          ) : (
            <div className="flex flex-col gap-1 px-2 py-2">
              {filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeConversationId === conversation.conversationId}
                  onClick={() => setActiveConversationId(conversation.conversationId)}
                />
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel
          id="emails"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          <p className="px-4 py-6 text-center text-sm text-muted">
            Email conversations will appear here
          </p>
        </Tabs.Panel>

        <Tabs.Panel
          id="users"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredUsers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No contacts available. Sync your contacts!
            </p>
          ) : (
            <div className="flex flex-col gap-1 px-2 py-2">
              {filteredUsers.map((user) => (
                <ConversationRow
                  key={user.id}
                  conversation={user}
                  isActive={activeConversationId === user.conversationId}
                  onClick={() => setActiveConversationId(user.conversationId)}
                />
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}

export default ChatSidebar;
