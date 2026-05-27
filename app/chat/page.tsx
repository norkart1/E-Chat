"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { logout } from "@/lib/firebase/auth";
import { ChatUser } from "@/lib/firebase/firestore";
import UserList from "@/components/chat/UserList";
import ChatWindow from "@/components/chat/ChatWindow";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<{ chatId: string; otherUser: ChatUser } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) {
    router.replace("/auth");
    return null;
  }

  function handleSelectChat(chatId: string, otherUser: ChatUser) {
    setSelectedChat({ chatId, otherUser });
    setSidebarOpen(false);
  }

  async function handleLogout() {
    await logout();
    router.replace("/auth");
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <div className={`${sidebarOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 bg-white border-r border-gray-100 shadow-sm shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-lg flex-1">E-Chat</span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Avatar src={user.photoURL} name={user.displayName} size={36} online />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Users</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <UserList
            currentUser={user}
            selectedChatId={selectedChat?.chatId ?? null}
            onSelectChat={handleSelectChat}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
            <div className="md:hidden flex items-center px-3 py-2 bg-white border-b border-gray-100">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 mr-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                currentUser={user}
                otherUser={selectedChat.otherUser}
                chatId={selectedChat.chatId}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600 text-lg">Select a conversation</p>
              <p className="text-sm mt-1">Choose a user from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
