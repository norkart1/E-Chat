"use client";
import { useEffect, useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import {
  saveOffer,
  saveAnswer,
  addIceCandidate,
  subscribeToIceCandidates,
  updateCallStatus,
} from "@/lib/firebase/firestore";

interface Props {
  chatId: string;
  callType: "audio" | "video";
  isCaller: boolean;
  remoteUser: { displayName: string; photoURL: string };
  callStatus: string;
  remoteOffer?: string;
  remoteAnswer?: string;
  onEnd: () => void;
}

export default function CallModal({
  chatId,
  callType,
  isCaller,
  remoteUser,
  callStatus,
  remoteOffer,
  remoteAnswer,
  onEnd,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let unsubCaller: (() => void) | undefined;
    let unsubCallee: (() => void) | undefined;

    async function start() {
      const constraints =
        callType === "video" ? { audio: true, video: true } : { audio: true, video: false };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        alert("Could not access camera/microphone.");
        onEnd();
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setConnected(true);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addIceCandidate(chatId, isCaller ? "caller" : "callee", e.candidate.toJSON());
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await saveOffer(chatId, offer);

        unsubCallee = subscribeToIceCandidates(chatId, "callee", (c) => {
          pc.addIceCandidate(new RTCIceCandidate(c));
        });
      } else {
        if (remoteOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(remoteOffer)));
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await saveAnswer(chatId, answer);

        unsubCaller = subscribeToIceCandidates(chatId, "caller", (c) => {
          pc.addIceCandidate(new RTCIceCandidate(c));
        });
      }
    }

    start();

    return () => {
      unsubCaller?.();
      unsubCallee?.();
    };
  }, []);

  useEffect(() => {
    if (!isCaller && remoteAnswer && pcRef.current) {
      const pc = pcRef.current;
      if (pc.signalingState === "have-local-pranswer" || pc.signalingState === "stable") return;
      pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(remoteAnswer)));
    }
  }, [remoteAnswer, isCaller]);

  useEffect(() => {
    if (callStatus === "ended") {
      cleanup();
    }
  }, [callStatus]);

  function cleanup() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    onEnd();
  }

  function endCall() {
    updateCallStatus(chatId, "ended");
    cleanup();
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  }

  function toggleCamera() {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff(!cameraOff);
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
      {callType === "video" ? (
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-32 h-24 rounded-xl object-cover border-2 border-white shadow-lg"
          />
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
              <Avatar src={remoteUser.photoURL} name={remoteUser.displayName} size={80} />
              <p className="mt-4 text-white text-xl font-semibold">{remoteUser.displayName}</p>
              <p className="text-gray-300 mt-1 animate-pulse">
                {callStatus === "ringing" ? "Calling…" : "Connecting…"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className={`p-6 rounded-full ${connected ? "bg-indigo-600" : "bg-gray-700"} animate-pulse`}>
            <Avatar src={remoteUser.photoURL} name={remoteUser.displayName} size={80} />
          </div>
          <p className="text-white text-2xl font-semibold">{remoteUser.displayName}</p>
          <p className="text-gray-400 text-lg">
            {connected ? "On call" : callStatus === "ringing" ? "Calling…" : "Connecting…"}
          </p>
          <audio ref={remoteVideoRef as React.RefObject<HTMLAudioElement>} autoPlay />
        </div>
      )}

      <div className="absolute bottom-10 flex gap-6">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition ${muted ? "bg-gray-500" : "bg-white/20 hover:bg-white/30"}`}
        >
          {muted ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {callType === "video" && (
          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition ${cameraOff ? "bg-gray-500" : "bg-white/20 hover:bg-white/30"}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a16.003 16.003 0 0114 14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
