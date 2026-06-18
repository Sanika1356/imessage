import { useState, useEffect } from "react";
import { X, Phone, Users, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { useChatStore } from "../../store/useChatStore";

export function ContactSyncModal({ isOpen, onClose }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [syncedContacts, setSyncedContacts] = useState([]);
  const [step, setStep] = useState("request"); // request, syncing, complete
  
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);
  const getUsers = useChatStore((state) => state.getUsers);

  useEffect(() => {
    if (isOpen) {
      setStep("request");
      setContacts([]);
      setSyncedContacts([]);
    }
  }, [isOpen]);

  const requestContactsPermission = async () => {
    try {
      // Check if Contacts API is supported
      if (!('contacts' in navigator)) {
        toast.error("Contact access not supported on this browser. Try Chrome on Android or use manual add.");
        return;
      }

      setIsSyncing(true);
      setStep("syncing");

      // Request contact access (Web Contacts API)
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      
      const contacts = await navigator.contacts.select(props, opts);
      
      if (contacts && contacts.length > 0) {
        setContacts(contacts);
        await syncContactsWithServer(contacts);
      } else {
        toast.error("No contacts selected");
        setStep("request");
      }
    } catch (error) {
      console.error("Error accessing contacts:", error);
      if (error.name === 'NotSupportedError') {
        toast.error("Contact sync not supported. Please add contacts manually or use Chrome on Android.");
      } else {
        toast.error("Failed to access contacts. Please grant permission.");
      }
      setStep("request");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncContactsWithServer = async (deviceContacts) => {
    try {
      // Extract phone numbers from contacts
      const phoneNumbers = [];
      
      deviceContacts.forEach(contact => {
        if (contact.tel && contact.tel.length > 0) {
          contact.tel.forEach(telObj => {
            if (telObj) {
              phoneNumbers.push(telObj);
            }
          });
        }
      });

      if (phoneNumbers.length === 0) {
        toast.error("No phone numbers found in selected contacts");
        return;
      }

      // Send to server to check which are registered
      const response = await axiosInstance.post("/contacts/sync", {
        phoneNumbers: phoneNumbers
      });

      setSyncedContacts(response.data.contacts);
      setStep("complete");
      
      // Refresh users list
      await getUsers();
      
      toast.success(`Found ${response.data.total} contacts on the app!`);
    } catch (error) {
      console.error("Error syncing contacts:", error);
      toast.error("Failed to sync contacts with server");
    }
  };

  const handleStartChat = (userId) => {
    setActiveConversationId(userId);
    setSidebarTab("chats");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-800 shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Sync Contacts
              </h2>
              <p className="text-sm text-neutral-500">
                Find friends already on the app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "request" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Phone className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                Access Your Contacts
              </h3>
              
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                We'll securely check which of your contacts are already using the app so you can connect with them instantly.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  🔒 Your Privacy Matters
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Only phone numbers are checked</li>
                  <li>• Contacts are not stored on our servers</li>
                  <li>• We only return matches found on the app</li>
                  <li>• You control what you share</li>
                </ul>
              </div>

              <button
                onClick={requestContactsPermission}
                disabled={isSyncing}
                className="w-full rounded-lg bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Accessing Contacts...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    Sync My Contacts
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-500 mt-4">
                Note: Contact sync only works on Chrome for Android. Desktop users should add contacts manually.
              </p>
            </div>
          )}

          {step === "syncing" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <RefreshCw className="h-10 w-10 text-green-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                Syncing Contacts...
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Checking which contacts are on the app
              </p>
            </div>
          )}

          {step === "complete" && (
            <div>
              {syncedContacts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                    <AlertCircle className="h-10 w-10 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    No Contacts Found
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    None of your contacts are on the app yet. Invite them to join!
                  </p>
                  <button
                    onClick={onClose}
                    className="rounded-lg bg-neutral-200 dark:bg-neutral-700 px-6 py-2 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      Found {syncedContacts.length} contact{syncedContacts.length !== 1 ? 's' : ''} on the app
                    </p>
                  </div>

                  <div className="space-y-2">
                    {syncedContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        {contact.profilePic ? (
                          <img
                            src={contact.profilePic}
                            alt={contact.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white font-semibold">
                            {contact.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                            {contact.fullName}
                          </h4>
                          <p className="text-sm text-neutral-500 truncate">
                            {contact.phoneNumber}
                          </p>
                          {contact.bio && (
                            <p className="text-xs text-neutral-400 truncate">
                              {contact.bio}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartChat(contact._id)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Message
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={onClose}
                    className="mt-4 w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
