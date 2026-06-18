import { useState, useEffect } from "react";
import { X, Users, Search, Globe } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { useChatStore } from "../../store/useChatStore";

export function PublicGroupsModal({ isOpen, onClose }) {
  const [publicGroups, setPublicGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const getGroups = useChatStore((state) => state.getGroups);

  useEffect(() => {
    if (isOpen) {
      fetchPublicGroups();
    }
  }, [isOpen]);

  const fetchPublicGroups = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/groups/public");
      setPublicGroups(res.data);
    } catch (error) {
      console.error("Error fetching public groups:", error);
      toast.error("Failed to load public groups");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (inviteCode) => {
    try {
      const res = await axiosInstance.post("/groups/join", { inviteCode });
      toast.success(`Joined ${res.data.name}!`);
      await getGroups();
      onClose();
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error(error.response?.data?.message || "Failed to join group");
    }
  };

  const filteredGroups = publicGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Public Groups
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 px-3 py-2">
            <Search className="h-5 w-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Groups List */}
        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              {searchQuery ? "No groups found" : "No public groups available"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => (
                <div
                  key={group._id}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-700/50 p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {group.groupPhoto ? (
                      <img
                        src={group.groupPhoto}
                        alt={group.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white font-semibold">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {group.name}
                      </h3>
                      <p className="text-sm text-neutral-500 truncate">
                        {group.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                        <Users className="h-3 w-3" />
                        <span>{group.memberCount} members</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinGroup(group.inviteCode)}
                    className="ml-3 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
