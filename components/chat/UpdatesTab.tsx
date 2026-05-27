"use client";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToUsers, subscribeToUserChats, ChatUser, ChatPreview } from "@/lib/firebase/firestore";
import Avatar from "@/components/ui/Avatar";

interface Props {
  currentUser: User;
  onOpenChat: (chatId: string, otherUser: ChatUser) => void;
}

function timeAgo(ts: { seconds: number } | null): string {
  if (!ts) return "";
  const diff = Math.floor(Date.now() / 1000 - ts.seconds);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function UpdatesTab({ currentUser, onOpenChat }: Props) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);

  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToUserChats(currentUser.uid, setChats);
    return unsub;
  }, [currentUser.uid]);

  const others = users.filter((u) => u.uid !== currentUser.uid);
  const onlineUsers = others.filter((u) => u.online);

  const userMap = new Map(users.map((u) => [u.uid, u]));

  const recentActivity = chats
    .filter((c) => c.lastMessage && c.lastMessageAt)
    .slice(0, 20);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Online now */}
      <div className="px-4 pt-5 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Online now · {onlineUsers.length}
        </h2>
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No one else is online right now.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {onlineUsers.map((u) => (
              <button
                key={u.uid}
                onClick={() => {
                  const chatId = [currentUser.uid, u.uid].sort().join("_");
                  onOpenChat(chatId, u);
                }}
                className="flex flex-col items-center gap-1.5 min-w-[56px] group"
              >
                <div className="relative">
                  <Avatar src={u.photoURL} name={u.displayName} size={52} online={u.online} />
                </div>
                <span className="text-[11px] text-gray-600 font-medium truncate w-14 text-center group-hover:text-indigo-600 transition-colors">
                  {u.displayName.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4 my-3 h-px bg-gray-200" />

      {/* Recent activity */}
      <div className="px-4 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent activity
        </h2>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-gray-400">No recent activity yet.<br />Start a conversation!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recentActivity.map((chat) => {
              const other = userMap.get(chat.otherUid);
              if (!other) return null;
              const isUnread = chat.unread > 0;
              return (
                <button
                  key={chat.chatId}
                  onClick={() => onOpenChat(chat.chatId, other)}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white transition-colors text-left bg-white/60"
                >
                  <Avatar src={other.photoURL} name={other.displayName} size={44} online={other.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                        {other.displayName}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {timeAgo(chat.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                      <p className={`text-xs truncate ${isUnread ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
