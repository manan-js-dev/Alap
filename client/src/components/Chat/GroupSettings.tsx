import { useState, useEffect, useCallback } from "react";
import type { Room, RoomMember, SearchedUser } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/error";
import Avatar from "../UI/Avatar";
import api from "../../utils/api";

interface GroupSettingsProps {
  room: Room;
  onClose: () => void;
  onRoomUpdated: (room: Room) => void;
}

export default function GroupSettings({
  room,
  onClose,
  onRoomUpdated,
}: GroupSettingsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: room.name,
    description: room.description || "",
  });
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<SearchedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = admins.includes(user?.id || "");

  const fetchRoomDetails = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${room._id}`);
      setMembers(res.data.members as RoomMember[]);
      setAdmins(res.data.admins?.map((a: string) => a.toString()) || []);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  }, [room._id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoomDetails();
  }, [fetchRoomDetails]);

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.put(`/rooms/${room._id}`, form);
      onRoomUpdated(res.data);
      setSuccess("Room updated successfully!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFoundUser(null);
    try {
      const res = await api.post("/users/search", { email: searchEmail });
      const alreadyMember = members.some((m) => m._id === res.data._id);
      if (alreadyMember) {
        setError("User is already a member");
      } else {
        setFoundUser(res.data);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!foundUser) return;
    setLoading(true);
    setError("");
    try {
      await api.post(`/rooms/${room._id}/members`, { userId: foundUser._id });
      setFoundUser(null);
      setSearchEmail("");
      setSuccess(`${foundUser.username} added successfully!`);
      setTimeout(() => setSuccess(""), 2000);
      fetchRoomDetails();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/rooms/${room._id}/members/${userId}`);
      setMembers(members.filter((m) => m._id !== userId));
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await api.post(`/rooms/${room._id}/admins`, { userId });
      setAdmins([...admins, userId]);
      setSuccess("User promoted to admin!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Group Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition"
            style={{ background: "var(--bg-input)" }}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          {(["info", "members"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-sm font-medium transition capitalize"
              style={{
                color: activeTab === tab ? "#0084ff" : "var(--text-secondary)",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #0084ff"
                    : "2px solid transparent",
              }}
            >
              {tab === "info" ? "Room Info" : `Members (${members.length})`}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Error / Success */}
          {error && (
            <div
              className="mb-4 px-4 py-2 rounded-lg text-sm text-red-400"
              style={{ background: "rgba(239,68,68,0.1)" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 px-4 py-2 rounded-lg text-sm text-green-400"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              {success}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === "info" && (
            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Room Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                    opacity: isAdmin ? 1 : 0.6,
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  disabled={!isAdmin}
                  rows={3}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border resize-none"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                    opacity: isAdmin ? 1 : 0.6,
                  }}
                />
              </div>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition hover:opacity-80"
                  style={{ background: "#0084ff" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}

              {!isAdmin && (
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Only admins can edit room info
                </p>
              )}
            </form>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-4">
              {/* Add member - admin only */}
              {isAdmin && (
                <div>
                  <p
                    className="text-xs font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Add Member
                  </p>
                  <form onSubmit={handleSearchUser} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      placeholder="Search by email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      required
                      className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none border"
                      style={{
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-2 rounded-lg text-sm text-white transition hover:opacity-80"
                      style={{ background: "#0084ff" }}
                    >
                      {loading ? "..." : "Find"}
                    </button>
                  </form>

                  {foundUser && (
                    <div
                      className="flex items-center justify-between p-3 rounded-lg border mb-3"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          username={foundUser.username}
                          avatar={foundUser.avatar}
                          size="sm"
                        />
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {foundUser.username}
                        </p>
                      </div>
                      <button
                        onClick={handleAddMember}
                        className="px-3 py-1.5 rounded-lg text-xs text-white transition hover:opacity-80"
                        style={{ background: "#0084ff" }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Members list */}
              <div className="space-y-2">
                {members.map((member) => {
                  const memberIsAdmin = admins.includes(member._id);
                  const isCreator = room.createdBy._id === member._id;
                  const isCurrentUser = member._id === user?.id;

                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          username={member.username}
                          avatar={member.avatar}
                          isOnline={member.isOnline}
                          size="sm"
                        />
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {member.username}
                            {isCurrentUser && (
                              <span
                                className="ml-1 text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                (you)
                              </span>
                            )}
                          </p>
                          <p
                            className="text-xs"
                            style={{
                              color: memberIsAdmin
                                ? "#0084ff"
                                : "var(--text-secondary)",
                            }}
                          >
                            {isCreator
                              ? "👑 Creator"
                              : memberIsAdmin
                                ? "⭐ Admin"
                                : "Member"}
                          </p>
                        </div>
                      </div>

                      {/* Admin actions */}
                      {isAdmin && !isCurrentUser && !isCreator && (
                        <div className="flex gap-1">
                          {!memberIsAdmin && (
                            <button
                              onClick={() => handleMakeAdmin(member._id)}
                              className="px-2 py-1 rounded text-xs transition hover:opacity-80"
                              style={{
                                background: "var(--bg-input)",
                                color: "var(--text-secondary)",
                              }}
                              title="Make admin"
                            >
                              ⭐
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="px-2 py-1 rounded text-xs text-red-400 transition hover:opacity-80"
                            style={{ background: "rgba(239,68,68,0.1)" }}
                            title="Remove member"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
