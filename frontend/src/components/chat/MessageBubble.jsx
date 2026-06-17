import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";
import { Check, CheckCheck } from "lucide-react";

// Compress + size images for the bubble
const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

export function MessageBubble({ message }) {
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 shadow-xs ${
          isOwnMessage
            ? "rounded-br-md bg-accent text-accent-foreground"
            : "rounded-bl-md bg-surface text-foreground"
        }`}
      >
        {/* Render sender name for group/channel DMs when sent by someone else */}
        {!isOwnMessage && message.senderName ? (
          <p className="text-[10px] font-bold text-accent mb-0.5 select-none">
            {message.senderName}
          </p>
        ) : null}

        {hasImage ? (
          <img
            src={withTransform(message.imageUrl, IMAGE_TRANSFORM)}
            alt=""
            className="mb-1.5 max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl"
          />
        ) : null}
        
        {hasVideo ? <MessageVideo src={message.videoUrl} /> : null}
        
        {message.text ? (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        ) : null}

        <div className="flex items-center justify-end gap-1 mt-1">
          <p
            className={`text-[10px] tabular-nums ${
              isOwnMessage ? "text-accent-foreground/75" : "text-muted"
            }`}
          >
            {message.time}
          </p>
          
          {/* Read Receipts Checkmarks */}
          {isOwnMessage && (
            <span className="text-accent-foreground/90 leading-none">
              {message.status === "read" ? (
                <CheckCheck className="size-3 text-white dark:text-sky-300" strokeWidth={2.5} />
              ) : (
                <Check className="size-3 text-white/70" strokeWidth={2.5} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}