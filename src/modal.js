// modal.js

// 🚨 修正1: 依存関係を修正・整理
import { DOM } from "./uiRender.js"; 
import { getState, getMobByNo } from "./dataManager.js";
import { toJstAdjustedIsoString, formatLastKillTime } from "./cal.js"; // 既にcal.jsに移動済み
import { submitReport } from "./server.js"; // 🚨 修正2: submitReportをserver.jsからインポート
import { displayStatus } from "./uiRender.js";

// ----------------------------------------------------
// 🔴 modal.js 本体からの統合 (文言変更なし & 修正)
// ----------------------------------------------------

// LKT報告時刻入力欄の書式（JST補正なし）
function toLocalIsoString(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// モーダルを開く
function openReportModal(mobNo) {
  // 🚨 修正3: mobの取得をgetMobByNoに変更（stateはdataManagerからインポートすべきではないため）
  const mob = getMobByNo(mobNo);
  if (!mob) return;

  const iso = toLocalIsoString(new Date()); // JST補正ではなくローカル時刻をそのまま
  DOM.reportForm.dataset.mobNo = String(mobNo);
  DOM.modalMobName.textContent = `対象: ${mob.Name} (${mob.Area})`;
  DOM.modalTimeInput.value = iso;
  DOM.modalMemoInput.value = mob.last_kill_memo || "";
  DOM.modalMemoInput.placeholder = `任意`;
  DOM.modalStatus.textContent = "";
  DOM.reportModal.classList.remove("hidden");
  DOM.reportModal.classList.add("flex");
}

// モーダルを閉じる
function closeReportModal() {
  DOM.reportModal.classList.add("hidden");
  DOM.modalTimeInput.value = "";
  DOM.modalMemoInput.value = "";
}

/**
 * モーダルからの報告フォーム送信を処理する
 * @param {Event} e 
 */
function handleModalSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const mobNo = parseInt(form.dataset.mobNo, 10);
  const timeISO = DOM.modalTimeInput.value;
  const memo = DOM.modalMemoInput.value.trim();

  // server.jsのsubmitReport関数を呼び出す
  submitReport({ mobNo, timeISO, memo });
}


// イベントリスナーをアタッチ
function attachModalEvents() {
    DOM.reportForm.addEventListener('submit', handleModalSubmit);
    // モーダル閉じるボタンのイベントアタッチ（ここでは便宜上、DOM.reportModal内の閉じる要素にアタッチ）
    DOM.reportModal.querySelector('[data-modal-close]').addEventListener('click', closeReportModal);
    // モーダル外側クリックで閉じる
    DOM.reportModal.addEventListener('click', (e) => {
        if (e.target === DOM.reportModal) {
            closeReportModal();
        }
    });
}


// ----------------------------------------------------
// 🚨 修正4: submitReport関数をserver.jsへ移動するため、コメントアウト
// ----------------------------------------------------
/*
async function submitReport(mobNo, timeISO, memo) {
  // ... (ロジックは server.jsへ移動)
}
*/

// ----------------------------------------------------
// 🚨 修正5: エクスポートを仕様に合わせて整理
// ----------------------------------------------------
export { openReportModal, closeReportModal, handleModalSubmit, attachModalEvents };
