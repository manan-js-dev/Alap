import { createContext } from "react";

interface SocketContextType {
  socket: import("socket.io-client").Socket | null;
  isConnected: boolean;
  unreadCounts: Record<string, number>;
  clearUnread: (roomId: string) => void;
  incrementUnread: (roomId: string) => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);
