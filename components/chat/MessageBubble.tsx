"use client";
import { Message } from "@/lib/firebase/firestore";
import Avatar from "../ui/Avatar";
import Image from "next/image";

interface Props {
  message: Message;
  isOwn: boolean;
}

function formatTime(ts: { seconds: number } | null) {
  if (!ts) return "";
  return new Date(ts.seconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message, isOwn }: Props) {
  const isImage = message.type === "image" || message.fileType?.startsWith("image/");
  const isGif = message.type === "gif" || message.type === "sticker";

  return (
    <div className={`flex gap-2 items-end mb-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <Avatar src={message.senderPhoto} name={message.senderName} size={32} />
      )}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isOwn && (
          <span className="text-xs text-gray-500 ml-1">{message.senderName}</span>
        )}
        <div
          className={`rounded-2xl text-sm shadow-sm overflow-hidden ${
            isGif
              ? "bg-transparent shadow-none p-0"
              : isOwn
              ? "bg-indigo-600 text-white rounded-br-sm px-4 py-2"
              : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 px-4 py-2"
          }`}
        >
          {isGif && message.fileURL && (
            <div className="rounded-2xl overflow-hidden max-w-[200px]">
              <img
                src={message.fileURL}
                alt={message.fileName ?? "GIF"}
                className="w-full rounded-2xl"
                loading="lazy"
              />
            </div>
          )}
          {message.type === "file" && !isImage && (
            <a
              href={message.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 underline ${isOwn ? "text-indigo-100" : "text-indigo-600"}`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="truncate max-w-[200px]">{message.fileName}</span>
            </a>
          )}
          {isImage && message.fileURL && (
            <a href={message.fileURL} target="_blank" rel="noopener noreferrer">
              <Image
                src={message.fileURL}
                alt={message.fileName ?? "image"}
                width={200}
                height={200}
                className="rounded-lg max-w-[200px] max-h-[200px] object-cover"
              />
            </a>
          )}
          {message.type === "text" && (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )}
        </div>
        <span className={`text-xs text-gray-400 ${isOwn ? "text-right" : "text-left"} ml-1`}>
          {formatTime(message.createdAt as { seconds: number } | null)}
        </span>
      </div>
    </div>
  );
}
