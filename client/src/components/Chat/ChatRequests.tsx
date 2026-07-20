import { useCallback, useEffect, useState } from "react";
import type { ChatRequest } from "../../types";
import { getErrorMessage } from "../../utils/error";
import Avatar from "../UI/Avatar";
import api from "../../utils/api";

interface ChatRequestsProps {
  onClose: () => void;
  onRequestAccepted: () => void;
}

export default function ChatRequests({
  onClose,
  onRequestAccepted,
}: ChatRequestsProps) {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const fetchRequests = useCallback(async () => {
  try {
    const res = await api.get("/requests");
    setRequests(res.data);
  } catch (error: unknown) {
    setError(getErrorMessage(error));
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchRequests();
}, [fetchRequests]);

  const handleUpdate = async (
    requestId: string,
    status: "accepted" | "rejected",
  ) => {
    try {
      await api.put(`/requests/${requestId}`, { status });
      setRequests(requests.filter((r) => r._id !== requestId));
      if (status === "accepted") onRequestAccepted();
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
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Chat Requests
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

        {error && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No pending requests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    username={request.sender.username}
                    isOnline={request.sender.isOnline}
                    size="md"
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {request.sender.username}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {request.sender.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(request._id, "accepted")}
                    className="px-3 py-1.5 rounded-lg text-xs text-white font-medium transition hover:opacity-80"
                    style={{ background: "#0084ff" }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdate(request._id, "rejected")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
