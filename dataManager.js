// dataManager.js
import { displayStatus } from "./uiRender.js";
import { EXPANSION_MAP, getState, setUserId, setBaseMobData, setMobs } from "./store.js";
import { subscribeMobStatusDocs, subscribeMobLocations, submitReportDoc, toggleCrushCloudFunction } from "./firestore.js";
import { calculateRepop } from "./cal.js";

const MOB_DATA_URL = "./mob_data.json";
let unsubscribeListeners = [];
let progressUpdateInterval = null;

async function fetchBaseMobData() {
  try {
    const resp = await fetch(MOB_DATA_URL);
    if (!resp.ok) throw new Error("Mob data failed to load.");
    const data = await resp.json();
    const baseMobData = data.mobConfig.map(mob => ({
      ...mob,
      Expansion: EXPANSION_MAP[Math.floor(mob.No / 10000)] || "Unknown",
      REPOP_s: mob.REPOP,
      MAX_s: mob.MAX,
      last_kill_time: 0,
      prev_kill_time: 0,
      last_kill_memo: '',
      spawn_cull_status: {},
      related_mob_no: mob.Rank.startsWith('B') ? mob.RelatedMobNo : null
    }));
    setBaseMobData(baseMobData);
    setMobs([...baseMobData].map(m => ({ ...m, repopInfo: calculateRepop(m) })));
  } catch (e) {
    displayStatus("ベースモブデータのロードに失敗しました。", "error");
  }
}

function mergeMobStatusData(mobStatusDataMap) {
  const { mobs } = getState();
  const newData = new Map();
  Object.values(mobStatusDataMap).forEach(docData => {
    Object.entries(docData).forEach(([mobId, mobData]) => {
      const mobNo = parseInt(mobId, 10);
      newData.set(mobNo, {
        last_kill_time: mobData.last_kill_time?.seconds || 0,
        prev_kill_time: mobData.prev_kill_time?.seconds || 0,
        last_kill_memo: mobData.last_kill_memo || ''
      });
    });
  });
  const updated = mobs.map(mob => {
    const merged = { ...mob };
    if (newData.has(mob.No)) {
      const d = newData.get(mob.No);
      merged.last_kill_time = d.last_kill_time;
      merged.prev_kill_time = d.prev_kill_time;
      merged.last_kill_memo = d.last_kill_memo;
    }
    merged.repopInfo = calculateRepop(merged);
    return merged;
  });
  setMobs(updated);
}

function mergeMobLocationsData(locationsMap) {
  const { mobs } = getState();
  const updated = mobs.map(mob => {
    const merged = { ...mob };
    const dynamicData = locationsMap[mob.No];
    if (mob.Rank === 'S' && dynamicData) {
      merged.spawn_cull_status = dynamicData.points;
    }
    merged.repopInfo = calculateRepop(merged);
    return merged;
  });
  setMobs(updated);
}

function startRealtimeListeners() {
  clearInterval(progressUpdateInterval);
  unsubscribeListeners.forEach(u => u());
  unsubscribeListeners = [];

  const statusDocs = ['s_latest', 'a_latest', 'f_latest'];
  const mobStatusDataMap = {};
  const unsubStatus = subscribeMobStatusDocs(statusDocs, (docId, data) => {
    mobStatusDataMap[docId] = data;
    mergeMobStatusData(mobStatusDataMap);
    displayStatus("LKT/Memoデータ更新完了。", "success");
  }, () => displayStatus("MobStatus のリアルタイム同期エラー。", "error"));
  unsubscribeListeners.push(unsubStatus);

  const unsubLoc = subscribeMobLocations(locationsMap => {
    mergeMobLocationsData(locationsMap);
    displayStatus("湧き潰しデータ更新完了。", "success");
  }, () => displayStatus("MobLocations のリアルタイム同期エラー。", "error"));
  unsubscribeListeners.push(unsubLoc);

  progressUpdateInterval = setInterval(() => {
    // 描画済みカードのバー更新のみ（HTMLは uiRender が担当）
    // 既存動作維持のため updateProgressBars は uiEvents 側の resizeと合わせて利用
  }, 10000);
}

function setupAuthentication() {
  // 認証＋データロードの順序は現仕様を維持
  import("./firebase.js").then(({ auth, signInAnonymously, onAuthStateChanged }) => {
    onAuthStateChanged(auth, user => {
      if (user) {
        setUserId(user.uid);
        displayStatus(`ユーザー認証成功: ${user.uid.substring(0, 8)}...`, "success");
        if (getState().baseMobData.length > 0) {
          startRealtimeListeners();
        } else {
          fetchBaseMobData().then(() => startRealtimeListeners());
        }
      } else {
        signInAnonymously(auth).catch(error => {
          displayStatus(`認証エラー: ${error.message}`, "error");
        });
      }
    });
  });
}

async function submitReport(mobNo, timeISO, memo) {
  const { userId, mobs } = getState();
  if (!userId) {
    displayStatus("認証が完了していません。ページをリロードしてください。", "error");
    return;
  }
  const mob = mobs.find(m => m.No === mobNo);
  if (!mob) {
    displayStatus("モブデータが見つかりません。", "error");
    return;
  }
  const killTimeDate = new Date(timeISO);
  if (isNaN(killTimeDate)) {
    displayStatus("時刻形式が不正です。", "error");
    return;
  }
  const statusEl = document.getElementById("modal-status");
  if (statusEl) statusEl.textContent = "送信中...";
  displayStatus(`${mob.Name} 討伐時間報告中...`);
  try {
    await submitReportDoc({
      mob_id: mobNo.toString(),
      kill_time: killTimeDate,
      reporter_uid: userId,
      memo,
      repop_seconds: mob.REPOP_s
    });
    const { closeReportModal } = await import("./modal.js");
    closeReportModal();
    displayStatus("報告が完了しました。データ反映を待っています。", "success");
  } catch (error) {
    console.error("レポート送信エラー:", error);
    if (statusEl) statusEl.textContent = `送信エラー: ${error.message || "通信失敗"}`;
    displayStatus(`LKT報告エラー: ${error.message || "通信失敗"}`, "error");
  }
}

async function toggleCrushStatus(mobNo, locationId, isCurrentlyCulled) {
  const { userId, mobs } = getState();
  if (!userId) {
    displayStatus("認証が完了していません。", "error");
    return;
  }
  const action = isCurrentlyCulled ? 'uncrush' : 'crush';
  const mob = mobs.find(m => m.No === mobNo);
  if (!mob) return;
  displayStatus(`${mob.Name} (${locationId}) ${action === 'crush' ? '湧き潰し' : '解除'}報告中...`);
  try {
    const result = await toggleCrushCloudFunction({
      mob_id: mobNo.toString(),
      point_id: locationId,
      type: action === 'crush' ? 'add' : 'remove',
      userId
    });
    if (result.data?.success) {
      displayStatus(`${mob.Name} の状態を更新しました。`, "success");
    } else {
      displayStatus(`更新失敗: ${result.data?.message || '不明なエラー'}`, "error");
    }
  } catch (error) {
    displayStatus(`湧き潰し報告エラー: ${error.message}`, "error");
  }
}

export { setupAuthentication, submitReport, toggleCrushStatus, fetchBaseMobData, startRealtimeListeners };
