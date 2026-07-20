import { useState } from "react";
import type { Room } from "../types";
import Sidebar from "../components/Chat/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-chat)" }}
    >
      <Sidebar selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />

      {selectedRoom ? (
        <ChatWindow room={selectedRoom} />
      ) : (
        <div
          className="flex-1 flex items-center justify-center"
          style={{ background: "var(--bg-chat)" }}
        >
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "var(--bg-secondary)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#0084ff"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome to Alap
            </h2>
            <p
              className="text-sm mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Select a room from the sidebar to start chatting
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              or create a new room using the + button
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
