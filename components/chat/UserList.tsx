"use client";
import { useEffect, useState, useMemo } from "react";
import { User } from "firebase/auth";
import {
  subscribeToUsers,
  subscribeToUserChats,
  ChatUser,
  ChatPreview,
  getChatId,
} from "@/lib/firebase/firestore";
import Avatar from "../ui/Avatar";

interface Props {
  currentUser: User;
  selectedChatId: string | null;
  onSelectChat: (chatId: string, otherUser: ChatUser) => void;
}

function timeAgo(ts: { seconds: number } | null): string {
  if (!ts) return "";
  const diff = Math.floor(Date.now() / 1000 - ts.seconds);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  return new Date(ts.seconds * 1000).toLocaleDateString([], { weekday: "short" });
}

export default function UserList({ currentUser, selectedChatId, onSelectChat }: Props) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToUserChats(currentUser.uid, setChatPreviews);
    return unsub;
  }, [currentUser.uid]);

  const userMap = useMemo(() => {
    const m: Record<string, ChatUser> = {};
    users.forEach((u) => (m[u.uid] = u));
    return m;
  }, [users]);

  const otherUsers = useMemo(
    () => users.filter((u) => u.uid !== currentUser.uid),
    [users, currentUser.uid]
  );

  const recentChats = useMemo(() => {
    return chatPreviews
      .map((c) => ({ ...c, user: userMap[c.otherUid] }))
      .filter((c) => c.user);
  }, [chatPreviews, userMap]);

  const recentUids = new Set(recentChats.map((c) => c.otherUid));

  const allOtherUsers = useMemo(() => {
    return [...otherUsers]
      .filter((u) => !recentUids.has(u.uid))
      .sort((a, b) => {
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return (a.displayName ?? "").localeCompare(b.displayName ?? "");
      });
  }, [otherUsers, recentUids]);

  const lc = search.toLowerCase();
  const filteredRecent = recentChats.filter(
    (c) =>
      c.user.displayName?.toLowerCase().includes(lc) ||
      c.user.email?.toLowerCase().includes(lc)
  );
  const filteredAll = allOtherUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(lc) ||
      u.email?.toLowerCase().includes(lc)
  );

  function handleSelect(u: ChatUser) {
    onSelectChat(getChatId(currentUser.uid, u.uid), u);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search bar */}
      <div className="px-3 py-2 bg-white">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full bg-[#F0F2F5] pl-9 pr-9 py-2 text-sm focus:outline-none text-gray-800 placeholder-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecent.length === 0 && filteredAll.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{search ? "No results found" : "No contacts yet"}</p>
          </div>
        )}

        {filteredRecent.map((c) => (
          <ChatRow
            key={c.chatId}
            user={c.user}
            isSelected={selectedChatId === c.chatId}
            subtitle={c.lastMessage}
            timestamp={timeAgo(c.lastMessageAt as { seconds: number } | null)}
            unread={c.unread ?? 0}
            onClick={() => handleSelect(c.user)}
          />
        ))}

        {filteredAll.length > 0 && (
          <>
            {filteredRecent.length > 0 && (
              <div className="px-4 py-1.5 bg-[#F0F2F5]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New chat</p>
              </div>
            )}
            {filteredAll.map((u) => (
              <ChatRow
                key={u.uid}
                user={u}
                isSelected={selectedChatId === getChatId(currentUser.uid, u.uid)}
                subtitle={u.online ? "Online" : "Tap to start chatting"}
                onClick={() => handleSelect(u)}
              />
            ))}
          </>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}

interface RowProps {
  user: ChatUser;
  isSelected: boolean;
  subtitle?: string;
  timestamp?: string;
  unread?: number;
  onClick: () => void;
}

function ChatRow({ user, isSelected, subtitle, timestamp, unread = 0, onClick }: RowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-gray-100 ${
        isSelected ? "bg-[#F0F2F5]" : "hover:bg-[#F5F5F5]"
      }`}
    >
      <Avatar src={user.photoURL} name={user.displayName} size={50} online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-[15px] font-medium text-gray-900 truncate">{user.displayName}</p>
          {timestamp && (
            <span className={`text-xs shrink-0 ${unread > 0 ? "text-[#25D366] font-medium" : "text-gray-400"}`}>
              {timestamp}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-[13px] text-gray-500 truncate">{subtitle || user.email}</p>
          {unread > 0 && (
            <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center px-1">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
