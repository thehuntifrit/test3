import { calculateRepop } from "./cal.js";

let baseMobData = [];
let globalMobData = [];
let currentFilter = { rank: "ALL", name: "", areaSets: {} };

async function fetchBaseMobData(url) {
  const response = await fetch(url);
  const data = await response.json();
  baseMobData = data.mobConfig;
  globalMobData = baseMobData.map(mob => ({
    ...mob,
    last_kill_time: 0,
    prev_kill_time: 0,
    last_kill_memo: "",
    spawn_cull_status: {}
  }));
  return globalMobData;
}

function mergeMobStatusData(mobStatusDataMap) {
  const newData = new Map();
  Object.values(mobStatusDataMap).forEach(docData => {
    Object.entries(docData).forEach(([mobId, mobData]) => {
      newData.set(parseInt(mobId), {
        last_kill_time: mobData.last_kill_time?.seconds || 0,
        prev_kill_time: mobData.prev_kill_time?.seconds || 0,
        last_kill_memo: mobData.last_kill_memo || ""
      });
    });
  });
  globalMobData = globalMobData.map(mob => {
    let merged = { ...mob, ...newData.get(mob.No) };
    merged.repopInfo = calculateRepop(merged);
    return merged;
  });
  return globalMobData;
}

function saveFilterState() {
  localStorage.setItem("filter_rank", currentFilter.rank);
  localStorage.setItem("filter_name", currentFilter.name);
  localStorage.setItem("filter_area_sets", JSON.stringify(currentFilter.areaSets));
}

export { fetchBaseMobData, mergeMobStatusData, saveFilterState, globalMobData, currentFilter };
