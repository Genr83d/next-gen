import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();

export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);

export const signInWithGoogle = async () => signInWithPopup(auth, googleProvider);

export const signOutUser = async () => signOut(auth);

export const sendVerificationEmail = async (user) => {
  if (!user) return;
  await sendEmailVerification(user);
};
