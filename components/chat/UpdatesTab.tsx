"use client";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToUsers, subscribeToUserChats, ChatUser, ChatPreview, getChatId } from "@/lib/firebase/firestore";
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

  useEffect(() => { return subscribeToUsers(setUsers); }, []);
  useEffect(() => { return subscribeToUserChats(currentUser.uid, setChats); }, [currentUser.uid]);

  const others = users.filter((u) => u.uid !== currentUser.uid);
  const onlineUsers = others.filter((u) => u.online);
  const userMap = new Map(users.map((u) => [u.uid, u]));
  const recentActivity = chats.filter((c) => c.lastMessage && c.lastMessageAt).slice(0, 20);

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Online now */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[13px] font-semibold text-[#008069] mb-3">Online now</p>
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-gray-400 pb-2">No contacts online right now.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {onlineUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => onOpenChat(getChatId(currentUser.uid, u.uid), u)}
                  className="flex flex-col items-center gap-1.5 min-w-[60px] group"
                >
                  <div className="relative">
                    <Avatar src={u.photoURL} name={u.displayName} size={54} online />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium truncate w-14 text-center">
                    {u.displayName.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="px-4 py-2 bg-[#F0F2F5]">
          <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Recent</p>
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No recent activity yet.<br />Start chatting with someone!</p>
          </div>
        ) : (
          recentActivity.map((chat) => {
            const other = userMap.get(chat.otherUid);
            if (!other) return null;
            const isUnread = chat.unread > 0;
            return (
              <button
                key={chat.chatId}
                onClick={() => onOpenChat(chat.chatId, other)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-[#F5F5F5] transition-colors text-left"
              >
                <Avatar src={other.photoURL} name={other.displayName} size={50} online={other.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[15px] truncate ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                      {other.displayName}
                    </span>
                    <span className={`text-xs shrink-0 ml-2 ${isUnread ? "text-[#25D366] font-medium" : "text-gray-400"}`}>
                      {timeAgo(chat.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] truncate ${isUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                      {chat.lastMessage}
                    </p>
                    {isUnread && (
                      <span className="shrink-0 ml-2 min-w-[20px] h-5 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center px-1">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
      <div className="h-20" />
    </div>
  );
}
