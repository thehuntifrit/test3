// store.js
const EXPANSION_MAP = { 1: "新生", 2: "蒼天", 3: "紅蓮", 4: "漆黒", 5: "暁月", 6: "黄金" };

const state = {
  userId: localStorage.getItem("user_uuid") || null,
  baseMobData: [],
  mobs: [],
  filter: JSON.parse(localStorage.getItem("huntFilterState")) || { rank: "ALL", areaSets: { ALL: new Set() } },
  openMobCardNo: localStorage.getItem("openMobCardNo") ? parseInt(localStorage.getItem("openMobCardNo"), 10) : null
};

// Set 復元
for (const k in state.filter.areaSets) {
  const v = state.filter.areaSets[k];
  if (Array.isArray(v)) state.filter.areaSets[k] = new Set(v);
  else if (!(v instanceof Set)) state.filter.areaSets[k] = new Set();
}

// getters
const getState = () => state;
const getMobByNo = mobNo => state.mobs.find(m => m.No === mobNo);

// setters
function setUserId(uid) {
  state.userId = uid;
  localStorage.setItem("user_uuid", uid);
}
function setBaseMobData(data) {
  state.baseMobData = data;
}
function setMobs(data) {
  state.mobs = data;
}
function setFilter(partial) {
  state.filter = { ...state.filter, ...partial };
  const serialized = {
    ...state.filter,
    areaSets: Object.keys(state.filter.areaSets).reduce((acc, key) => {
      const v = state.filter.areaSets[key];
      acc[key] = v instanceof Set ? Array.from(v) : v;
      return acc;
    }, {})
  };
  localStorage.setItem("huntFilterState", JSON.stringify(serialized));
}
function setOpenMobCardNo(no) {
  state.openMobCardNo = no;
  localStorage.setItem("openMobCardNo", no ?? "");
}

export {
  EXPANSION_MAP,
  getState, getMobByNo,
  setUserId, setBaseMobData, setMobs, setFilter, setOpenMobCardNo
};
