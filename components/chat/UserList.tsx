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
  return `${Math.floor(diff / 86400)}d`;
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
    const sorted = [...otherUsers].sort((a, b) => {
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return (a.displayName ?? "").localeCompare(b.displayName ?? "");
    });
    return sorted;
  }, [otherUsers]);

  const lc = search.toLowerCase();
  const filteredRecent = recentChats.filter(
    (c) =>
      c.user.displayName?.toLowerCase().includes(lc) ||
      c.user.email?.toLowerCase().includes(lc)
  );
  const filteredAll = allOtherUsers.filter(
    (u) =>
      !recentUids.has(u.uid) &&
      (u.displayName?.toLowerCase().includes(lc) ||
        u.email?.toLowerCase().includes(lc))
  );

  function handleSelect(u: ChatUser) {
    onSelectChat(getChatId(currentUser.uid, u.uid), u);
  }

  const totalUnread = recentChats.reduce((sum, c) => sum + (c.unread ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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

      <div className="flex-1 overflow-y-auto">
        {filteredRecent.length === 0 && filteredAll.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">No users found</p>
        )}

        {filteredRecent.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 py-1.5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent</p>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold bg-indigo-600 text-white rounded-full px-1.5 py-0.5">
                  {totalUnread}
                </span>
              )}
            </div>
            {filteredRecent.map((c) => {
              const isSelected = selectedChatId === c.chatId;
              return (
                <UserRow
                  key={c.chatId}
                  user={c.user}
                  isSelected={isSelected}
                  subtitle={c.lastMessage}
                  timestamp={timeAgo(c.lastMessageAt as { seconds: number } | null)}
                  unread={c.unread ?? 0}
                  onClick={() => handleSelect(c.user)}
                />
              );
            })}
          </>
        )}

        {filteredAll.length > 0 && (
          <>
            <div className="px-4 py-1.5 mt-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {filteredRecent.length > 0 ? "All Users" : "Users"}
              </p>
            </div>
            {filteredAll.map((u) => {
              const chatId = getChatId(currentUser.uid, u.uid);
              return (
                <UserRow
                  key={u.uid}
                  user={u}
                  isSelected={selectedChatId === chatId}
                  subtitle={u.online ? "Online" : u.email}
                  onClick={() => handleSelect(u)}
                />
              );
            })}
          </>
        )}
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

function UserRow({ user, isSelected, subtitle, timestamp, unread = 0, onClick }: RowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left group ${
        isSelected
          ? "bg-indigo-50 border-r-2 border-indigo-500"
          : "hover:bg-gray-50 border-r-2 border-transparent"
      }`}
    >
      <Avatar src={user.photoURL} name={user.displayName} size={44} online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm truncate ${unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
            {user.displayName}
          </p>
          {timestamp && (
            <span className="text-[11px] text-gray-400 shrink-0">{timestamp}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={`text-xs truncate ${unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
            {subtitle || user.email}
          </p>
          {unread > 0 && (
            <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
