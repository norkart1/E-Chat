"use client";
import { Message } from "@/lib/firebase/firestore";
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
  const time = formatTime(message.createdAt as { seconds: number } | null);

  return (
    <div className={`flex mb-1 px-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="relative" style={{ maxWidth: "72%" }}>

        {/* GIF / Sticker */}
        {isGif && message.fileURL && (
          <div className="rounded-xl overflow-hidden" style={{ maxWidth: 200 }}>
            <img
              src={message.fileURL}
              alt={message.fileName ?? "GIF"}
              className="block w-full rounded-xl"
              style={{ maxWidth: 200 }}
              loading="lazy"
            />
            <div className="flex justify-end px-1 pb-0.5 bg-transparent">
              <span className="text-[10px] text-gray-500">{time}</span>
            </div>
          </div>
        )}

        {/* Image */}
        {isImage && message.fileURL && (
          <div
            className={`rounded-xl overflow-hidden shadow-sm ${isOwn ? "rounded-tr-none" : "rounded-tl-none"}`}
          >
            <a href={message.fileURL} target="_blank" rel="noopener noreferrer">
              <Image
                src={message.fileURL}
                alt={message.fileName ?? "image"}
                width={220}
                height={220}
                className="block max-w-[220px] max-h-[220px] object-cover"
              />
            </a>
            <div className="flex justify-end px-2 pb-1">
              <span className="text-[11px] text-gray-400">{time}</span>
            </div>
          </div>
        )}

        {/* File */}
        {message.type === "file" && !isImage && (
          <div
            className={`relative rounded-lg shadow-sm overflow-hidden px-3 py-2 ${
              isOwn ? "bg-[#D9FDD3] rounded-tr-none" : "bg-white rounded-tl-none"
            }`}
          >
            {!isOwn && (
              <div className="absolute top-0 -left-2 w-2 h-2 overflow-hidden">
                <div className="w-4 h-4 bg-white translate-x-0" style={{ clipPath: "polygon(100% 0, 0% 0, 100% 100%)" }} />
              </div>
            )}
            {isOwn && (
              <div className="absolute top-0 -right-2 w-2 h-2 overflow-hidden">
                <div className="w-4 h-4 bg-[#D9FDD3] -translate-x-2" style={{ clipPath: "polygon(0 0, 0% 100%, 100% 0)" }} />
              </div>
            )}
            <a
              href={message.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#008069]"
            >
              <div className="w-9 h-9 rounded-full bg-[#008069]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#008069]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <span className="truncate max-w-[160px] text-sm">{message.fileName}</span>
            </a>
            <div className="flex justify-end mt-1">
              <span className="text-[11px] text-gray-400">{time}</span>
            </div>
          </div>
        )}

        {/* Text */}
        {message.type === "text" && (
          <div
            className={`relative rounded-lg text-sm shadow-sm ${
              isOwn ? "bg-[#D9FDD3] text-gray-900 rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none"
            }`}
          >
            {!isOwn && (
              <div className="absolute top-0 -left-2 w-2 h-2 overflow-hidden">
                <div className="w-4 h-4 bg-white" style={{ clipPath: "polygon(100% 0, 0% 0, 100% 100%)" }} />
              </div>
            )}
            {isOwn && (
              <div className="absolute top-0 -right-2 w-2 h-2 overflow-hidden">
                <div className="w-4 h-4 bg-[#D9FDD3] -translate-x-2" style={{ clipPath: "polygon(0 0, 0% 100%, 100% 0)" }} />
              </div>
            )}
            <div className="px-3 pt-2 pb-1.5">
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
              <div className="flex justify-end mt-0.5">
                <span className="text-[11px] text-gray-400 ml-3">{time}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
