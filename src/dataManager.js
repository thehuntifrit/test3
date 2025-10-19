// dataManager.js
// 状態管理・静的定義・初期ロード処理を集約

// ----------------------
// 静的定義
// ----------------------
const EXPANSION_MAP = { 
  1: "新生", 
  2: "蒼天", 
  3: "紅蓮", 
  4: "漆黒", 
  5: "暁月", 
  6: "黄金" 
};

const RANK_COLORS = {
  S: { bg: "bg-red-600", hover: "hover:bg-red-700", text: "text-red-600", hex: "#dc2626", label: "S" },
  A: { bg: "bg-yellow-600", hover: "hover:bg-yellow-700", text: "text-yellow-600", hex: "#ca8a04", label: "A" },
  F: { bg: "bg-indigo-600", hover: "hover:bg-indigo-700", text: "text-indigo-600", hex: "#4f46e5", label: "F" }
};

const PROGRESS_CLASSES = {
  P0_60: "progress-p0-60",
  P60_80: "progress-p60-80",
  P80_100: "progress-p80-100",
  TEXT_NEXT: "progress-next-text",
  TEXT_POP: "progress-pop-text",
  MAX_OVER_BLINK: "progress-max-over-blink"
};

const FILTER_TO_DATA_RANK_MAP = { FATE: "F", ALL: "ALL", S: "S", A: "A" };

// ----------------------
// 状態管理
// ----------------------
const state = {
  userId: localStorage.getItem("user_uuid") || null,
  baseMobData: [],
  mobs: [],
  filter: JSON.parse(localStorage.getItem("huntFilterState")) || {
    rank: "ALL",
    areaSets: {
      S: new Set(),
      A: new Set(),
      F: new Set(),
      ALL: new Set()
    }
  },
  openMobCardNo: localStorage.getItem("openMobCardNo")
    ? parseInt(localStorage.getItem("openMobCardNo"), 10)
    : null
};

// Set 復元処理
for (const k in state.filter.areaSets) {
  const v = state.filter.areaSets[k];
  if (Array.isArray(v)) state.filter.areaSets[k] = new Set(v);
  else if (!(v instanceof Set)) state.filter.areaSets[k] = new Set();
}

// Getter
const getState = () => state;
const getMobByNo = no => state.mobs.find(m => m.No === no);

// Setter
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

// ----------------------
// 初期ロード処理
// ----------------------
const MOB_DATA_URL = "./mob_data.json";

async function loadBaseMobData() {
  const resp = await fetch(MOB_DATA_URL);
  if (!resp.ok) throw new Error("Mob data failed to load.");
  const data = await resp.json();

  const baseMobData = Object.entries(data.mobs).map(([no, mob]) => ({
    No: parseInt(no, 10),
    Rank: mob.rank,
    Name: mob.name,
    Area: mob.area,
    Condition: mob.condition,
    Expansion: EXPANSION_MAP[Math.floor(no / 10000)] || "Unknown",
    REPOP_s: mob.repopSeconds,
    MAX_s: mob.maxRepopSeconds,
    Map: mob.mapImage,
    spawn_points: mob.locations,
    last_kill_time: 0,
    prev_kill_time: 0,
    last_kill_memo: "",
    spawn_cull_status: {},
    related_mob_no: mob.rank.startsWith("B") ? mob.relatedMobNo : null
  }));

  setBaseMobData(baseMobData);
  setMobs([...baseMobData]);
}

// ----------------------
// テキスト処理
// ----------------------
function processText(text) {
  if (typeof text !== "string" || !text) return "";
  return text.replace(/\/\//g, "<br>");
}

// ----------------------
// エクスポート
// ----------------------
export {
  // 静的定義
  EXPANSION_MAP,
  RANK_COLORS,
  PROGRESS_CLASSES,
  FILTER_TO_DATA_RANK_MAP,
  // 状態管理
  state,
  getState,
  getMobByNo,
  setUserId,
  setBaseMobData,
  setMobs,
  setFilter,
  setOpenMobCardNo,
  // 初期ロード
  loadBaseMobData,
  // テキスト処理
  processText
};
