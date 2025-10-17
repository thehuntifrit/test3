// firestore.js
import { db } from "./firebase.js";
import { collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

function subscribeMobStatusDocs(onUpdate) {
  const docIds = ["s_latest", "a_latest", "f_latest"];
  const mobStatusDataMap = {};
  const unsubs = docIds.map(id =>
    onSnapshot(doc(db, "mob_status", id), snap => {
      const data = snap.data();
      if (data) mobStatusDataMap[id] = data;
      onUpdate(mobStatusDataMap);
    })
  );
  return () => unsubs.forEach(u => u());
}

function subscribeMobLocations(onUpdate) {
  const unsub = onSnapshot(collection(db, "mob_locations"), snapshot => {
    const map = {};
    snapshot.forEach(docSnap => {
      const mobNo = parseInt(docSnap.id, 10);
      const data = docSnap.data();
      map[mobNo] = { points: data.points || {} };
    });
    onUpdate(map);
  });
  return unsub;
}

export { subscribeMobStatusDocs, subscribeMobLocations };
