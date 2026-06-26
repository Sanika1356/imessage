import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";
import { Check, CheckCheck, Play, Pause } from "lucide-react";
import { useState } from "react";

// Compress + size images for the bubble
const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

export function MessageBubble({ message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);
  const hasAudio = Boolean(message.audioUrl);

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
        
        {hasAudio ? (
          <div className="flex items-center gap-2 my-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-shrink-0 p-1.5 rounded-full bg-accent/20 hover:bg-accent/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="size-4 text-accent" strokeWidth={2} />
              ) : (
                <Play className="size-4 text-accent" strokeWidth={2} />
              )}
            </button>
            <audio
              src={message.audioUrl}
              controls
              className="flex-1 h-6"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        ) : null}
        
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

        {/* Message Reactions */}
        {message.reactions && message.reactions.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-foreground/10">
            {message.reactions.map((reaction, idx) => (
              <span key={idx} className="text-xs px-1.5 py-0.5 bg-foreground/5 rounded-full">
                {reaction.emoji}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
