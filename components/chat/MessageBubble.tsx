"use client";
import { useState, useRef } from "react";
import { Message } from "@/lib/firebase/firestore";
import Image from "next/image";

interface Props {
  message: Message;
  isOwn: boolean;
  otherUserLastReadMs: number;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

function formatTime(ts: { seconds: number } | null) {
  if (!ts) return "";
  return new Date(ts.seconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Ticks({ read }: { read: boolean }) {
  return (
    <span className="inline-flex items-center ml-1" style={{ verticalAlign: "middle" }}>
      {read ? (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 6L4.5 9.5L10 4" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L9.5 9.5L15 4" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 6L4.5 9.5L10 4" stroke="#8B9CAB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L9.5 9.5L15 4" stroke="#8B9CAB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  );
}

export default function MessageBubble({ message, isOwn, otherUserLastReadMs, onDelete, onEdit }: Props) {
  const isImage = message.type === "image" || message.fileType?.startsWith("image/");
  const isGif = message.type === "gif" || message.type === "sticker";
  const time = formatTime(message.createdAt as { seconds: number } | null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const msgTimeMs = message.createdAt ? (message.createdAt as { seconds: number }).seconds * 1000 : 0;
  const isRead = isOwn && otherUserLastReadMs > 0 && msgTimeMs > 0 && otherUserLastReadMs >= msgTimeMs;

  function openMenu() {
    if (isOwn && !message.deleted) setMenuOpen(true);
  }

  function startLongPress() {
    longPressTimer.current = setTimeout(openMenu, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  async function handleDelete() {
    setMenuOpen(false);
    onDelete(message.id);
  }

  function handleEditStart() {
    setMenuOpen(false);
    setEditText(message.text);
    setEditing(true);
  }

  async function handleEditSave() {
    if (editText.trim() && editText.trim() !== message.text) {
      onEdit(message.id, editText.trim());
    }
    setEditing(false);
  }

  const bubbleHandlers = isOwn && !message.deleted ? {
    onTouchStart: startLongPress,
    onTouchEnd: cancelLongPress,
    onTouchMove: cancelLongPress,
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); openMenu(); },
  } : {};

  if (message.deleted) {
    return (
      <div className={`flex mb-1 px-2 ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`italic text-[13px] text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 ${isOwn ? "bg-[#D9FDD3]/60" : "bg-white/60"}`}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex mb-1 px-2 ${isOwn ? "justify-end" : "justify-start"}`} {...bubbleHandlers}>
        <div className="relative" style={{ maxWidth: "72%" }}>

          {/* GIF / Sticker */}
          {isGif && message.fileURL && (
            <div className="rounded-xl overflow-hidden" style={{ maxWidth: 200 }}>
              <img src={message.fileURL} alt={message.fileName ?? "GIF"} className="block w-full rounded-xl" style={{ maxWidth: 200 }} loading="lazy" />
              <div className="flex justify-end items-center px-1 pb-0.5">
                <span className="text-[10px] text-gray-500">{time}</span>
                {isOwn && <Ticks read={isRead} />}
              </div>
            </div>
          )}

          {/* Image */}
          {isImage && message.fileURL && (
            <div className={`rounded-xl overflow-hidden shadow-sm ${isOwn ? "rounded-tr-none" : "rounded-tl-none"}`}>
              <a href={message.fileURL} target="_blank" rel="noopener noreferrer">
                <Image src={message.fileURL} alt={message.fileName ?? "image"} width={220} height={220} className="block max-w-[220px] max-h-[220px] object-cover" />
              </a>
              <div className="flex justify-end items-center px-2 pb-1">
                <span className="text-[11px] text-gray-400">{time}</span>
                {isOwn && <Ticks read={isRead} />}
              </div>
            </div>
          )}

          {/* File */}
          {message.type === "file" && !isImage && (
            <div className={`relative rounded-lg shadow-sm overflow-hidden px-3 py-2 ${isOwn ? "bg-[#D9FDD3] rounded-tr-none" : "bg-white rounded-tl-none"}`}>
              {!isOwn && <div className="absolute top-0 -left-2 w-2 h-2 overflow-hidden"><div className="w-4 h-4 bg-white" style={{ clipPath: "polygon(100% 0, 0% 0, 100% 100%)" }} /></div>}
              {isOwn && <div className="absolute top-0 -right-2 w-2 h-2 overflow-hidden"><div className="w-4 h-4 bg-[#D9FDD3] -translate-x-2" style={{ clipPath: "polygon(0 0, 0% 100%, 100% 0)" }} /></div>}
              <a href={message.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#008069]">
                <div className="w-9 h-9 rounded-full bg-[#008069]/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#008069]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <span className="truncate max-w-[160px] text-sm">{message.fileName}</span>
              </a>
              <div className="flex justify-end items-center mt-1">
                <span className="text-[11px] text-gray-400">{time}</span>
                {isOwn && <Ticks read={isRead} />}
              </div>
            </div>
          )}

          {/* Text */}
          {message.type === "text" && (
            <div className={`relative rounded-lg text-sm shadow-sm ${isOwn ? "bg-[#D9FDD3] text-gray-900 rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none"}`}>
              {!isOwn && <div className="absolute top-0 -left-2 w-2 h-2 overflow-hidden"><div className="w-4 h-4 bg-white" style={{ clipPath: "polygon(100% 0, 0% 0, 100% 100%)" }} /></div>}
              {isOwn && <div className="absolute top-0 -right-2 w-2 h-2 overflow-hidden"><div className="w-4 h-4 bg-[#D9FDD3] -translate-x-2" style={{ clipPath: "polygon(0 0, 0% 100%, 100% 0)" }} /></div>}

              {editing ? (
                <div className="px-3 pt-2 pb-2">
                  <textarea
                    className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed border-b border-gray-400"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    rows={2}
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setEditing(false)} className="text-[11px] text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={handleEditSave} className="text-[11px] text-[#008069] font-semibold hover:text-[#006d5a]">Save</button>
                  </div>
                </div>
              ) : (
                <div className="px-3 pt-2 pb-1.5">
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                  <div className="flex justify-end items-center mt-0.5 gap-0.5">
                    {message.edited && <span className="text-[10px] text-gray-400 italic">edited</span>}
                    <span className="text-[11px] text-gray-400 ml-1">{time}</span>
                    {isOwn && <Ticks read={isRead} />}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center pb-10" onClick={() => setMenuOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-64 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-400 truncate">{message.text || "Media message"}</p>
            </div>
            {message.type === "text" && (
              <button onClick={handleEditStart} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-[15px] text-gray-800">Edit message</span>
              </button>
            )}
            <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-left">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-[15px] text-red-500">Delete message</span>
            </button>
            <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-t border-gray-100">
              <span className="text-[15px] text-gray-500 w-full text-center">Cancel</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
