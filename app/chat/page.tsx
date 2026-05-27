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
    const unsub = subscribeToUserChats(user.uid, (chats) => {
      setTotalUnread(chats.reduce((sum, c) => sum + c.unread, 0));
    });
    return unsub;
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
    <div className="h-screen flex overflow-hidden bg-gray-100">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 shadow-sm shrink-0">
        <SidebarHeader user={user} onLogout={handleLogout} />
        <SidebarProfile user={user} />
        <div className="flex-1 overflow-hidden">
          <UserList
            currentUser={user}
            selectedChatId={selectedChat?.chatId ?? null}
            onSelectChat={handleSelectChat}
          />
        </div>
      </aside>

      {/* ── Mobile: full-width content area ─────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Mobile: show when NOT in a chat */}
        {!inChat && (
          <div className="flex flex-col flex-1 min-h-0 md:hidden">
            {/* Mobile tab header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 shadow-sm shrink-0">
              <img src="/logo.png" alt="E-Chat" className="w-7 h-7 object-contain" />
              <span className="font-bold text-gray-800 text-base flex-1 capitalize">{activeTab}</span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                <span className="text-[11px] text-green-600 font-medium">Secure</span>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {activeTab === "chats" && (
                <UserList
                  currentUser={user}
                  selectedChatId={selectedChat?.chatId ?? null}
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

        {/* Mobile: chat window */}
        {inChat && (
          <div className="flex flex-col flex-1 min-h-0 md:hidden">
            <div className="flex items-center px-3 py-2.5 bg-white border-b border-gray-100 shadow-sm shrink-0 gap-2">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Avatar
                src={selectedChat.otherUser.photoURL}
                name={selectedChat.otherUser.displayName}
                size={34}
                online={selectedChat.otherUser.online}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selectedChat.otherUser.displayName}</p>
                <p className="text-[11px] text-gray-400">{selectedChat.otherUser.online ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatWindow
                currentUser={user}
                otherUser={selectedChat.otherUser}
                chatId={selectedChat.chatId}
              />
            </div>
          </div>
        )}

        {/* ── Desktop: chat panel ──────────────────────────────────── */}
        <div className="hidden md:flex flex-col flex-1 min-h-0">
          {selectedChat ? (
            <ChatWindow
              currentUser={user}
              otherUser={selectedChat.otherUser}
              chatId={selectedChat.chatId}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* ── Bottom nav (mobile only, hidden while in active chat) ── */}
      {!inChat && (
        <BottomNav
          active={activeTab}
          onChange={setActiveTab}
          unreadCount={totalUnread}
        />
      )}
    </div>
  );
}

function SidebarHeader({ user, onLogout }: { user: { displayName: string | null; photoURL: string | null }, onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
      <img src="/logo.png" alt="E-Chat" className="w-8 h-8 object-contain" />
      <span className="font-bold text-gray-800 text-lg flex-1">E-Chat</span>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-100">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          <span className="text-[11px] text-green-600 font-medium">Secure</span>
        </div>
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition ml-1"
          title="Sign out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SidebarProfile({ user }: { user: { displayName: string | null; photoURL: string | null; email: string | null; phoneNumber: string | null } }) {
  return (
    <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50/50">
      <div className="flex items-center gap-3">
        <Avatar src={user.photoURL} name={user.displayName} size={36} online />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName}</p>
          <p className="text-xs text-gray-400 truncate">{user.email ?? user.phoneNumber}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-gray-400 px-8">
      <img src="/logo.png" alt="E-Chat" className="w-20 h-20 object-contain opacity-30" />
      <div className="text-center">
        <p className="font-semibold text-gray-600 text-lg">Your messages are secure</p>
        <p className="text-sm mt-1 leading-relaxed">
          Select a user from the sidebar to start a private conversation.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-full px-4 py-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        End-to-end protected by Firebase security rules
      </div>
    </div>
  );
}
