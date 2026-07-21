import { useEffect, useRef, useState } from "react";
import type { Room } from "../../types";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/AuthContext";
import { useFirebaseMessages } from "../../hooks/useFirebaseMessages";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import Avatar from "../UI/Avatar";
import GroupSettings from "./GroupSettings";
import RoomMenu from "./RoomMenu";
import { ref, remove } from "firebase/database";
import { db } from "../../utils/firebase";
import api from "../../utils/api";

interface ChatWindowProps {
  room: Room;
  onRoomLeft: () => void;
  onRoomDeleted: () => void;
}

export default function ChatWindow({
  room,
  onRoomLeft,
  onRoomDeleted,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useFirebaseMessages(room._id);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const { socket, clearUnread } = useSocket();
  const joinedRoomRef = useRef<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!socket || joinedRoomRef.current === room._id) return;

    if (joinedRoomRef.current) {
      socket.emit("leave_room", joinedRoomRef.current);
    }

    socket?.emit("join_room", room._id);
    joinedRoomRef.current = room._id;
    clearUnread(room._id);

    return () => {
      if (joinedRoomRef.current) {
        socket.emit("leave_room", joinedRoomRef.current);
        joinedRoomRef.current = null;
      }
    };
  }, [room._id, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({
      username,
      isTyping,
    }: {
      username: string;
      isTyping: boolean;
    }) => {
      if (username === user?.username) return;
      setTypingUser(isTyping ? username : null);
    };

    const handleKicked = ({ roomId }: { roomId: string }) => {
      if (roomId === room._id) {
        alert("You have been removed from this room");
        window.location.reload();
      }
    };

    socket.on("user_typing", handleTyping);
    socket.on("kicked_from_room", handleKicked);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("kicked_from_room", handleKicked);
    };
  }, [socket, user?.username, room._id]);

  useEffect(() => {
    if (room.isDirect) return;
    const checkAdmin = async () => {
      try {
        const res = await api.get(`/rooms/${room._id}`);
        const admins: string[] =
          res.data.admins?.map((a: string) => a.toString()) || [];
        setIsAdmin(admins.includes(user?.id || ""));
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [room._id, room.isDirect, user?.id]);

  const handleClearChat = async () => {
    setShowMenu(false);
    try {
      const messagesRef = ref(db, `rooms/${room._id}/messages`);
      await remove(messagesRef);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const handleLeaveRoom = async () => {
    setShowMenu(false);
    try {
      await api.delete(`/rooms/${room._id}/leave`);
      onRoomLeft();
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleDeleteRoom = async () => {
    setShowMenu(false);
    try {
      await api.delete(`/rooms/${room._id}`);
      const messagesRef = ref(db, `rooms/${room._id}/messages`);
      await remove(messagesRef);
      onRoomDeleted();
    } catch (error) {
      console.error("Failed to delete room:", error);
    }
  };

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
          {room.isDirect ? (
            <Avatar
              username={room.directUser?.username || "User"}
              avatar={room.directUser?.avatar}
              isOnline={room.directUser?.isOnline}
              size="md"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: "#0084ff" }}
            >
              #
            </div>
          )}
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {room.isDirect ? room.directUser?.username : room.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {room.isDirect
                ? room.directUser?.isOnline
                  ? "Online"
                  : "Offline"
                : `${room.members?.length || 0} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {!room.isDirect && (
            <button
              onClick={() => setShowGroupSettings(true)}
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
          )}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: showMenu ? "#0084ff" : "var(--bg-input)" }}
            title="More options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke={showMenu ? "white" : "var(--text-secondary)"}
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

      <MessageInput roomId={room._id} onSendMessage={sendMessage} />

      {showGroupSettings && !room.isDirect && (
        <GroupSettings
          room={room}
          onClose={() => setShowGroupSettings(false)}
          onRoomUpdated={() => setShowGroupSettings(false)}
        />
      )}

      {showMenu && (
        <RoomMenu
          isDirect={room.isDirect || false}
          isAdmin={isAdmin}
          onClose={() => setShowMenu(false)}
          onClearChat={handleClearChat}
          onLeaveRoom={handleLeaveRoom}
          onDeleteRoom={handleDeleteRoom}
        />
      )}
    </div>
  );
}
