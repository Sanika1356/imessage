import { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { Button, Avatar, SearchField } from "@heroui/react";
import {
  Inbox,
  Send,
  File,
  Trash2,
  Mail,
  PenTool,
  Trash,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

export function EmailDashboard() {
  const emails = useChatStore((state) => state.emails);
  const getEmails = useChatStore((state) => state.getEmails);
  const sendEmail = useChatStore((state) => state.sendEmail);
  const saveDraft = useChatStore((state) => state.saveDraft);
  const updateEmailStatus = useChatStore((state) => state.updateEmailStatus);
  const activeEmailFolder = useChatStore((state) => state.activeEmailFolder);
  const setActiveEmailFolder = useChatStore((state) => state.setActiveEmailFolder);
  const selectedEmail = useChatStore((state) => state.selectedEmail);
  const setSelectedEmail = useChatStore((state) => state.setSelectedEmail);
  const isEmailsLoading = useChatStore((state) => state.isEmailsLoading);

  const [isComposing, setIsComposing] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getEmails(activeEmailFolder);
  }, [activeEmailFolder, getEmails]);

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      updateEmailStatus(email._id, { isRead: true });
    }
  };

  const handleMoveToTrash = async (emailId) => {
    const res = await updateEmailStatus(emailId, { folder: "trash" });
    if (res) {
      toast.success("Moved to Trash");
      setSelectedEmail(null);
      getEmails(activeEmailFolder);
    }
  };

  const handleSend = async () => {
    if (!recipient.trim()) {
      return toast.error("Recipient email is required");
    }
    const res = await sendEmail({
      recipient: recipient.trim(),
      cc: cc.trim() ? cc.split(",").map((e) => e.trim()) : [],
      bcc: bcc.trim() ? bcc.split(",").map((e) => e.trim()) : [],
      subject: subject.trim(),
      body: body.trim(),
    });

    if (res) {
      setIsComposing(false);
      resetComposer();
      getEmails(activeEmailFolder);
    }
  };

  const handleSaveDraft = async () => {
    const res = await saveDraft({
      recipient: recipient.trim(),
      cc: cc.trim() ? cc.split(",").map((e) => e.trim()) : [],
      bcc: bcc.trim() ? bcc.split(",").map((e) => e.trim()) : [],
      subject: subject.trim(),
      body: body.trim(),
    });

    if (res) {
      setIsComposing(false);
      resetComposer();
      getEmails(activeEmailFolder);
    }
  };

  const resetComposer = () => {
    setRecipient("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
  };

  const filteredEmails = searchQuery.trim()
    ? emails.filter(
        (email) =>
          (email.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (email.sender || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (email.body || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  return (
    <div className="flex flex-1 overflow-hidden bg-background h-full text-foreground">
      {/* Folder selector sidebar */}
      <div className="w-16 sm:w-48 shrink-0 border-r border-border flex flex-col items-center sm:items-stretch p-2 sm:p-3 space-y-2">
        <Button
          variant="primary"
          fullWidth
          onPress={() => setIsComposing(true)}
          className="rounded-xl font-medium text-xs sm:text-sm h-10 shrink-0"
        >
          <PenTool className="size-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Compose</span>
        </Button>

        <div className="flex-1 space-y-1.5 pt-4">
          <button
            onClick={() => setActiveEmailFolder("inbox")}
            className={`w-full flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeEmailFolder === "inbox" ? "bg-accent/12 text-accent" : "hover:bg-white/5 text-muted"
            }`}
          >
            <Inbox className="size-4" />
            <span className="hidden sm:inline">Inbox</span>
          </button>
          <button
            onClick={() => setActiveEmailFolder("sent")}
            className={`w-full flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeEmailFolder === "sent" ? "bg-accent/12 text-accent" : "hover:bg-white/5 text-muted"
            }`}
          >
            <Send className="size-4" />
            <span className="hidden sm:inline">Sent</span>
          </button>
          <button
            onClick={() => setActiveEmailFolder("draft")}
            className={`w-full flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeEmailFolder === "draft" ? "bg-accent/12 text-accent" : "hover:bg-white/5 text-muted"
            }`}
          >
            <File className="size-4" />
            <span className="hidden sm:inline">Drafts</span>
          </button>
          <button
            onClick={() => setActiveEmailFolder("trash")}
            className={`w-full flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeEmailFolder === "trash" ? "bg-accent/12 text-accent" : "hover:bg-white/5 text-muted"
            }`}
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Trash</span>
          </button>
        </div>
      </div>

      {/* Main Panel - Listing and Composer/Details */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email list */}
        <div
          className={`w-full sm:w-80 shrink-0 border-r border-border flex flex-col ${
            selectedEmail || isComposing ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-border">
            <SearchField
              fullWidth
              variant="secondary"
              value={searchQuery}
              onChange={setSearchQuery}
            >
              <SearchField.Group className="rounded-xl h-9 text-xs">
                <SearchField.SearchIcon className="size-3.5" />
                <SearchField.Input placeholder="Search emails" />
                {searchQuery ? <SearchField.ClearButton /> : null}
              </SearchField.Group>
            </SearchField>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isEmailsLoading ? (
              <p className="text-center text-xs text-muted py-8 animate-pulse">Loading emails...</p>
            ) : filteredEmails.length === 0 ? (
              <p className="text-center text-xs text-muted py-8">No emails found</p>
            ) : (
              filteredEmails.map((email) => {
                return (
                  <div
                    key={email._id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-3.5 cursor-pointer transition-colors relative ${
                      selectedEmail?._id === email._id
                        ? "bg-accent/10 border-l-2 border-accent"
                        : "hover:bg-white/3"
                    } ${!email.isRead && activeEmailFolder === "inbox" ? "font-bold text-white" : ""}`}
                  >
                    {!email.isRead && activeEmailFolder === "inbox" && (
                      <span className="absolute left-1 top-[42%] size-1.5 rounded-full bg-accent" />
                    )}
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="text-xs truncate max-w-[150px] text-zinc-300">
                        {email.sender}
                      </span>
                      <span className="text-[10px] text-muted whitespace-nowrap">
                        {new Date(email.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-white truncate mb-0.5">{email.subject}</p>
                    <p className="text-[11px] text-muted truncate">{email.body}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Details Pane / Compose Pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {isComposing ? (
            /* Compose Interface */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    className="md:hidden"
                    onPress={() => setIsComposing(false)}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <h3 className="text-sm font-semibold text-white">Compose Email</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onPress={handleSaveDraft}>
                    Draft
                  </Button>
                  <Button variant="primary" size="sm" onPress={handleSend}>
                    Send
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                <div className="flex items-center border-b border-border/40 pb-2">
                  <span className="text-xs text-muted w-12 shrink-0">To:</span>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600"
                  />
                </div>

                <div className="flex items-center border-b border-border/40 pb-2">
                  <span className="text-xs text-muted w-12 shrink-0">CC:</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="comma separated emails"
                    className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600"
                  />
                </div>

                <div className="flex items-center border-b border-border/40 pb-2">
                  <span className="text-xs text-muted w-12 shrink-0">BCC:</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="comma separated emails"
                    className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600"
                  />
                </div>

                <div className="flex items-center border-b border-border/40 pb-2">
                  <span className="text-xs text-muted w-12 shrink-0">Subject:</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600 font-medium"
                  />
                </div>

                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Start writing..."
                  rows={12}
                  className="w-full bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600 resize-none pt-2"
                />
              </div>
            </div>
          ) : selectedEmail ? (
            /* Email Details Interface */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={() => setSelectedEmail(null)}
                  className="sm:hidden"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-1.5 ml-auto">
                  {activeEmailFolder !== "trash" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      className="text-error"
                      onPress={() => handleMoveToTrash(selectedEmail._id)}
                    >
                      <Trash className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onPress={() => setSelectedEmail(null)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white mb-2">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-9">
                        <Avatar.Fallback className="text-xs font-bold bg-accent/20 text-accent">
                          {selectedEmail.sender.substring(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-white">{selectedEmail.sender}</p>
                        <p className="text-[10px] text-muted">to {selectedEmail.recipient}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted">
                      {new Date(selectedEmail.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedEmail.cc?.length > 0 && (
                  <p className="text-[11px] text-muted">
                    <span className="font-semibold">CC:</span> {selectedEmail.cc.join(", ")}
                  </p>
                )}

                <div className="border-t border-border/40 pt-4 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          ) : (
            /* Email Placeholder */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted">
              <Mail className="size-12 mb-3 text-zinc-700" />
              <p className="text-sm font-semibold">No Email Selected</p>
              <p className="text-xs max-w-xs mt-1">
                Select an email from the list or compose a new email to begin communicating.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
