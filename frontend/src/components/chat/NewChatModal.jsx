import { Button, Modal, SearchField, Avatar } from "@heroui/react";
import { MessageSquarePlus, Search, UserCheck } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import toast from "react-hot-toast";

export function NewChatModal({ state }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const searchUsers = useChatStore((state) => state.searchUsers);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);
  
  const joinGroup = useChatStore((state) => state.joinGroup);
  const subscribeChannel = useChatStore((state) => state.subscribeChannel);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    const users = await searchUsers(query);
    setResults(users);
    setIsLoading(false);
  };

  const handleStartChat = (user) => {
    setSelectedUser(user);
    setActiveConversationId(user._id);
    setSidebarTab("chats");
    setQuery("");
    setResults([]);
    state.close();
  };

  const handleJoinCode = async () => {
    const code = inviteCode.trim();
    if (!code) return;
    setIsJoining(true);
    
    // Attempt joining as group first
    const groupRes = await joinGroup(code);
    if (groupRes) {
      setActiveConversationId(groupRes._id);
      setSidebarTab("groups");
      setInviteCode("");
      state.close();
      setIsJoining(false);
      return;
    }

    // If group join fails (or isn't found), try channel subscription
    const channelRes = await subscribeChannel(code);
    if (channelRes) {
      setActiveConversationId(channelRes._id);
      setSidebarTab("channels");
      setInviteCode("");
      state.close();
    } else {
      toast.error("Invalid invite code or already joined/subscribed");
    }
    
    setIsJoining(false);
  };

  return (
    <Modal.Root state={state}>
      <Modal.Trigger>
        <Button variant="ghost" size="sm" isIconOnly className="text-foreground shrink-0 size-8">
          <MessageSquarePlus className="size-5" />
        </Button>
      </Modal.Trigger>

      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="max-h-[85dvh] border border-white/10 bg-[#2a2a2c] text-foreground shadow-2xl">
            <Modal.Header className="flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
              <Modal.Heading className="text-lg font-semibold tracking-tight text-white">
                New Connection
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="isolate pt-4">
              {/* Search User Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Find User
                </label>
                <div className="flex gap-2">
                  <SearchField
                    fullWidth
                    variant="secondary"
                    className="flex-1"
                    value={query}
                    onChange={setQuery}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  >
                    <SearchField.Group className="rounded-xl">
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Email, phone or name" />
                      {query ? <SearchField.ClearButton /> : null}
                    </SearchField.Group>
                  </SearchField>
                  <Button 
                    variant="primary" 
                    isDisabled={isLoading || !query.trim()} 
                    onPress={handleSearch}
                    className="h-10"
                  >
                    {isLoading ? "..." : <Search className="size-4" />}
                  </Button>
                </div>
              </div>

              {/* User Results */}
              <div className="mt-3 space-y-2">
                {results.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <Avatar.Image src={user.profilePic} alt={user.fullName} />
                        <Avatar.Fallback className="text-sm font-semibold">
                          {user.fullName.split(" ").map(n => n[0]).join("")}
                        </Avatar.Fallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white">{user.fullName}</p>
                        <p className="text-xs text-zinc-400">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-[10px] text-accent mt-0.5">{user.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => handleStartChat(user)}
                      className="rounded-lg text-xs"
                    >
                      <UserCheck className="size-3.5 mr-1" />
                      Chat
                    </Button>
                  </div>
                ))}
              </div>

              {/* Invite Code Join Section */}
              <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Join Group or Subscribe Channel
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter invite code or Telegram @username"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent text-xs"
                  />
                  <Button
                    variant="primary"
                    isDisabled={isJoining || !inviteCode.trim()}
                    onPress={handleJoinCode}
                    className="h-10 text-xs px-4"
                  >
                    {isJoining ? "Joining..." : "Join"}
                  </Button>
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
