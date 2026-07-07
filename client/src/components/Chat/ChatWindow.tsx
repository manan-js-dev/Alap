import { useEffect, useState } from "react";
import type { Room } from "../../types";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useFirebaseMessages } from "../../hooks/useFirebaseMessages";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatWindowProps {
  room: Room;
}

export default function ChatWindow({ room }: ChatWindowProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useFirebaseMessages(room._id);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    socket?.emit("join_room", room._id);
    return () => {
      socket?.emit("leave_room", room._id);
    };
  }, [room._id, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("user_typing", ({ username, isTyping }) => {
      if (username === user?.username) return;
      setTypingUser(isTyping ? username : null);
    });
    return () => {
      socket.off("user_typing");
    };
  }, [socket, user]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: "#0084ff" }}
          >
            #
          </div>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {room.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {room.members?.length || 0} members
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--bg-input)" }}
            title="Search messages"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--text-secondary)"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Members */}
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--bg-input)" }}
            title="Members"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--text-secondary)"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* More options */}
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--bg-input)" }}
            title="More options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--text-secondary)"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div
          className="flex-1 flex items-center justify-center"
          style={{ background: "var(--bg-chat)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Loading messages...
            </p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} typingUser={typingUser} />
      )}

      {/* Input */}
      <MessageInput roomId={room._id} onSendMessage={sendMessage} />
    </div>
  );
}
