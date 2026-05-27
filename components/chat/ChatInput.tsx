"use client";
import { useState, useRef, useCallback } from "react";
import { uploadFile } from "@/lib/firebase/storage";
import GiphyPicker from "./GiphyPicker";

interface Props {
  chatId: string;
  onSend: (text: string) => void;
  onSendFile: (url: string, name: string, type: string) => void;
  onSendGif: (url: string, title: string, type: "gif" | "sticker") => void;
  onTyping: (isTyping: boolean) => void;
}

export default function ChatInput({ chatId, onSend, onSendFile, onSendGif, onTyping }: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [picker, setPicker] = useState<null | "gif" | "sticker">(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    onTyping(false);
  }, [text, onSend, onTyping]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const { url, name, type } = await uploadFile(file, chatId, setUploadProgress);
      onSendFile(url, name, type);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  function handleGifSelect(url: string, title: string) {
    onSendGif(url, title, picker as "gif" | "sticker");
    setPicker(null);
  }

  function togglePicker(mode: "gif" | "sticker") {
    setPicker((prev) => (prev === mode ? null : mode));
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 relative">
      {picker && (
        <GiphyPicker
          mode={picker}
          onSelect={handleGifSelect}
          onClose={() => setPicker(null)}
        />
      )}
      {uploading && (
        <div className="mb-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Uploading… {Math.round(uploadProgress)}%</p>
        </div>
      )}
      <div className="flex items-end gap-1.5">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

        <button
          onClick={() => togglePicker("gif")}
          className={`p-2 rounded-full transition-colors shrink-0 text-sm font-bold ${picker === "gif" ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
          title="Send GIF"
        >
          GIF
        </button>

        <button
          onClick={() => togglePicker("sticker")}
          className={`p-2 rounded-full transition-colors shrink-0 ${picker === "sticker" ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
          title="Send Sticker"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <textarea
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-32 min-h-[40px]"
          placeholder="Type a message…"
          rows={1}
          value={text}
          onChange={handleText}
          onKeyDown={handleKey}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
