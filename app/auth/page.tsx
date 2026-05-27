"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
} from "@/lib/firebase/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import Spinner from "@/components/ui/Spinner";

type Mode = "signin" | "signup" | "reset" | "phone";

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (user) router.replace("/chat");
  }, [user, router]);

  useEffect(() => {
    setError("");
    setInfo("");
  }, [mode]);

  function friendlyError(e: unknown): string {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("unauthorized-domain")) {
      const domain = window.location.hostname;
      return `This domain (${domain}) is not authorized in Firebase. Go to Firebase Console → Authentication → Settings → Authorized domains and add: ${domain}`;
    }
    if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
      return "Incorrect email or password. Please try again.";
    }
    if (msg.includes("email-already-in-use")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (msg.includes("weak-password")) {
      return "Password must be at least 6 characters.";
    }
    if (msg.includes("too-many-requests")) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (msg.includes("network-request-failed")) {
      return "Network error. Check your connection and try again.";
    }
    if (msg.includes("popup-closed-by-user")) {
      return "Sign-in window was closed. Please try again.";
    }
    return msg.replace("Firebase: ", "").replace(/\s*\(auth\/[\w-]+\)\.?/, "");
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        await signUpWithEmail(email, password, name.trim());
      } else if (mode === "signin") {
        await signInWithEmail(email, password);
      } else if (mode === "reset") {
        await resetPassword(email);
        setInfo("Password reset email sent! Check your inbox.");
      }
    } catch (e: unknown) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const digits = phone.replace(/\D/g, "");
      if (!digits) { setError("Please enter your phone number."); setLoading(false); return; }
      const code = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
      const fullPhone = `${code}${digits}`;
      if (!recaptchaRef.current) {
        recaptchaRef.current = setupRecaptcha("recaptcha-container");
      }
      const result = await sendPhoneOTP(fullPhone, recaptchaRef.current);
      setConfirmation(result);
      setOtpSent(true);
    } catch (e: unknown) {
      setError(friendlyError(e));
      recaptchaRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    setLoading(true);
    setError("");
    try {
      await verifyPhoneOTP(confirmation, otp);
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const heading =
    mode === "signin" ? "Sign in to E-Chat"
    : mode === "signup" ? "Create your account"
    : mode === "reset" ? "Reset your password"
    : "Sign in with phone";

  const subheading =
    mode === "signin" ? "Welcome back! Enter your details to continue."
    : mode === "signup" ? "Start chatting with people in seconds."
    : mode === "reset" ? "We'll send a reset link to your email."
    : "We'll send a one-time code to verify your number.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl px-8 py-9 flex flex-col items-center gap-5 w-full max-w-sm">

        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden border border-gray-100">
          <img src="/logo.png" alt="E-Chat" className="w-12 h-12 object-contain" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{subheading}</p>
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {info && (
          <div className="w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-green-700 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {info}
          </div>
        )}

        {/* ── Email / Password form ── */}
        {(mode === "signin" || mode === "signup" || mode === "reset") && (
          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-3">
            {mode === "signup" && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {mode !== "reset" && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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

            {mode === "signin" && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Spinner size={18} />}
              {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
            </button>
          </form>
        )}

        {/* ── Phone OTP form ── */}
        {mode === "phone" && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="w-full flex flex-col gap-3">
            <div id="recaptcha-container" />
            {!otpSent ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="+91"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      required
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Country code + number, e.g. +91 for India, +1 for US</p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size={18} />}
                  Send Code
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 text-center bg-gray-50 rounded-xl px-4 py-3">
                  Code sent to <span className="font-semibold text-gray-800">{phone}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size={18} />}
                  Verify & Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); recaptchaRef.current = null; }}
                  className="text-sm text-indigo-600 hover:underline text-center"
                >
                  Use a different number
                </button>
              </>
            )}
          </form>
        )}

        {/* ── Divider + Google ── */}
        {mode !== "reset" && (
          <>
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 shrink-0">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-60"
              >
                {loading ? <Spinner size={16} /> : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Google
              </button>

              <button
                onClick={() => setMode("phone")}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 ${
                  mode === "phone"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Phone
              </button>
            </div>
          </>
        )}

        {/* ── Footer links ── */}
        <div className="text-sm text-center text-gray-500 mt-1">
          {mode === "signin" && (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-indigo-600 font-semibold hover:underline">
                Create one
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-indigo-600 font-semibold hover:underline">
                Sign in
              </button>
            </>
          )}
          {(mode === "reset" || mode === "phone") && (
            <button onClick={() => setMode("signin")} className="text-indigo-600 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
