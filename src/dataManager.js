// dataManager.js

// 🚨 修正1 (パス修正): 外部依存関係のインポート
import { filterAndRender, updateProgressBars, displayStatus } from "./uiRender.js";
import { subscribeMobStatusDocs, subscribeMobLocations, initializeAuth } from "./server.js";

// ----------------------------------------------------
// 🔴 store.js からの統合 (文言変更なし)
// ----------------------------------------------------

const EXPANSION_MAP = { 1: "新生", 2: "蒼天", 3: "紅蓮", 4: "漆黒", 5: "暁月", 6: "黄金" };

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

// Set復元
for (const k in state.filter.areaSets) {
  const v = state.filter.areaSets[k];
  if (Array.isArray(v)) state.filter.areaSets[k] = new Set(v);
  else if (!(v instanceof Set)) state.filter.areaSets[k] = new Set();
}

const getState = () => state;
const getMobByNo = no => state.mobs.find(m => m.No === no);

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

// ----------------------------------------------------
// 🔴 uiShared.js からの統合予定地（静的定義）
// ----------------------------------------------------

// 🚨 不足部品: 静的定義のコード断片が未提示のため、仮定義で続行
const RANK_COLORS = {
  S: "rank-s",
  A: "rank-a",
  B: "rank-b",
  F: "rank-f",
}; // 仮定義
const PROGRESS_CLASSES = {
  high: "progress-high",
  medium: "progress-medium",
  low: "progress-low",
}; // 仮定義
const FILTER_TO_DATA_RANK_MAP = {
  ALL: ["S", "A", "B", "F"],
  S: ["S"],
  A: ["A"],
  B: ["B"],
  F: ["F"],
}; // 仮定義

// ----------------------------------------------------
// 🔴 utils.js からの統合 (processText) (文言変更なし)
// ----------------------------------------------------

function processText(text) {
  if (typeof text !== "string" || !text) return "";
  return text.replace(/\/\//g, "<br>");
}

// ----------------------------------------------------
// 🔴 dataManager.js 本体からの統合 (文言変更なし)
// ----------------------------------------------------

const MOB_DATA_URL = "./mob_data.json";
let progressInterval = null;
let unsubscribes = [];

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
  filterAndRender({ isInitialLoad: true });
}

function startRealtime() {
  // Clear previous
  if (progressInterval) clearInterval(progressInterval);
  unsubscribes.forEach(fn => fn && fn());
  unsubscribes = [];

  // Subscribe mob_status docs
  const unsubStatus = subscribeMobStatusDocs(mobStatusDataMap => {
    const current = getState().mobs;
    const map = new Map();
    Object.values(mobStatusDataMap).forEach(docData => {
      Object.entries(docData).forEach(([mobId, mobData]) => {
        const mobNo = parseInt(mobId, 10);
        map.set(mobNo, {
          last_kill_time: mobData.last_kill_time?.seconds || 0,
          prev_kill_time: mobData.prev_kill_time?.seconds || 0,
          last_kill_memo: mobData.last_kill_memo || ""
        });
      });
    });
    const merged = current.map(m => {
      const dyn = map.get(m.No);
      return dyn ? { ...m, ...dyn } : m;
    });
    setMobs(merged);
    filterAndRender();
    displayStatus("LKT/Memoデータ更新完了。", "success");
  });
  unsubscribes.push(unsubStatus);

  // Subscribe mob_locations
  const unsubLoc = subscribeMobLocations(locationsMap => {
    const current = getState().mobs;
    const merged = current.map(m => {
      const dyn = locationsMap[m.No];
      if (m.Rank === "S" && dyn) {
        return { ...m, spawn_cull_status: dyn.points || {} };
      }
      return m;
    });
    setMobs(merged);
    filterAndRender();
    displayStatus("湧き潰しデータ更新完了。", "success");
  });
  unsubscribes.push(unsubLoc);

  progressInterval = setInterval(updateProgressBars, 10000);
}

async function setupApp() {
  displayStatus("アプリを初期化中...", "loading");
  await loadBaseMobData();
  const uid = await initializeAuth();
  setUserId(uid);
  startRealtime();
}

// 🚨 修正1: 全てのエクスポートを整理
export { setupApp, EXPANSION_MAP, getState, getMobByNo, setUserId, setBaseMobData, setMobs, setFilter, 
        setOpenMobCardNo, RANK_COLORS, PROGRESS_CLASSES, FILTER_TO_DATA_RANK_MAP, loadBaseMobData, processText };
