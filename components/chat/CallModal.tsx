"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

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
  const remoteDescSet = useRef(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [connected, setConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    let unsubCaller: (() => void) | undefined;
    let unsubCallee: (() => void) | undefined;

    async function start() {
      const constraints =
        callType === "video"
          ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { audio: true, video: false };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        alert("Could not access camera/microphone. Please allow permissions and try again.");
        cleanup();
        return;
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
        setConnected(true);
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addIceCandidate(chatId, isCaller ? "caller" : "callee", e.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setConnected(false);
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
        await pc.setLocalDescription(offer);
        await saveOffer(chatId, offer);

        unsubCallee = subscribeToIceCandidates(chatId, "callee", (c) => {
          if (pcRef.current?.remoteDescription) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        });
      } else {
        if (remoteOffer && !remoteDescSet.current) {
          remoteDescSet.current = true;
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(remoteOffer)));
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await saveAnswer(chatId, answer);
        await updateCallStatus(chatId, "answered");

        unsubCaller = subscribeToIceCandidates(chatId, "caller", (c) => {
          if (pcRef.current?.remoteDescription) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
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
    if (!isCaller && remoteAnswer && pcRef.current && !remoteDescSet.current) {
      const pc = pcRef.current;
      if (pc.signalingState === "have-local-offer") {
        remoteDescSet.current = true;
        pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(remoteAnswer))).catch(() => {});
      }
    }
  }, [remoteAnswer, isCaller]);

  useEffect(() => {
    if (isCaller && remoteAnswer && pcRef.current) {
      const pc = pcRef.current;
      if (pc.signalingState === "have-local-offer" && !remoteDescSet.current) {
        remoteDescSet.current = true;
        pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(remoteAnswer))).catch(() => {});
      }
    }
  }, [remoteAnswer, isCaller]);

  useEffect(() => {
    if (callStatus === "ended") {
      cleanup();
    }
  }, [callStatus, cleanup]);

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

  function toggleSpeaker() {
    const el = remoteVideoRef.current as HTMLVideoElement | null;
    if (el) el.muted = !speakerOff;
    setSpeakerOff(!speakerOff);
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center select-none">
      {callType === "video" ? (
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-36 h-28 rounded-2xl object-cover border-2 border-white shadow-xl"
          />
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping" />
                <Avatar src={remoteUser.photoURL} name={remoteUser.displayName} size={96} />
              </div>
              <p className="mt-6 text-white text-2xl font-semibold">{remoteUser.displayName}</p>
              <p className="text-indigo-300 mt-2 animate-pulse text-lg">
                {callStatus === "ringing" ? "Ringing…" : "Connecting…"}
              </p>
            </div>
          )}
          {connected && (
            <div className="absolute top-4 left-4 bg-black/40 rounded-full px-3 py-1">
              <span className="text-white text-sm font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full px-8">
          <div className="relative mt-16">
            <div className={`absolute -inset-6 rounded-full ${connected ? "bg-indigo-500/20 animate-pulse" : "bg-gray-500/20 animate-ping"}`} />
            <Avatar src={remoteUser.photoURL} name={remoteUser.displayName} size={100} />
          </div>
          <div className="text-center">
            <p className="text-white text-2xl font-bold">{remoteUser.displayName}</p>
            <p className="text-gray-400 mt-1 text-base">
              {connected ? formatDuration(callDuration) : callStatus === "ringing" ? "Calling…" : "Connecting…"}
            </p>
          </div>
          <audio ref={remoteVideoRef as React.RefObject<HTMLAudioElement>} autoPlay />
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 pt-4 px-4 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center">
        <div className="flex items-end justify-center gap-5">

          {/* Mute */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${muted ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"}`}
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
            <span className="text-white/80 text-[11px]">{muted ? "Unmute" : "Mute"}</span>
          </div>

          {/* Speaker */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${speakerOff ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {speakerOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                )}
              </svg>
            </button>
            <span className="text-white/80 text-[11px]">{speakerOff ? "Speaker off" : "Speaker"}</span>
          </div>

          {/* End call */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
            >
              <svg className="w-7 h-7 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </button>
            <span className="text-white/80 text-[11px]">End</span>
          </div>

          {/* Camera (video only) */}
          {callType === "video" && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={toggleCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${cameraOff ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <span className="text-white/80 text-[11px]">{cameraOff ? "Camera off" : "Camera"}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
