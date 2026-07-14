export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
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
  isDirect?: boolean;
  directUser?: {
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
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

export interface ChatRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
    email: string;
    isOnline: boolean;
  };
  receiver: {
    _id: string;
    username: string;
    email: string;
    isOnline: boolean;
  };
  status: "pending" | "accepted" | "rejected";
  room?: Room;
  createdAt: string;
}

export interface DirectRoom {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
  receiver: {
    _id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
  status: "accepted";
  room: Room;
}
export interface SearchedUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}