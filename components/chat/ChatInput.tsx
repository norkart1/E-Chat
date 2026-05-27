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

  const hasText = text.trim().length > 0;

  return (
    <div className="bg-[#F0F2F5] px-2 py-2 relative">
      {picker && (
        <GiphyPicker
          mode={picker}
          onSelect={handleGifSelect}
          onClose={() => setPicker(null)}
        />
      )}

      {uploading && (
        <div className="mb-2 px-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#25D366] transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Uploading… {Math.round(uploadProgress)}%</p>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Left actions */}
        <div className="flex items-center gap-1 shrink-0 pb-1.5">
          <button
            onClick={() => togglePicker("sticker")}
            className={`p-1.5 rounded-full transition-colors ${picker === "sticker" ? "text-[#008069]" : "text-gray-500 hover:text-[#008069]"}`}
            title="Emoji / Sticker"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-full text-gray-500 hover:text-[#008069] transition-colors"
            title="Attach file"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <button
            onClick={() => togglePicker("gif")}
            className={`p-1.5 rounded-full transition-colors text-xs font-bold ${picker === "gif" ? "text-[#008069]" : "text-gray-500 hover:text-[#008069]"}`}
            title="Send GIF"
          >
            GIF
          </button>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

        {/* Text input */}
        <textarea
          className="flex-1 resize-none rounded-3xl bg-white border-none px-4 py-2.5 text-sm focus:outline-none max-h-32 min-h-[42px] text-gray-900 placeholder-gray-400 shadow-sm"
          placeholder="Message"
          rows={1}
          value={text}
          onChange={handleText}
          onKeyDown={handleKey}
        />

        {/* Send / mic button */}
        <button
          onClick={handleSend}
          disabled={!hasText}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
            hasText
              ? "bg-[#008069] text-white shadow-md"
              : "bg-[#008069] text-white shadow-md"
          }`}
        >
          {hasText ? (
            <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
