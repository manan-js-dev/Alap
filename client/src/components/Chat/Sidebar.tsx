import { useEffect, useState, useCallback } from "react";
import type { Room } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getErrorMessage } from "../../utils/error";
import Avatar from "../UI/Avatar";
import SearchUsers from "./SearchUsers";
import ChatRequests from "./ChatRequests";
import DirectMessageList from "./DirectMessageList";
import EditProfile from "./EditProfile";
import { useSocket } from "../../hooks/useSocket";
import api from "../../utils/api";

interface SidebarProps {
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  refreshTrigger: number;
}

export default function Sidebar({
  selectedRoom,
  onSelectRoom,
  refreshTrigger,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { socket, unreadCounts, incrementUnread } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshDMs, setRefreshDMs] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data.filter((r: Room) => !r.isDirect));
    } catch (error: unknown) {
      console.error(getErrorMessage(error));
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await api.get("/requests");
      setPendingCount(res.data.length);
    } catch (error: unknown) {
      console.error(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchPendingCount();
  }, [fetchRooms, fetchPendingCount, refreshTrigger]);

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = () => {
      setPendingCount((prev) => prev + 1);
    };

    const handleRequestAccepted = () => {
      setRefreshDMs((prev) => prev + 1);
    };

    const handleNewMessage = ({ roomId }: { roomId: string }) => {
      if (roomId !== selectedRoom?._id) {
        incrementUnread(roomId);
      }
    };

    socket.on("new_request", handleNewRequest);
    socket.on("request_accepted", handleRequestAccepted);
    socket.on("new_message_notification", handleNewMessage);

    return () => {
      socket.off("new_request", handleNewRequest);
      socket.off("request_accepted", handleRequestAccepted);
      socket.off("new_message_notification", handleNewMessage);
    };
  }, [socket, selectedRoom?._id, incrementUnread]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/rooms", newRoom);
      setRooms([...rooms, res.data]);
      setNewRoom({ name: "", description: "" });
      setShowCreate(false);
      onSelectRoom(res.data);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="w-80 flex flex-col h-full border-r"
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex flex-col gap-2"
        style={{ background: "var(--bg-secondary)" }}
      >
        {/* User info row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <Avatar
                username={user?.username || "U"}
                isOnline={true}
                size="md"
              />
            )}
            <div>
              <p
                className="text-sm font-semibold text-left"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.username}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Online
              </p>
            </div>
          </button>
        </div>

        {/* Action buttons row */}
        <div
          className="flex items-center justify-between px-1 py-1 rounded-lg"
          style={{ background: "var(--bg-input)" }}
        >
          {[
            {
              icon: (
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              ),
              label: "Add",
              onClick: () => setShowSearch(true),
              badge: null,
            },
            {
              icon: (
                <div className="relative">
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {pendingCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white flex items-center justify-center"
                      style={{ fontSize: "8px" }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </div>
              ),
              label: "Requests",
              onClick: () => setShowRequests(true),
              badge: null,
            },
            {
              icon: isDark ? (
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 110 10A5 5 0 0112 7z"
                  />
                </svg>
              ) : (
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ),
              label: isDark ? "Light" : "Dark",
              onClick: toggleTheme,
              badge: null,
            },
            {
              icon: (
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              ),
              label: "Room",
              onClick: () => setShowCreate(!showCreate),
              badge: null,
            },
            {
              icon: (
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              ),
              label: "Logout",
              onClick: () => setShowLogoutConfirm(true),
              badge: null,
            },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg hover:opacity-70 transition"
            >
              {btn.icon}
              <span style={{ color: "var(--text-secondary)", fontSize: "9px" }}>
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ background: "var(--bg-sidebar)" }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "var(--bg-input)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 flex-shrink-0"
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
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full focus:outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Create Room Form */}
      {showCreate && (
        <div
          className="mx-3 mb-2 p-3 rounded-lg border"
          style={{
            background: "var(--bg-input)",
            borderColor: "var(--border-color)",
          }}
        >
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            New Room
          </p>
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <form onSubmit={handleCreateRoom} className="space-y-2">
            <input
              type="text"
              placeholder="Room name"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              required
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newRoom.description}
              onChange={(e) =>
                setNewRoom({ ...newRoom, description: e.target.value })
              }
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg transition"
              >
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 text-sm py-2 rounded-lg transition"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms + DMs List */}
      <div className="flex-1 overflow-y-auto">
        <DirectMessageList
          selectedRoomId={selectedRoom?._id || null}
          onSelectRoom={onSelectRoom}
          refreshTrigger={refreshDMs}
        />

        <p
          className="text-xs font-semibold uppercase tracking-wide px-4 py-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Rooms
        </p>

        {filteredRooms.length === 0 ? (
          <div className="text-center mt-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {search ? "No rooms found" : "No rooms yet. Create one!"}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <button
              key={room._id}
              onClick={() => onSelectRoom(room)}
              className="w-full flex items-center gap-3 px-4 py-3 transition"
              style={{
                background:
                  selectedRoom?._id === room._id
                    ? "var(--active-color)"
                    : "transparent",
                borderBottom: "1px solid var(--border-color)",
              }}
              onMouseEnter={(e) => {
                if (selectedRoom?._id !== room._id)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--hover-color)";
              }}
              onMouseLeave={(e) => {
                if (selectedRoom?._id !== room._id)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                style={{ background: "#0084ff" }}
              >
                #
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {room.name}
                  </p>
                  {unreadCounts[room._id] > 0 && (
                    <span className="ml-2 min-w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center px-1">
                      {unreadCounts[room._id]}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {room.description || "No description"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modals */}
      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
      {showRequests && (
        <ChatRequests
          onClose={() => setShowRequests(false)}
          onRequestAccepted={() => {
            fetchPendingCount();
            fetchRooms();
          }}
        />
      )}
      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} />
      )}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-80 rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="text-center mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Sign Out
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to sign out?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-80"
                style={{ background: "#ef4444" }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
