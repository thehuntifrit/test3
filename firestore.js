// firestore.js
import { db, functions } from "./firebase.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";

// ID生成
function generateId(collectionName) {
  return doc(collection(db, collectionName)).id;
}

// 書き込み
async function saveMobStatus(mobId, statusObj) {
  const ref = doc(db, "mobStatus", mobId.toString());
  await setDoc(ref, statusObj, { merge: true });
}

// 読み取り
async function fetchMobStatus(mobId) {
  const ref = doc(db, "mobStatus", mobId.toString());
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// 一括読み取り
async function fetchAllMobStatus() {
  const ref = collection(db, "mobStatus");
  const snap = await getDocs(ref);
  const data = {};
  snap.forEach(doc => { data[doc.id] = doc.data(); });
  return data;
}

// 購読
function subscribeMobStatus(callback) {
  const ref = collection(db, "mobStatus");
  return onSnapshot(ref, snapshot => {
    const data = {};
    snapshot.forEach(doc => { data[doc.id] = doc.data(); });
    callback(data);
  });
}

// Cloud Functions呼び出し
const callUpdateCrushStatus = httpsCallable(functions, "crushStatusUpdater");

export {
  generateId,
  saveMobStatus,
  fetchMobStatus,
  fetchAllMobStatus,
  subscribeMobStatus,
  callUpdateCrushStatus
};
