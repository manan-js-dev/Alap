import { useEffect, useState } from "react";
import {
  ref,
  onValue,
  push,
  serverTimestamp,
  query,
  limitToLast,
} from "firebase/database";
import { db } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export interface FirebaseMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: number;
}

interface FirebaseMessageData {
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: number;
}

export const useFirebaseMessages = (roomId: string) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    // Listen to last 50 messages in real time
    const messagesRef = query(
      ref(db, `rooms/${roomId}/messages`),
      limitToLast(50),
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const parsed: FirebaseMessage[] = Object.entries(data).map(
        ([id, value]) => {
          const msg = value as FirebaseMessageData;
          return {
            id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderAvatar: msg.senderAvatar || "",
            createdAt: msg.createdAt,
          };
        },
      );

      // Sort by time
      parsed.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(parsed);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    await push(messagesRef, {
      content: content.trim(),
      senderId: user.id,
      senderName: user.username,
      senderAvatar: user.avatar || "",
      createdAt: serverTimestamp(),
    });

    console.log("Emitting notify_message", { roomId, senderId: user.id });
    socket?.emit("notify_message", { roomId, senderId: user.id });
  };

  return { messages, loading, sendMessage };
};
