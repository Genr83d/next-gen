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
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

const buildStoragePath = ({ fileName, applicantName = '', authUid = '' }) => {
  const safeName = applicantName
    ? applicantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'student';
  const safeFileName = fileName
    ? fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, '')
    : 'photo';
  const timeStamp = Date.now();
  const uidSegment = authUid || 'guest';

  return `applications/${uidSegment}/${timeStamp}-${safeName}-${safeFileName}`;
};

export const uploadStudentPhoto = async (file, { applicantName, authUid } = {}) => {
  if (!file) throw new Error('Student photo is required.');
  const storagePath = buildStoragePath({
    fileName: file.name,
    applicantName,
    authUid,
  });
  const fileRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type,
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    path: storagePath,
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
