import { Avatar, Button } from "@heroui/react";
import { ChevronLeftIcon, Volume2Icon, VolumeXIcon, XIcon, Copy } from "lucide-react";
import { AppLogo } from "../AppLogo";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

import { ThemePresetPicker } from "../ThemePresetPicker";
import { ThemeToggle } from "../ThemeToggle";
import { WallpaperPicker } from "../WallpaperPicker";

import { useChatStore } from "../../store/useChatStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import toast from "react-hot-toast";

export function ChatHeader() {
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSoundEnabled = useChatStore((state) => state.setSoundEnabled);

  const { activeConversation, isLargeScreen } = useSelectedConversation();

  const handleCopyInviteCode = () => {
    if (!activeConversation?.inviteCode) return;
    navigator.clipboard.writeText(activeConversation.inviteCode);
    toast.success("Invite code copied to clipboard!");
  };

  const getSubtitleText = () => {
    if (!activeConversation) return "";
    
    if (activeConversation.type === "group") {
      return activeConversation.peer.subtitle || `${activeConversation.peer.membersCount} members`;
    }
    if (activeConversation.type === "channel") {
      return activeConversation.peer.subtitle || `${activeConversation.peer.subscribersCount} subscribers`;
    }
    
    // For direct chats, show phone number or bio alongside status
    const parts = [];
    if (activeConversation.peer.isOnline) {
      parts.push("Online");
    } else {
      parts.push("Offline");
      if (activeConversation.peer.lastSeen) {
        const time = new Date(activeConversation.peer.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        parts.push(`Last seen ${time}`);
      }
    }
    if (activeConversation.peer.phoneNumber) {
      parts.push(activeConversation.peer.phoneNumber);
    }
    return parts.join(" · ");
  };

  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2 bg-background/80 backdrop-blur-md">
      {activeConversation && !isLargeScreen ? (
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          onPress={() => setActiveConversationId(null)}
        >
          <ChevronLeftIcon className="size-6" strokeWidth={2.25} />
        </Button>
      ) : null}

      {activeConversation ? (
        <>
          <AvatarWithOnlineIndicator isOnline={activeConversation.peer.isOnline ?? false}>
            <Avatar className="size-9 shrink-0">
              <Avatar.Image
                alt={activeConversation.peer.name}
                src={activeConversation.peer.avatarUrl}
              />
              <Avatar.Fallback className="text-sm font-medium">
                {activeConversation.peer.initials}
              </Avatar.Fallback>
            </Avatar>
          </AvatarWithOnlineIndicator>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <p className="truncate text-[15px] font-semibold leading-tight text-white">
                {activeConversation.peer.name}
              </p>
              {activeConversation.inviteCode && (
                <button
                  onClick={handleCopyInviteCode}
                  title="Copy Invite Code"
                  className="p-1 rounded-md hover:bg-white/5 text-muted hover:text-white transition-colors"
                >
                  <Copy className="size-3" />
                </button>
              )}
            </div>
            <p className="truncate text-xs text-muted leading-normal">
              {getSubtitleText()}
            </p>
            {activeConversation.peer.bio && (
              <p className="truncate text-[10px] text-muted/70 italic mt-0.5">
                {activeConversation.peer.bio}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center gap-2.5 sm:text-left">
          <AppLogo size={36} className="rounded-[9px]" />
          <div className="flex-1 text-center sm:text-left">
            <p className="truncate text-[13px] font-medium text-muted">Select a conversation</p>
          </div>
        </div>
      )}

      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
        <div className="hidden min-[400px]:contents">
          <WallpaperPicker />
          <ThemePresetPicker />
        </div>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          className="shrink-0"
          aria-pressed={isSoundEnabled}
          onPress={() => setSoundEnabled(!isSoundEnabled)}
        >
          {isSoundEnabled ? (
            <Volume2Icon className="size-5.5" strokeWidth={2} aria-hidden />
          ) : (
            <VolumeXIcon className="size-5.5" strokeWidth={2} aria-hidden />
          )}
        </Button>

        {activeConversation ? (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="shrink-0"
            aria-label="Close chat"
            onPress={() => setActiveConversationId(null)}
          >
            <XIcon className="size-5.5" strokeWidth={2} aria-hidden />
          </Button>
        ) : null}
      </div>
    </header>
  );
}