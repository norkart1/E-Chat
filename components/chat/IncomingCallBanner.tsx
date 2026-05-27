"use client";
import Avatar from "../ui/Avatar";
import { updateCallStatus } from "@/lib/firebase/firestore";

interface Props {
  chatId: string;
  callerName: string;
  callerPhoto: string;
  callType: "audio" | "video";
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallBanner({ chatId, callerName, callerPhoto, callType, onAccept, onDecline }: Props) {
  async function decline() {
    await updateCallStatus(chatId, "ended");
    onDecline();
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4 px-5 py-4 min-w-[300px]">
      <Avatar src={callerPhoto} name={callerName} size={48} />
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{callerName}</p>
        <p className="text-sm text-gray-500">Incoming {callType} call…</p>
      </div>
      <button onClick={decline} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button onClick={onAccept} className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>
    </div>
  );
}
