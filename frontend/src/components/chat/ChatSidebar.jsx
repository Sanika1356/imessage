import { useEffect, useState } from "react";
import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { APP_NAME, AppLogo } from "../AppLogo";
import { UserButton } from "@clerk/react";

import { SearchField, Tabs, useOverlayState } from "@heroui/react";
import { MessageSquareIcon, UsersIcon, Users, Megaphone, Mail, UserPlus, RefreshCw } from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import { NewChatModal } from "./NewChatModal";
import { CreateGroupModal } from "./CreateGroupModal";
import { CreateChannelModal } from "./CreateChannelModal";
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

function mapGroupForList(group) {
  return {
    conversationId: group._id,
    id: group._id,
    name: group.name,
    avatarUrl: group.groupPhoto || "",
    initials: group.name.split(" ").map(n => n[0]).join("").substring(0, 2),
    isOnline: false,
  };
}

function mapChannelForList(channel) {
  return {
    conversationId: channel._id,
    id: channel._id,
    name: channel.name,
    avatarUrl: "",
    initials: channel.name.split(" ").map(n => n[0]).join("").substring(0, 2),
    isOnline: false,
  };
}

function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const users = useChatStore((state) => state.users);
  const groups = useChatStore((state) => state.groups);
  const channels = useChatStore((state) => state.channels);

  const getGroups = useChatStore((state) => state.getGroups);
  const getChannels = useChatStore((state) => state.getChannels);

  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);

  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);

  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const authUser = useAuthStore((state) => state.authUser);
  const { activeConversationId, isLargeScreen } = useSelectedConversation();

  const newChatOverlay = useOverlayState();
  const createGroupOverlay = useOverlayState();
  const createChannelOverlay = useOverlayState();
  
  const [showAddContact, setShowAddContact] = useState(false);
  const [showPhoneSetup, setShowPhoneSetup] = useState(false);
  const [showContactSync, setShowContactSync] = useState(false);

  useEffect(() => {
    getGroups();
    getChannels();
  }, [getGroups, getChannels]);

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
  const allGroups = groups.map(mapGroupForList);
  const allChannels = channels.map(mapChannelForList);

  const filteredConversations = normalizedSearchQuery
    ? conversationUsers.filter((conversation) =>
        conversation.name.toLowerCase().includes(normalizedSearchQuery),
      )
    : conversationUsers;

  const filteredUsers = normalizedSearchQuery
    ? allUsers.filter((user) => user.name.toLowerCase().includes(normalizedSearchQuery))
    : allUsers;

  const filteredGroups = normalizedSearchQuery
    ? allGroups.filter((g) => g.name.toLowerCase().includes(normalizedSearchQuery))
    : allGroups;

  const filteredChannels = normalizedSearchQuery
    ? allChannels.filter((c) => c.name.toLowerCase().includes(normalizedSearchQuery))
    : allChannels;

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
            <CreateGroupModal state={createGroupOverlay} />
            <CreateChannelModal state={createChannelOverlay} />
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
          <Tabs.List className="w-full gap-0.5 min-w-[340px]">
            <Tabs.Tab id="chats" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <MessageSquareIcon className="size-3.5 opacity-80" aria-hidden />
              DMs
            </Tabs.Tab>
            <Tabs.Tab id="groups" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <Users className="size-3.5 opacity-80" aria-hidden />
              Groups
            </Tabs.Tab>
            <Tabs.Tab id="channels" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <Megaphone className="size-3.5 opacity-80" aria-hidden />
              Channels
            </Tabs.Tab>
            <Tabs.Tab id="emails" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <Mail className="size-3.5 opacity-80" aria-hidden />
              Emails
            </Tabs.Tab>
            <Tabs.Tab id="users" className="flex-1 justify-center gap-1 text-[11px] py-1">
              <UsersIcon className="size-3.5 opacity-80" aria-hidden />
              Users
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel
          id="chats"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No conversations.
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                user={conversation}
                selected={conversation.id === activeConversationId}
                onSelect={() => setActiveConversationId(conversation.id)}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel
          id="groups"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredGroups.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No groups joined.
            </p>
          ) : (
            filteredGroups.map((group) => (
              <ConversationRow
                key={group.id}
                user={group}
                selected={group.id === activeConversationId}
                onSelect={() => setActiveConversationId(group.id)}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel
          id="channels"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredChannels.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No channels subscribed.
            </p>
          ) : (
            filteredChannels.map((channel) => (
              <ConversationRow
                key={channel.id}
                user={channel}
                selected={channel.id === activeConversationId}
                onSelect={() => setActiveConversationId(channel.id)}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel
          id="emails"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          <div className="px-4 py-6 text-center text-sm text-muted">
            <Mail className="size-8 mx-auto mb-2 text-zinc-500" />
            <p className="font-semibold text-white">Email Dashboard Active</p>
            <p className="text-xs mt-1">Manage compose, inbox and drafts inside the main panel.</p>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="users" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          {filteredUsers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No people match your search.</p>
          ) : (
            filteredUsers.map((user) => (
              <ConversationRow
                key={user.conversationId}
                user={user}
                selected={user.conversationId === activeConversationId}
                onSelect={() => setActiveConversationId(user.conversationId)}
              />
            ))
          )}
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}
export default ChatSidebar;