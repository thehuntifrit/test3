// dataManager.js
import { fetchAllMobStatus, saveMobStatus, subscribeMobStatus } from "./firestore.js";
import { calculateRepop } from "./cal.js";
import { getState, setMobs } from "./store.js";

async function loadMobStatus() {
  const mobStatusData = await fetchAllMobStatus();
  mergeMobStatusData(mobStatusData);
}

function mergeMobStatusData(mobStatusDataMap) {
  const state = getState();
  const updated = state.mobs.map(mob => {
    const mobData = mobStatusDataMap[mob.No];
    if (mobData) {
      mob = { ...mob, ...mobData };
    }
    mob.repopInfo = calculateRepop(mob);
    return mob;
  });
  setMobs(updated);
}

function reportMobKill(mobId, statusObj) {
  return saveMobStatus(mobId, statusObj);
}

function subscribeMobUpdates() {
  return subscribeMobStatus(data => mergeMobStatusData(data));
}

export { loadMobStatus, reportMobKill, subscribeMobUpdates };
