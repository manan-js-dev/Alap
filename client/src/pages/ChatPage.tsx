import { useState } from "react";
import type { Room } from "../types";
import Sidebar from "../components/Chat/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />

      {/* Main Chat Area */}
      {selectedRoom ? (
        <ChatWindow room={selectedRoom} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl mb-4">💬</p>
            <h2 className="text-white text-xl font-semibold mb-2">
              Welcome to Alap
            </h2>
            <p className="text-slate-400 text-sm">
              Select a room to start chatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
