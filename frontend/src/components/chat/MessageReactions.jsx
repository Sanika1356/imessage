import { useState } from "react";
import { Smile } from "lucide-react";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageReactions({ message, onAddReaction, currentUserId }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emoji) => {
    onAddReaction(message._id, emoji);
    setShowPicker(false);
  };

  const reactionCounts = message.reactions?.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});

  const userReaction = message.reactions?.find(
    (r) => String(r.userId) === String(currentUserId)
  )?.emoji;

  return (
    <div className="relative inline-block">
      {/* Existing reactions */}
      {reactionCounts && Object.keys(reactionCounts).length > 0 && (
        <div className="flex gap-1 mb-1">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={`rounded-full px-2 py-0.5 text-xs flex items-center gap-1 ${
                userReaction === emoji
                  ? "bg-green-100 dark:bg-green-900/30 border border-green-600"
                  : "bg-neutral-100 dark:bg-neutral-700"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-neutral-600 dark:text-neutral-400">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="rounded-full p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 z-50 rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 p-2">
              <div className="flex gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
