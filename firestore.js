// firestore.js
import { db, functions } from "./firebase.js";
import {
  collection, onSnapshot, doc, addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";

const callUpdateCrushStatus = httpsCallable(functions, "crushStatusUpdater");

function subscribeMobStatusDocs(docIds, onData, onError) {
  const unsubscribes = docIds.map(docId => {
    const ref = doc(db, "mob_status", docId);
    return onSnapshot(ref, snap => {
      const data = snap.data();
      onData(docId, data || {});
    }, onError);
  });
  return () => unsubscribes.forEach(u => u());
}

function subscribeMobLocations(onData, onError) {
  const ref = collection(db, "mob_locations");
  return onSnapshot(ref, snapshot => {
    const locationsMap = {};
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const mobNo = parseInt(docSnap.id, 10);
      locationsMap[mobNo] = { points: data.points || {} };
    });
    onData(locationsMap);
  }, onError);
}

async function submitReportDoc(payload) {
  await addDoc(collection(db, "reports"), payload);
}

async function toggleCrushCloudFunction(params) {
  return callUpdateCrushStatus(params);
}

export {
  subscribeMobStatusDocs,
  subscribeMobLocations,
  submitReportDoc,
  toggleCrushCloudFunction
};
