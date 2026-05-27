"use client";
import { useState, useRef, useEffect } from "react";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
} from "@/lib/firebase/auth";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import Spinner from "@/components/ui/Spinner";

type Tab = "google" | "email" | "phone";
type EmailMode = "signin" | "signup" | "reset";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("google");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    setError("");
    setInfo("");
  }, [tab, emailMode]);

  async function handleGoogle() {
    setLoading(true); setError("");
    try { await signInWithGoogle(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Sign-in failed."); }
    finally { setLoading(false); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    try {
      if (emailMode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); return; }
        await signUpWithEmail(email, password, name.trim());
      } else if (emailMode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await resetPassword(email);
        setInfo("Password reset email sent! Check your inbox.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally { setLoading(false); }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = setupRecaptcha("recaptcha-container");
      }
      const result = await sendPhoneOTP(phone, recaptchaRef.current);
      setConfirmation(result);
      setOtpSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send OTP.");
      recaptchaRef.current = null;
    } finally { setLoading(false); }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    setLoading(true); setError("");
    try {
      await verifyPhoneOTP(confirmation, otp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid OTP. Try again.");
    } finally { setLoading(false); }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "google",
      label: "Google",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      key: "email",
      label: "Email",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl px-8 py-10 flex flex-col items-center gap-5 w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to E-Chat</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to start chatting</p>
        </div>

        <div className="flex w-full bg-gray-100 rounded-xl p-1 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-green-700 text-sm">
            {info}
          </div>
        )}

        {tab === "google" && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-60"
          >
            {loading ? <Spinner size={20} /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>
        )}

        {tab === "email" && (
          <form onSubmit={handleEmail} className="w-full flex flex-col gap-3">
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
              {(["signin", "signup", "reset"] as EmailMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEmailMode(m)}
                  className={`flex-1 py-2 font-medium capitalize transition-colors ${
                    emailMode === m ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {m === "signin" ? "Sign In" : m === "signup" ? "Sign Up" : "Reset"}
                </button>
              ))}
            </div>

            {emailMode === "signup" && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {emailMode !== "reset" && (
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Spinner size={18} />}
              {emailMode === "signin" ? "Sign In" : emailMode === "signup" ? "Create Account" : "Send Reset Email"}
            </button>
          </form>
        )}

        {tab === "phone" && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="w-full flex flex-col gap-3">
            <div id="recaptcha-container" />
            {!otpSent ? (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+</span>
                  <input
                    type="tel"
                    placeholder="Phone number (e.g. 1234567890)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 pl-6 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <p className="text-xs text-gray-400">Include country code, e.g. +1 for US</p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size={18} />}
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 text-center">
                  OTP sent to <span className="font-semibold">{phone}</span>
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size={18} />}
                  Verify OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); recaptchaRef.current = null; }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Try a different number
                </button>
              </>
            )}
          </form>
        )}

        <p className="text-xs text-gray-400 text-center">
          By signing in, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
