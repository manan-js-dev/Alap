import { useState } from "react";
import api from "../../utils/api";
import Avatar from "../UI/Avatar";
import { getErrorMessage } from "../../utils/error";
import type { SearchedUser } from "../../types";

interface SearchUsersProps {
  onClose: () => void;
}

export default function SearchUsers({ onClose }: SearchUsersProps) {
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<SearchedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFoundUser(null);
    setSuccess("");
    try {
      const res = await api.post("/users/search", { email });
      setFoundUser(res.data);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!foundUser) return;
    setRequesting(true);
    setError("");
    try {
      await api.post("/requests", { receiverId: foundUser._id });
      setSuccess(`Request sent to ${foundUser.username}!`);
      setFoundUser(null);
      setEmail("");
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Find People
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

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Search by email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none border"
            style={{
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-white font-medium transition"
            style={{ background: "#0084ff" }}
          >
            {loading ? "..." : "Search"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm text-green-400"
            style={{ background: "rgba(34,197,94,0.1)" }}
          >
            {success}
          </div>
        )}

        {/* Found user */}
        {foundUser && (
          <div
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar
                username={foundUser.username}
                isOnline={foundUser.isOnline}
                size="md"
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {foundUser.username}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {foundUser.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSendRequest}
              disabled={requesting}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium transition hover:opacity-80"
              style={{ background: "#0084ff" }}
            >
              {requesting ? "Sending..." : "Connect"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
