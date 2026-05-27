"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { User } from "firebase/auth";
import {
  subscribeToMessages,
  sendMessage,
  setTyping,
  subscribeToTyping,
  initiateCall,
  subscribeToCall,
  updateCallStatus,
  getChatId,
  ChatUser,
  Message,
} from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/firebase/storage";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import CallModal from "./CallModal";
import Avatar from "../ui/Avatar";

interface Props {
  currentUser: User;
  otherUser: ChatUser;
  chatId: string;
}

export default function ChatWindow({ currentUser, otherUser, chatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [callData, setCallData] = useState<Record<string, unknown> | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(chatId, setMessages);
    return unsub;
  }, [chatId]);

  useEffect(() => {
    const unsub = subscribeToTyping(chatId, currentUser.uid, setTypingUsers);
    return unsub;
  }, [chatId, currentUser.uid]);

  useEffect(() => {
    const unsub = subscribeToCall(chatId, (data) => {
      setCallData(data);
      if (data && data.status === "ringing" && data.calleeId === currentUser.uid) {
        setCallType(data.type as "audio" | "video");
        setInCall(true);
      }
      if (!data || data.status === "ended") {
        setInCall(false);
      }
    });
    return unsub;
  }, [chatId, currentUser.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(chatId, {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? "User",
        senderPhoto: currentUser.photoURL ?? "",
        type: "text",
      });
    },
    [chatId, currentUser]
  );

  const handleSendFile = useCallback(
    async (url: string, name: string, type: string) => {
      const isImage = type.startsWith("image/");
      await sendMessage(chatId, {
        text: "",
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? "User",
        senderPhoto: currentUser.photoURL ?? "",
        fileURL: url,
        fileName: name,
        fileType: type,
        type: isImage ? "image" : "file",
      });
    },
    [chatId, currentUser]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      setTyping(chatId, currentUser.uid, isTyping);
    },
    [chatId, currentUser.uid]
  );

  async function startCall(type: "audio" | "video") {
    setCallType(type);
    await initiateCall(chatId, currentUser.uid, otherUser.uid, type);
    setInCall(true);
  }

  function handleEndCall() {
    setInCall(false);
    setCallData(null);
  }

  const isCaller = callData?.callerId === currentUser.uid;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <Avatar src={otherUser.photoURL} name={otherUser.displayName} size={40} online={otherUser.online} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{otherUser.displayName}</p>
          <p className="text-xs text-gray-400">{otherUser.online ? "Online" : "Offline"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startCall("audio")}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition"
            title="Voice call"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button
            onClick={() => startCall("video")}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition"
            title="Video call"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <Avatar src={otherUser.photoURL} name={otherUser.displayName} size={64} />
            <p className="text-sm">Start a conversation with <span className="font-medium text-gray-600">{otherUser.displayName}</span></p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isOwn={m.senderId === currentUser.uid} />
        ))}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-400 text-xs pl-1 mb-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </span>
            <span>{otherUser.displayName} is typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        chatId={chatId}
        onSend={handleSend}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
      />

      {inCall && callData && (
        <CallModal
          chatId={chatId}
          callType={callType}
          isCaller={!!isCaller}
          remoteUser={{ displayName: otherUser.displayName, photoURL: otherUser.photoURL }}
          callStatus={callData.status as string}
          remoteOffer={callData.offer as string | undefined}
          remoteAnswer={callData.answer as string | undefined}
          onEnd={handleEndCall}
        />
      )}
    </div>
  );
}
