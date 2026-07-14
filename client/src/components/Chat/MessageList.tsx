import { useEffect, useRef } from "react";
import type { FirebaseMessage } from "../../hooks/useFirebaseMessages";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";

interface MessageListProps {
  messages: FirebaseMessage[];
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: FirebaseMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "var(--bg-chat)" }}
      >
        <div className="text-center">
          <p className="text-5xl mb-3">💬</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No messages yet. Say hello!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-2"
      style={{ background: "var(--bg-chat)" }}
    >
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Date divider */}
          <div className="flex items-center justify-center my-4">
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{
                background: "var(--bg-bubble-received)",
                color: "var(--text-secondary)",
                boxShadow: "var(--shadow)",
              }}
            >
              {group.date}
            </span>
          </div>

          {group.messages.map((msg, index) => {
            const isOwn = msg.senderId === user?.id;
            const prevMsg = group.messages[index - 1];
            const showAvatar =
              !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);
            const showName =
              !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar placeholder for alignment */}
                <div className="w-8 flex-shrink-0">
                  {showAvatar && !isOwn && (
                    <Avatar
                      username={msg.senderName}
                      avatar={msg.senderAvatar}
                      size="sm"
                    />
                  )}
                </div>

                <div
                  className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  {showName && (
                    <span
                      className="text-xs mb-1 ml-1 font-medium"
                      style={{ color: "#0084ff" }}
                    >
                      {msg.senderName}
                    </span>
                  )}

                  <div
                    className="px-3 py-2 rounded-2xl text-sm relative"
                    style={{
                      background: isOwn
                        ? "var(--bg-bubble-sent)"
                        : "var(--bg-bubble-received)",
                      color: isOwn
                        ? "var(--text-bubble-sent)"
                        : "var(--text-bubble-received)",
                      borderRadius: isOwn
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    {msg.content}
                    <span
                      className="text-xs ml-2 opacity-70"
                      style={{ fontSize: "10px" }}
                    >
                      {msg.createdAt ? formatTime(msg.createdAt) : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-end gap-2 mb-2">
          <div className="w-8 flex-shrink-0" />
          <div
            className="px-4 py-3 rounded-2xl"
            style={{
              background: "var(--bg-bubble-received)",
              borderRadius: "18px 18px 18px 4px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div className="flex gap-1 items-center">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "var(--text-secondary)",
                  animationDelay: "0ms",
                }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "var(--text-secondary)",
                  animationDelay: "150ms",
                }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "var(--text-secondary)",
                  animationDelay: "300ms",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
