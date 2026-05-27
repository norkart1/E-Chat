"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { logout } from "@/lib/firebase/auth";
import { ChatUser, markChatRead, subscribeToUserChats } from "@/lib/firebase/firestore";
import UserList from "@/components/chat/UserList";
import ChatWindow from "@/components/chat/ChatWindow";
import Avatar from "@/components/ui/Avatar";
import BottomNav from "@/components/chat/BottomNav";
import UpdatesTab from "@/components/chat/UpdatesTab";
import ProfileTab from "@/components/chat/ProfileTab";

type Tab = "chats" | "updates" | "profile";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<{ chatId: string; otherUser: ChatUser } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    return subscribeToUserChats(user.uid, (chats) => {
      setTotalUnread(chats.reduce((sum, c) => sum + c.unread, 0));
    });
  }, [user]);

  if (!user) return null;

  function handleSelectChat(chatId: string, otherUser: ChatUser) {
    setSelectedChat({ chatId, otherUser });
    setActiveTab("chats");
    markChatRead(chatId, user!.uid).catch(() => {});
  }

  function handleBack() {
    setSelectedChat(null);
  }

  async function handleLogout() {
    await logout();
    router.replace("/auth");
  }

  const inChat = selectedChat !== null;

  return (
    <div className="h-screen flex overflow-hidden bg-[#EFEAE2]">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[360px] bg-white border-r border-gray-200 shrink-0 h-full">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#008069]">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="E-Chat" className="w-7 h-7 object-contain brightness-0 invert" />
            <span className="font-semibold text-white text-lg">E-Chat</span>
          </div>
          <div className="flex gap-1">
            <button className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* My profile strip */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F0F2F5] border-b border-gray-200">
          <Avatar src={user.photoURL} name={user.displayName} size={36} online />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email ?? user.phoneNumber}</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <UserList
            currentUser={user}
            selectedChatId={selectedChat?.chatId ?? null}
            onSelectChat={handleSelectChat}
          />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Mobile: tab views (no active chat) */}
        {!inChat && (
          <div className="flex flex-col flex-1 min-h-0 md:hidden">
            {/* Mobile tab header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#008069] shrink-0">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="E-Chat" className="w-6 h-6 object-contain brightness-0 invert" />
                <span className="font-semibold text-white text-base">E-Chat</span>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-full text-white/80 hover:bg-white/10 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-1.5 rounded-full text-white/80 hover:bg-white/10 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {activeTab === "chats" && (
                <UserList
                  currentUser={user}
                  selectedChatId={null}
                  onSelectChat={handleSelectChat}
                />
              )}
              {activeTab === "updates" && (
                <UpdatesTab currentUser={user} onOpenChat={handleSelectChat} />
              )}
              {activeTab === "profile" && (
                <ProfileTab currentUser={user} onLogout={handleLogout} />
              )}
            </div>
          </div>
        )}

        {/* Mobile: active chat */}
        {inChat && (
          <div className="flex flex-col flex-1 min-h-0 md:hidden">
            <ChatWindow
              currentUser={user}
              otherUser={selectedChat.otherUser}
              chatId={selectedChat.chatId}
              onBack={handleBack}
            />
          </div>
        )}

        {/* Desktop: chat panel */}
        <div className="hidden md:flex flex-col flex-1 min-h-0">
          {selectedChat ? (
            <ChatWindow
              currentUser={user}
              otherUser={selectedChat.otherUser}
              chatId={selectedChat.chatId}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#EFEAE2]">
              <div className="w-24 h-24 rounded-full bg-white/60 flex items-center justify-center">
                <img src="/logo.png" alt="E-Chat" className="w-16 h-16 object-contain opacity-40" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-gray-500">E-Chat</p>
                <p className="text-sm text-gray-400 mt-1">Select a chat to start messaging</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your messages are secured with Firebase rules
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav — mobile only, hidden when in a chat */}
      {!inChat && (
        <BottomNav active={activeTab} onChange={setActiveTab} unreadCount={totalUnread} />
      )}
    </div>
  );
}
