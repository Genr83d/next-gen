import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const getUserProfile = async (uid) => {
  if (!uid) return null;

  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
};

export const ensureUserProfile = async (user) => {
  if (!user?.uid) return null;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  const profile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    phoneNumber: user.phoneNumber || '',
    photoURL: user.photoURL || '',
    providerId: user.providerData?.[0]?.providerId || 'unknown',
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, profile);
  return profile;
};
