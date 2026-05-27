"use client";
import { useState } from "react";
import { User } from "firebase/auth";
import Avatar from "@/components/ui/Avatar";

interface Props {
  currentUser: User;
  onLogout: () => void;
}

export default function ProfileTab({ currentUser, onLogout }: Props) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F0F2F5] pb-24">
      {/* Profile header */}
      <div className="bg-white mb-2">
        <div className="flex items-center gap-4 px-4 py-5">
          <div className="relative shrink-0">
            <Avatar src={currentUser.photoURL} name={currentUser.displayName} size={72} online />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-semibold text-gray-900 truncate">{currentUser.displayName ?? "User"}</p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{currentUser.email ?? currentUser.phoneNumber}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-[#25D366] inline-block" />
              <span className="text-xs text-[#008069] font-medium">Online</span>
            </div>
          </div>
          <button className="p-2 rounded-full text-[#008069] hover:bg-[#F0F2F5] transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white mb-2">
        <div className="px-4 pt-4 pb-1">
          <p className="text-[13px] font-semibold text-[#008069]">Account info</p>
        </div>
        {currentUser.email && (
          <div className="flex items-start gap-4 px-4 py-3 border-b border-gray-100">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-[15px] text-gray-900">{currentUser.email}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Email</p>
            </div>
          </div>
        )}
        {currentUser.phoneNumber && (
          <div className="flex items-start gap-4 px-4 py-3 border-b border-gray-100">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-[15px] text-gray-900">{currentUser.phoneNumber}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Phone</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-4 px-4 py-3">
          <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
          </svg>
          <div>
            <p className="text-[13px] text-gray-500 font-mono">{currentUser.uid}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">User ID</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white mb-2">
        <div className="px-4 pt-4 pb-1">
          <p className="text-[13px] font-semibold text-[#008069]">Privacy & Security</p>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-[15px] text-gray-800">End-to-end secured</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Messages are protected by Firebase rules</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-[15px] text-gray-800">Private chats only</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Only participants can read each conversation</p>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-white">
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-[#F5F5F5] transition-colors"
        >
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <p className="text-[15px] text-red-500 font-medium">Sign out</p>
        </button>
      </div>

      {/* Sign out confirmation modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <p className="text-[17px] text-gray-900 font-semibold mb-1">Sign out of E-Chat?</p>
            <p className="text-[14px] text-gray-400 mb-6">You can sign back in at any time.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-300 text-[15px] font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-2.5 rounded-full bg-[#008069] text-white text-[15px] font-semibold hover:bg-[#006d5a] transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
