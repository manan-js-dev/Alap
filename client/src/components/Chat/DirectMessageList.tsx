import { useEffect, useState, useCallback } from "react";
import type { DirectRoom, Room } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/error";
import Avatar from "../UI/Avatar";
import api from "../../utils/api";

interface DirectMessageListProps {
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
}

export default function DirectMessageList({
  selectedRoomId,
  onSelectRoom,
}: DirectMessageListProps) {
  const { user } = useAuth();
  const [directRooms, setDirectRooms] = useState<DirectRoom[]>([]);
  const [error, setError] = useState("");

  const fetchDirectRooms = useCallback(async () => {
    try {
      const res = await api.get("/requests/direct-rooms");
      setDirectRooms(res.data);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDirectRooms();
  }, [fetchDirectRooms]);

  const getOtherUser = (room: DirectRoom) => {
    return room.sender._id === user?.id ? room.receiver : room.sender;
  };

  if (error) return null;

  if (directRooms.length === 0) return null;

  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wide px-4 py-2"
        style={{ color: "var(--text-secondary)" }}
      >
        Direct Messages
      </p>
      {directRooms.map((dm) => {
        const otherUser = getOtherUser(dm);
        return (
          <button
            key={dm._id}
            onClick={() =>
              onSelectRoom({
                ...dm.room,
                directUser: {
                  username: otherUser.username,
                  isOnline: otherUser.isOnline,
                },
              })
            }
            className="w-full flex items-center gap-3 px-4 py-3 transition"
            style={{
              background:
                selectedRoomId === dm.room._id
                  ? "var(--active-color)"
                  : "transparent",
              borderBottom: "1px solid var(--border-color)",
            }}
            onMouseEnter={(e) => {
              if (selectedRoomId !== dm.room._id)
                (e.currentTarget as HTMLElement).style.background =
                  "var(--hover-color)";
            }}
            onMouseLeave={(e) => {
              if (selectedRoomId !== dm.room._id)
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
            }}
          >
            <Avatar
              username={otherUser.username}
              isOnline={otherUser.isOnline}
              size="md"
            />
            <div className="flex-1 text-left min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {otherUser.username}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {otherUser.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
