import { useEffect, useState } from "react";
import type { Room, Message } from "../../types";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import api from "../../utils/api";

interface ChatWindowProps {
  room: Room;
}

export default function ChatWindow({ room }: ChatWindowProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing messages when room changes
  useEffect(() => {
    fetchMessages();
    socket?.emit("join_room", room._id);

    return () => {
      socket?.emit("leave_room", room._id);
    };
  }, [room._id]);

  // Listen for new messages and typing
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user_typing", ({ username, isTyping }) => {
      if (username === user?.username) return;
      setTypingUser(isTyping ? username : null);
    });

    return () => {
      socket.off("new_message");
      socket.off("user_typing");
    };
  }, [socket]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rooms/${room._id}/messages`);
      setMessages(res.data);
    } catch {
      console.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

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
      <MessageInput roomId={room._id} onMessageSent={() => {}} />
    </div>
  );
}
