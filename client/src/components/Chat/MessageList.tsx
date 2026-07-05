import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";

interface MessageListProps {
  messages: Message[];
  typingUser: string | null;
}

export default function MessageList({
  messages,
  typingUser,
}: MessageListProps) {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-slate-400 text-sm">No messages yet. Say hello!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isOwn = msg.sender._id === user?.id;
        return (
          <div
            key={msg._id}
            className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
          >
            {!isOwn && (
              <Avatar
                username={msg.sender.username}
                isOnline={msg.sender.isOnline}
                size="sm"
              />
            )}
            <div
              className={`max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col`}
            >
              {!isOwn && (
                <span className="text-xs text-slate-400 mb-1 ml-1">
                  {msg.sender.username}
                </span>
              )}
              <div
                className={`px-4 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-700 text-slate-100 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-slate-500 mt-1 mx-1">
                {formatTime(msg.createdAt)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-end gap-2">
          <div className="bg-slate-700 px-4 py-2 rounded-2xl rounded-bl-sm">
            <div className="flex gap-1 items-center h-4">
              <span className="text-xs text-slate-400">
                {typingUser} is typing
              </span>
              <div className="flex gap-1 ml-1">
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
