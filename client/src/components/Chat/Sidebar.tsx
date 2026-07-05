import { useEffect, useState } from "react";
import type { Room } from "../../types";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";
import api from "../../utils/api";

interface SidebarProps {
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
}

export default function Sidebar({ selectedRoom, onSelectRoom }: SidebarProps) {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch {
      console.error("Failed to fetch rooms");
    }
  };

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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-indigo-400">💬 Alap</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center text-white transition"
            title="Create room"
          >
            +
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2">
          <Avatar username={user?.username || "U"} isOnline={true} size="sm" />
          <span className="text-sm text-slate-300 font-medium">
            {user?.username}
          </span>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreate && (
        <div className="p-4 border-b border-slate-700 bg-slate-750">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
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
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newRoom.description}
              onChange={(e) =>
                setNewRoom({ ...newRoom, description: e.target.value })
              }
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded-lg transition"
              >
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs text-slate-500 uppercase tracking-wide px-2 py-2">
          Rooms
        </p>
        {rooms.length === 0 ? (
          <p className="text-slate-500 text-sm text-center mt-4">
            No rooms yet. Create one!
          </p>
        ) : (
          rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => onSelectRoom(room)}
              className={`w-full text-left px-3 py-3 rounded-lg mb-1 transition ${
                selectedRoom?._id === room._id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">#</span>
                <div>
                  <p className="text-sm font-medium">{room.name}</p>
                  {room.description && (
                    <p className="text-xs text-slate-400 truncate">
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full text-slate-400 hover:text-red-400 text-sm py-2 rounded-lg hover:bg-slate-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
