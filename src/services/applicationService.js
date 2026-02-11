import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the student photo.'));
    reader.readAsDataURL(file);
  });

export const uploadStudentPhoto = async (file) => {
  if (!file) throw new Error('Student photo is required.');
  const dataUrl = await readFileAsDataUrl(file);

  return {
    dataUrl,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
};

export const submitApplication = async (payload) => {
  const docRef = await addDoc(collection(db, 'application'), {
    status: 'submitted',
    statusUpdatedAt: serverTimestamp(),
    ...payload,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
};

export const listenToApplications = (callback, onError) => {
  const applicationsQuery = query(
    collection(db, 'application'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    applicationsQuery,
    (snapshot) => {
      const applications = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      callback(applications);
    },
    onError
  );
};

export const updateApplicationStatus = async (applicationId, status, adminMeta = {}) => {
  const docRef = doc(db, 'application', applicationId);
  await updateDoc(docRef, {
    status,
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: adminMeta,
  });
};

export const updateApplicationNotes = async (applicationId, notes, adminMeta = {}) => {
  const docRef = doc(db, 'application', applicationId);
  await updateDoc(docRef, {
    adminNotes: notes,
    notesUpdatedAt: serverTimestamp(),
    notesUpdatedBy: adminMeta,
  });
};

export const deleteApplication = async (applicationId, photoPath) => {
  if (photoPath) {
    try {
      await deleteObject(ref(storage, photoPath));
    } catch (error) {
      if (error?.code !== 'storage/object-not-found') {
        throw error;
      }
    }
  }

  const docRef = doc(db, 'application', applicationId);
  await deleteDoc(docRef);
};
