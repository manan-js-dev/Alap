import { useRef, useEffect, useState } from "react";

interface RoomMenuProps {
  isDirect: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onClearChat: () => void;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  action: (() => void) | null;
}

export default function RoomMenu({
  isDirect,
  isAdmin,
  onClose,
  onClearChat,
  onLeaveRoom,
  onDeleteRoom,
}: RoomMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "",
    action: null,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (!confirm.show) onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, confirm.show]);

  const showConfirm = (
    title: string,
    message: string,
    confirmText: string,
    confirmColor: string,
    action: () => void,
  ) => {
    setConfirm({
      show: true,
      title,
      message,
      confirmText,
      confirmColor,
      action,
    });
  };

  const handleConfirm = () => {
    confirm.action?.();
    setConfirm({ ...confirm, show: false, action: null });
  };

  if (confirm.show) {
    return (
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {confirm.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {confirm.message}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                setConfirm({ ...confirm, show: false, action: null })
              }
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-80"
              style={{ background: confirm.confirmColor }}
            >
              {confirm.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute right-4 top-14 z-50 w-48 rounded-xl shadow-lg overflow-hidden"
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Clear chat */}
      <button
        onClick={() =>
          showConfirm(
            "Clear Chat",
            "All messages will be permanently deleted.",
            "Clear",
            "#f59e0b",
            onClearChat,
          )
        }
        className="w-full flex items-center gap-3 px-4 py-3 text-sm transition hover:opacity-80"
        style={{
          color: "var(--text-primary)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Clear Chat
      </button>

      {/* Leave room */}
      {!isDirect && (
        <button
          onClick={() =>
            showConfirm(
              "Leave Room",
              "Are you sure you want to leave this room?",
              "Leave",
              "#f59e0b",
              onLeaveRoom,
            )
          }
          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition hover:opacity-80"
          style={{
            color: "var(--text-primary)",
            borderBottom: isAdmin ? "1px solid var(--border-color)" : "none",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
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
          Leave Room
        </button>
      )}

      {/* Delete room */}
      {!isDirect && isAdmin && (
        <button
          onClick={() =>
            showConfirm(
              "Delete Room",
              "This will permanently delete the room and all messages.",
              "Delete",
              "#ef4444",
              onDeleteRoom,
            )
          }
          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition hover:opacity-80"
          style={{ color: "#ef4444" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Room
        </button>
      )}
    </div>
  );
}
