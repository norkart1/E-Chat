import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

const googleProvider = new GoogleAuthProvider();

async function saveUserToFirestore(user: User) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      lastSeen: serverTimestamp(),
      online: true,
    },
    { merge: true }
  );
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await saveUserToFirestore(result.user);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  await saveUserToFirestore({ ...result.user, displayName: name });
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await saveUserToFirestore(result.user);
  return result.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

export async function sendPhoneOTP(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function verifyPhoneOTP(
  confirmation: ConfirmationResult,
  otp: string
) {
  const result = await confirmation.confirm(otp);
  await saveUserToFirestore(result.user);
  return result.user;
}

export async function logout() {
  if (auth.currentUser) {
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      { online: false, lastSeen: serverTimestamp() },
      { merge: true }
    );
  }
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
