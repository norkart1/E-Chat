"use client";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToUsers, subscribeToUserChats, ChatUser, getChatId } from "@/lib/firebase/firestore";
import Avatar from "../ui/Avatar";

interface Props {
  currentUser: User;
  selectedChatId: string | null;
  onSelectChat: (chatId: string, otherUser: ChatUser) => void;
}

interface ChatPreview {
  chatId: string;
  lastMessage: string;
  otherUid: string;
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
    const unsub = subscribeToUserChats(currentUser.uid, (chats) => {
      setChatPreviews(
        chats.map((c) => ({ chatId: c.chatId, lastMessage: c.lastMessage, otherUid: c.otherUid }))
      );
    });
    return unsub;
  }, [currentUser.uid]);

  const otherUsers = users.filter((u) => u.uid !== currentUser.uid);

  const filtered = otherUsers.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  function getLastMessage(uid: string) {
    const preview = chatPreviews.find((c) => c.otherUid === uid);
    return preview?.lastMessage ?? "";
  }

  function handleSelect(u: ChatUser) {
    const chatId = getChatId(currentUser.uid, u.uid);
    onSelectChat(chatId, u);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No users found</p>
        )}
        {filtered.map((u) => {
          const chatId = getChatId(currentUser.uid, u.uid);
          const isSelected = selectedChatId === chatId;
          return (
            <button
              key={u.uid}
              onClick={() => handleSelect(u)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                isSelected ? "bg-indigo-50 border-r-2 border-indigo-500" : "hover:bg-gray-50"
              }`}
            >
              <Avatar src={u.photoURL} name={u.displayName} size={44} online={u.online} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{u.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{getLastMessage(u.uid) || u.email}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
