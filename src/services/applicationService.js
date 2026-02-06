import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const submitApplication = async (payload) => {
  const docRef = await addDoc(collection(db, 'application'), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
};
