import { useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/AuthContext";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "../../context/ThemeContext";

interface MessageInputProps {
  roomId: string;
  onSendMessage: (content: string) => Promise<void>;
}

export default function MessageInput({
  roomId,
  onSendMessage,
}: MessageInputProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    socket?.emit("typing", {
      roomId,
      username: user?.username,
      isTyping: true,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing", {
        roomId,
        username: user?.username,
        isTyping: false,
      });
    }, 1500);
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
      socket?.emit("typing", {
        roomId,
        username: user?.username,
        isTyping: false,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 relative"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-16 left-4 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={isDark ? Theme.DARK : Theme.LIGHT}
            width={300}
            height={400}
          />
        </div>
      )}

      {/* Overlay to close picker */}
      {showEmoji && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmoji(false)}
        />
      )}

      {/* Emoji button */}
      <button
        onClick={() => setShowEmoji(!showEmoji)}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition hover:opacity-70 relative z-50"
        style={{ background: showEmoji ? "#0084ff" : "var(--bg-input)" }}
        title="Emoji"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke={showEmoji ? "white" : "var(--text-secondary)"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Input */}
      <div
        className="flex-1 flex items-center rounded-full px-4 py-2"
        style={{ background: "var(--bg-input)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition"
        style={{
          background: message.trim() ? "#0084ff" : "var(--bg-input)",
          opacity: sending ? 0.6 : 1,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill={message.trim() ? "white" : "var(--text-secondary)"}
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
}
