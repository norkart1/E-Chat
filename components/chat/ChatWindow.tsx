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
  ChatUser,
  Message,
} from "@/lib/firebase/firestore";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import CallModal from "./CallModal";
import Avatar from "../ui/Avatar";

interface Props {
  currentUser: User;
  otherUser: ChatUser;
  chatId: string;
  onBack?: () => void;
}

export default function ChatWindow({ currentUser, otherUser, chatId, onBack }: Props) {
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
      if (!data || data.status === "ended") setInCall(false);
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

  const handleSendGif = useCallback(
    async (url: string, title: string, gifType: "gif" | "sticker") => {
      await sendMessage(chatId, {
        text: "",
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? "User",
        senderPhoto: currentUser.photoURL ?? "",
        fileURL: url,
        fileName: title,
        type: gifType,
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-[#008069] shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition mr-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Avatar src={otherUser.photoURL} name={otherUser.displayName} size={40} online={otherUser.online} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-[15px] truncate">{otherUser.displayName}</p>
          <p className="text-xs text-white/70">{otherUser.online ? "online" : "last seen recently"}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => startCall("video")}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Video call"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => startCall("audio")}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Voice call"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition" title="More">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto py-3"
        style={{ background: "#EFEAE2 url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E\")" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="bg-[#FFF9E6] border border-[#E8D5A3] rounded-lg px-4 py-2 text-center max-w-xs">
              <p className="text-xs text-[#8B7355]">🔒 Messages are end-to-end secured</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={m.senderId === currentUser.uid} />
          ))}
        </div>

        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2 px-3 mt-1">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm px-3 py-2 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        chatId={chatId}
        onSend={handleSend}
        onSendFile={handleSendFile}
        onSendGif={handleSendGif}
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
