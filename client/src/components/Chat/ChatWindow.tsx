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

  // Join socket room for typing indicators and presence
  useEffect(() => {
    socket?.emit("join_room", room._id);

    return () => {
      socket?.emit("leave_room", room._id);
    };
  }, [room._id, socket]);

  // Listen for typing indicators via Socket.io
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
      {/* Room Header */}
      <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-lg">#</span>
          <h2 className="text-white font-semibold">{room.name}</h2>
        </div>
        {room.description && (
          <p className="text-slate-400 text-xs mt-0.5 ml-5">
            {room.description}
          </p>
        )}
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading messages...</p>
        </div>
      ) : (
        <MessageList messages={messages} typingUser={typingUser} />
      )}

      {/* Input */}
      <MessageInput
        roomId={room._id}
        onSendMessage={sendMessage}
      />
    </div>
  );
}
