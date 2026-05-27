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

  const infoRows = [
    {
      label: "Display name",
      value: currentUser.displayName ?? "—",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: "Email",
      value: currentUser.email ?? "—",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Phone",
      value: currentUser.phoneNumber ?? "—",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ].filter((r) => r.value !== "—");

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-white px-6 pt-8 pb-6 flex flex-col items-center gap-3 border-b border-gray-100">
        <div className="relative">
          <Avatar src={currentUser.photoURL} name={currentUser.displayName} size={80} online />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{currentUser.displayName ?? "User"}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{currentUser.email ?? currentUser.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Online
        </div>
      </div>

      {/* Account info */}
      <div className="px-4 mt-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Account</p>
        <div className="bg-white rounded-2xl divide-y divide-gray-50 shadow-sm overflow-hidden">
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-gray-400">{row.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 mb-0.5">{row.label}</p>
                <p className="text-sm text-gray-800 font-medium truncate">{row.value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 mb-0.5">User ID</p>
              <p className="text-xs text-gray-500 font-mono truncate">{currentUser.uid}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="px-4 mt-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Security</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-green-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">End-to-end secured</p>
              <p className="text-xs text-gray-400">Messages are protected by Firebase security rules</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-50">
            <span className="text-indigo-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">Private conversations</p>
              <p className="text-xs text-gray-400">Only participants can read each chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="px-4 mt-5">
        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-red-100 text-red-500 font-semibold text-sm shadow-sm hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        ) : (
          <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 text-center mb-1">Sign out of E-Chat?</p>
            <p className="text-xs text-gray-400 text-center mb-4">You can sign back in any time.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
}
