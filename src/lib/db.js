import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, where,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ── Real-time listeners (fast — serve from cache first) ──────

export const subscribeProperties = (userId, callback) => {
  const q = query(collection(db, 'properties'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    callback(rows);
  }, (err) => console.error('properties listener:', err));
};

export const subscribeDocuments = (userId, callback) => {
  const q = query(collection(db, 'documents'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => (a.expiryDate?.toMillis?.() ?? 0) - (b.expiryDate?.toMillis?.() ?? 0));
    callback(rows);
  }, (err) => console.error('documents listener:', err));
};

// ── One-shot reads (used for deleteProperty cascade) ─────────

export const getDocumentsByPropertyOnce = async (propertyId) => {
  const snap = await getDocs(query(collection(db, 'documents'), where('propertyId', '==', propertyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Writes ───────────────────────────────────────────────────

export const addProperty = (userId, data) =>
  addDoc(collection(db, 'properties'), { ...data, userId, createdAt: serverTimestamp() });

export const updateProperty = (id, data) =>
  updateDoc(doc(db, 'properties', id), data);

export const deleteProperty = async (id) => {
  const docs = await getDocumentsByPropertyOnce(id);
  await Promise.all(docs.map(d => deleteDoc(doc(db, 'documents', d.id))));
  return deleteDoc(doc(db, 'properties', id));
};

export const addDocument = (userId, data) =>
  addDoc(collection(db, 'documents'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    expiryDate: Timestamp.fromDate(new Date(data.expiryDate)),
    issueDate: data.issueDate ? Timestamp.fromDate(new Date(data.issueDate)) : null,
  });

export const updateDocument = (id, data) => {
  const update = { ...data };
  if (data.expiryDate) update.expiryDate = Timestamp.fromDate(new Date(data.expiryDate));
  if (data.issueDate)  update.issueDate  = Timestamp.fromDate(new Date(data.issueDate));
  return updateDoc(doc(db, 'documents', id), update);
};

export const deleteDocument = (id) => deleteDoc(doc(db, 'documents', id));

// ── Expiry helper ─────────────────────────────────────────────

export const getExpiryStatus = (expiryDate, reminderDays = 30) => {
  if (!expiryDate) return { status: 'valid', daysLeft: 999, label: 'No date' };
  const expiry = expiryDate?.toDate ? expiryDate.toDate() : new Date(expiryDate);
  if (isNaN(expiry))  return { status: 'valid', daysLeft: 999, label: 'Invalid date' };
  const daysLeft = Math.ceil((expiry - new Date()) / 864e5);
  if (daysLeft < 0)             return { status: 'expired',  daysLeft, label: `Expired ${Math.abs(daysLeft)}d ago` };
  if (daysLeft <= reminderDays) return { status: 'expiring', daysLeft, label: `${daysLeft}d left` };
  return { status: 'valid', daysLeft, label: `${daysLeft}d left` };
};
