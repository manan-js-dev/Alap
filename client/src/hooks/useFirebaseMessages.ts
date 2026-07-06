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

export interface FirebaseMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: number;
}

export const useFirebaseMessages = (roomId: string) => {
  const { user } = useAuth();
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
        ([id, value]: [string, any]) => ({
          id,
          content: value.content,
          senderId: value.senderId,
          senderName: value.senderName,
          createdAt: value.createdAt,
        }),
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
      createdAt: serverTimestamp(),
    });
  };

  return { messages, loading, sendMessage };
};
