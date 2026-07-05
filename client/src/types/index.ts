export interface User {
  id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Room {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: { _id: string; username: string };
  lastMessage?: Message;
  createdAt: string;
}

export interface Message {
  _id: string;
  room: string;
  sender: {
    _id: string;
    username: string;
    isOnline: boolean;
  };
  content: string;
  type: "text" | "image";
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
