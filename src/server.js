// server.js

// 必要な Firebase SDK をインポート (全機能を集約)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

// Firebase 設定
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBikwjGsjL_PVFhx3Vj-OeJCocKA_hQOgU",
  authDomain: "the-hunt-ifrit.firebaseapp.com",
  projectId: "the-hunt-ifrit",
  storageBucket: "the-hunt-ifrit.firebasestorage.app",
  messagingSenderId: "285578581189",
  appId: "1:285578581189:web:4d9826ee3f988a7519ccac"
};

// Firebase アプリの初期化
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);
// Cloud Functions のインスタンスを取得 (リージョン指定もそのまま利用)
const functionsInstance = getFunctions(app, "asia-northeast2");
const analytics = getAnalytics(app);

// Cloud Functions の呼び出し可能インスタンス
const callUpdateCrushStatus = httpsCallable(functionsInstance, 'crushStatusUpdater');
const callRevertStatus = httpsCallable(functionsInstance, 'revertStatus');
const callGetServerTime = httpsCallable(functionsInstance, 'getServerTime'); // 新たに追加

// ----------------------------------------------------
// Firebase / 認証
// ----------------------------------------------------

async function initializeAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        // 匿名認証でサインインを試みる
        signInAnonymously(auth).catch(() => {}).then(() => {});
      }
    });
  });
}

// ----------------------------------------------------
// ✅ サーバー時間取得と修正 (getServerTimeUTC)
// ----------------------------------------------------

// Cloud Functions 経由で Google の正確なサーバー時間を取得する
export async function getServerTimeUTC() {
    try {
        const result = await callGetServerTime();
        // Cloud Function が返すサーバー時刻 (UNIXミリ秒) を返す
        return result.data.serverTimeMs;
    } catch (error) {
        console.error("Error fetching server time from Cloud Functions:", error);
        // エラー発生時はフォールバックとしてローカル時間を返す (非推奨だが、処理継続のため)
        // 報告は続行できるが、時間補正は行われない
        return Date.now(); 
    }
}


// ----------------------------------------------------
// Firestore 購読
// ----------------------------------------------------

export function subscribeMobStatusDocs(onUpdate) {
  const docIds = ["s_latest", "a_latest", "f_latest"];
  const mobStatusDataMap = {};
  const unsubs = docIds.map(id =>
    onSnapshot(doc(db, "mob_status", id), snap => {
      const data = snap = snap.data();
      if (data) mobStatusDataMap[id] = data;
      onUpdate(mobStatusDataMap);
    })
  );
  return () => unsubs.forEach(u => u());
}

export function subscribeMobLocations(onUpdate) {
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

// ----------------------------------------------------
// データ操作: 討伐報告 (submitReport) - ✅ kill_time 修正適用
// ----------------------------------------------------

// submitReport は他のファイルから getState, displayStatus, closeReportModal が必要
// (ここでは import は行わず、呼び出し元で渡すか、グローバルに存在する前提とする)

/**
 * 討伐報告をデータベースに送信する。
 * @param {number} mobNo - モブ番号
 * @param {string} timeISO - ユーザーが入力した報告時刻 (ここでは使用しないが引数として残す)
 * @param {string} memo - メモ
 * @param {function} getState - dataManager.js からの状態取得関数
 * @param {function} displayStatus - uiRender.js からのステータス表示関数
 * @param {function} closeReportModal - modal.js からのモーダルを閉じる関数
 */
export const submitReport = async (mobNo, timeISO, memo, getState, displayStatus, closeReportModal) => {
  const state = getState();
  const userId = state.userId;
  const mobs = state.mobs;

  if (!userId) {
    displayStatus("認証が完了していません。ページをリロードしてください。", "error");
    return;
  }

  const mob = mobs.find(m => m.No === mobNo);
  if (!mob) {
    displayStatus("モブデータが見つかりません。", "error");
    return;
  }

  // timeISO のチェックを簡略化 (サーバー時間を使うため)
  // const killTimeDate = new Date(timeISO); 
  
  const modalStatusEl = document.querySelector("#modal-status");
  if (modalStatusEl) {
    modalStatusEl.textContent = "送信中...";
  }
  displayStatus(`${mob.Name} 討伐時間報告中...`);

  try {
    // ----------------------------------------------------
    // 🚨 修正点: kill_time を getServerTimeUTC の結果で生成する
    // ----------------------------------------------------
    const serverTimeMs = await getServerTimeUTC(); // Cloud Functions経由で正確な時間を取得
    const killTimeDate = new Date(serverTimeMs); // サーバーの正確な時刻でDateオブジェクトを生成
    
    await addDoc(collection(db, "reports"), {
      mob_id: mobNo.toString(),
      // kill_time にはサーバーと同期した正確な時間が登録される
      kill_time: killTimeDate, 
      reporter_uid: userId,
      memo: memo,
      repop_seconds: mob.REPOP_s
    });

    closeReportModal();
    displayStatus("報告が完了しました。データ反映を待っています。", "success");
  } catch (error) {
    console.error("レポート送信エラー:", error);
    if (modalStatusEl) {
      modalStatusEl.textContent = "送信エラー: " + (error.message || "通信失敗");
    }
    displayStatus(`LKT報告エラー: ${error.message || "通信失敗"}`, "error");
  }
};

// ----------------------------------------------------
// データ操作: 湧き潰し報告 (toggleCrushStatus)
// ----------------------------------------------------

/**
 * 湧き潰し状態を更新する。
 * @param {number} mobNo - モブ番号
 * @param {string} locationId - スポーン地点ID
 * @param {boolean} isCurrentlyCulled - 現在潰されているか
 * @param {function} getState - dataManager.js からの状態取得関数
 * @param {function} displayStatus - uiRender.js からのステータス表示関数
 */
export const toggleCrushStatus = async (mobNo, locationId, isCurrentlyCulled, getState, displayStatus) => {
  const state = getState();
  const userId = state.userId;
  const mobs = state.mobs;

  if (!userId) {
    displayStatus("認証が完了していません。", "error");
    return;
  }

  const action = isCurrentlyCulled ? "uncrush" : "crush";
  const mob = mobs.find(m => m.No === mobNo);
  if (!mob) return;

  displayStatus(
    `${mob.Name} (${locationId}) ${action === "crush" ? "湧き潰し" : "解除"}報告中...`
  );

  try {
    const result = await callUpdateCrushStatus({
      mob_id: mobNo.toString(),
      point_id: locationId,
      type: action === "crush" ? "add" : "remove",
      userId: userId
    });

    if (result.data?.success) {
      displayStatus(`${mob.Name} の状態を更新しました。`, "success");
    } else {
      displayStatus(
        `更新失敗: ${result.data?.message || "不明なエラー"}`,
        "error"
      );
    }
  } catch (error) {
    displayStatus(`湧き潰し報告エラー: ${error.message}`, "error");
  }
};

// ----------------------------------------------------
// データ操作: 巻き戻し (revertMobStatus)
// ----------------------------------------------------

/**
 * モブの状態を巻き戻す。
 * @param {number} mobNo - モブ番号
 * @param {function} getState - dataManager.js からの状態取得関数
 * @param {function} displayStatus - uiRender.js からのステータス表示関数
 */
export const revertMobStatus = async (mobNo, getState, displayStatus) => {
  const state = getState();
  const userId = state.userId;
  const mobs = state.mobs;

  if (!userId) {
    displayStatus("認証が完了していません。ページをリロードしてください。", "error");
    return;
  }

  const mob = mobs.find(m => m.No === mobNo);
  if (!mob) return;

  displayStatus(`${mob.Name} の状態を巻き戻し中...`, "warning");

  try {
    const result = await callRevertStatus({
      mob_id: mobNo.toString(),
    });
    
    if (result.data?.success) {
      displayStatus(`${mob.Name} の状態を直前のログへ巻き戻しました。`, "success");
    } else {
      displayStatus(
        `巻き戻し失敗: ${result.data?.message || "ログデータが見つからないか、巻き戻しに失敗しました。"}`,
        "error"
      );
    }
  } catch (error) {
    console.error("巻き戻しエラー:", error);
    displayStatus(`巻き戻しエラー: ${error.message}`, "error");
  }
};


// 必要なエクスポート (Firebase初期化と操作関数)
export { initializeAuth, db, auth, functionsInstance }; // 他のファイルでの利用を想定
