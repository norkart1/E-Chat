import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  createdAt: Timestamp | null;
  fileURL?: string;
  fileName?: string;
  fileType?: string;
  type: "text" | "file" | "image" | "gif" | "sticker";
}

export interface ChatUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  online: boolean;
  lastSeen: Timestamp | null;
}

export function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    callback(msgs);
  });
}

export async function sendMessage(
  chatId: string,
  message: Omit<Message, "id" | "createdAt">
) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    ...message,
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: message.text || message.fileName || "GIF",
      lastMessageAt: serverTimestamp(),
      participants: chatId.split("_"),
    },
    { merge: true }
  );
}

export function subscribeToUsers(callback: (users: ChatUser[]) => void) {
  return onSnapshot(collection(db, "users"), (snap) => {
    const users = snap.docs.map((d) => d.data() as ChatUser);
    callback(users);
  });
}

export async function getUser(uid: string): Promise<ChatUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as ChatUser) : null;
}

export function subscribeToUserChats(
  uid: string,
  callback: (
    chats: {
      chatId: string;
      lastMessage: string;
      lastMessageAt: Timestamp | null;
      otherUid: string;
    }[]
  ) => void
) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => {
      const data = d.data();
      const otherUid =
        data.participants.find((p: string) => p !== uid) ?? "";
      return {
        chatId: d.id,
        lastMessage: data.lastMessage ?? "",
        lastMessageAt: data.lastMessageAt ?? null,
        otherUid,
      };
    });
    callback(chats);
  });
}

export async function setTyping(
  chatId: string,
  uid: string,
  isTyping: boolean
) {
  await setDoc(
    doc(db, "chats", chatId, "typing", uid),
    { isTyping, uid },
    { merge: true }
  );
}

export function subscribeToTyping(
  chatId: string,
  myUid: string,
  callback: (typingUsers: string[]) => void
) {
  return onSnapshot(collection(db, "chats", chatId, "typing"), (snap) => {
    const typing = snap.docs
      .filter((d) => d.data().isTyping && d.id !== myUid)
      .map((d) => d.id);
    callback(typing);
  });
}

export async function initiateCall(
  chatId: string,
  callerId: string,
  calleeId: string,
  type: "audio" | "video"
) {
  await setDoc(doc(db, "calls", chatId), {
    callerId,
    calleeId,
    type,
    status: "ringing",
    offer: null,
    answer: null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToCall(
  chatId: string,
  callback: (data: Record<string, unknown> | null) => void
) {
  return onSnapshot(doc(db, "calls", chatId), (snap) => {
    callback(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
  });
}

export async function updateCallStatus(chatId: string, status: string) {
  try {
    await updateDoc(doc(db, "calls", chatId), { status });
  } catch {}
}

export async function saveOffer(
  chatId: string,
  offer: RTCSessionDescriptionInit
) {
  await updateDoc(doc(db, "calls", chatId), { offer: JSON.stringify(offer) });
}

export async function saveAnswer(
  chatId: string,
  answer: RTCSessionDescriptionInit
) {
  await updateDoc(doc(db, "calls", chatId), { answer: JSON.stringify(answer) });
}

export async function addIceCandidate(
  chatId: string,
  role: "caller" | "callee",
  candidate: RTCIceCandidateInit
) {
  await addDoc(collection(db, "calls", chatId, `${role}Candidates`), {
    candidate: JSON.stringify(candidate),
  });
}

export function subscribeToIceCandidates(
  chatId: string,
  role: "caller" | "callee",
  callback: (candidate: RTCIceCandidateInit) => void
) {
  return onSnapshot(
    collection(db, "calls", chatId, `${role}Candidates`),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback(JSON.parse(change.doc.data().candidate));
        }
      });
    }
  );
}
