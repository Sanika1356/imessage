import { useState } from "react";
import { X, Phone, Mail, Search, UserPlus, Loader2 } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { useChatStore } from "../../store/useChatStore";

export function AddContactModal({ isOpen, onClose }) {
  const [searchType, setSearchType] = useState("phone"); // phone or email
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Please enter a phone number or email");
      return;
    }

    setIsSearching(true);
    setFoundUser(null);

    try {
      const res = await axiosInstance.get("/contacts/find", {
        params: { contact: searchValue.trim() }
      });
      
      setFoundUser(res.data);
      toast.success("User found!");
    } catch (error) {
      console.error("Error finding user:", error);
      if (error.response?.status === 404) {
        toast.error("No user found with this contact. Invite them to join!");
      } else {
        toast.error(error.response?.data?.message || "Failed to find user");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = () => {
    if (foundUser) {
      setActiveConversationId(foundUser._id);
      setSidebarTab("chats");
      onClose();
      setSearchValue("");
      setFoundUser(null);
    }
  };

  const handleInvite = async () => {
    try {
      const inviteData = searchType === "phone" 
        ? { phoneNumber: searchValue.trim() }
        : { email: searchValue.trim() };
      
      await axiosInstance.post("/contacts/invite", inviteData);
      toast.success("Invitation sent!");
      setSearchValue("");
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invitation");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-4">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Add Contact
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Type Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => {
              setSearchType("phone");
              setSearchValue("");
              setFoundUser(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
              searchType === "phone"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Phone className="h-4 w-4" />
            Phone Number
          </button>
          <button
            onClick={() => {
              setSearchType("email");
              setSearchValue("");
              setFoundUser(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
              searchType === "email"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={searchType === "email" ? "email" : "tel"}
                placeholder={
                  searchType === "phone" 
                    ? "Enter phone number (e.g., +1234567890)" 
                    : "Enter email address"
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-2 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchValue.trim()}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            {searchType === "phone" 
              ? "Include country code (e.g., +1 for USA)" 
              : "Enter the exact email address"}
          </p>
        </div>

        {/* Results */}
        {foundUser && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-700/50 p-4">
              <div className="flex items-center gap-3">
                {foundUser.profilePic ? (
                  <img
                    src={foundUser.profilePic}
                    alt={foundUser.fullName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white font-semibold text-lg">
                    {foundUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                    {foundUser.fullName}
                  </h3>
                  <p className="text-sm text-neutral-500 truncate">
                    {searchType === "phone" ? foundUser.phoneNumber : foundUser.email}
                  </p>
                  {foundUser.bio && (
                    <p className="text-xs text-neutral-400 mt-1 truncate">
                      {foundUser.bio}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleStartChat}
                className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 transition-colors"
              >
                Start Chat
              </button>
            </div>
          </div>
        )}

        {/* Invite Option */}
        {!foundUser && searchValue && !isSearching && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                User not found. Would you like to invite them?
              </p>
              <button
                onClick={handleInvite}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 px-4 py-2 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Send Invitation
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-2xl">
          <p className="text-xs text-neutral-500 text-center">
            💡 Tip: Users must register with their phone number or email to be found
          </p>
        </div>
      </div>
    </div>
  );
}
