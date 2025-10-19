// server.js

// 🔐 Firebase初期化・認証
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

// 🔄 Firestore送受信
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

// ⏱️ Cloud Function呼び出し
import { getFunctions, httpsCallable } from "firebase/functions";

// ✅ 初期化
export function initializeFirebase() {
  const firebaseConfig = { /* your config */ };
  initializeApp(firebaseConfig);
}

export function initializeAuth() {
  const auth = getAuth();
  signInAnonymously(auth);
}

// ✅ サーバー時刻取得
export async function getServerTimeUTC() {
  const functions = getFunctions();
  const getServerTime = httpsCallable(functions, "getServerTime");
  const response = await getServerTime();
  return new Date(response.data.utc_now); // UTC基準
}

// ✅ 報告送信（kill_time はサーバー時刻基準）
export async function submitReport(mobNo, memo, userId, mob) {
  const killTimeDate = await getServerTimeUTC();

  await addDoc(collection(getFirestore(), "reports"), {
    mob_id: mobNo.toString(),
    kill_time: killTimeDate,
    reporter_uid: userId,
    memo: memo,
    repop_seconds: mob.REPOP_s
  });
}

// ✅ 湧き潰し切り替え
export async function toggleCrushStatus(mobNo, locationId, isCurrentlyCulled) {
  const docRef = doc(getFirestore(), "locations", `${mobNo}_${locationId}`);
  await updateDoc(docRef, { is_culled: !isCurrentlyCulled });
}

// ✅ 巻き戻し処理
export async function revertMobStatus(mobNo) {
  const docRef = doc(getFirestore(), "reports", mobNo.toString());
  await updateDoc(docRef, { kill_time: null, memo: "", repop_seconds: null });
}

// ✅ 購読系
export function subscribeMobStatusDocs(onUpdate) {
  const colRef = collection(getFirestore(), "reports");
  return onSnapshot(colRef, onUpdate);
}

export function subscribeMobLocations(onUpdate) {
  const colRef = collection(getFirestore(), "locations");
  return onSnapshot(colRef, onUpdate);
}
