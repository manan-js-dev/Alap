import { useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

interface MessageInputProps {
  roomId: string;
  onMessageSent: () => void;
}

export default function MessageInput({
  roomId,
  onMessageSent,
}: MessageInputProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing start
    socket?.emit("typing", {
      roomId,
      username: user?.username,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Emit typing stop after 1.5s
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing", {
        roomId,
        username: user?.username,
        isTyping: false,
      });
    }, 1500);
  };

  const handleSend = () => {
    if (!message.trim() || !socket) return;

    socket.emit("send_message", {
      roomId,
      content: message.trim(),
    });

    setMessage("");
    onMessageSent();

    // Stop typing indicator
    socket.emit("typing", {
      roomId,
      username: user?.username,
      isTyping: false,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-slate-700">
      <div className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-2">
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-400 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-white"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1 ml-1">Press Enter to send</p>
    </div>
  );
}
