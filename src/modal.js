// modal.js

import { DOM } from "./uiRender.js"; 
import { displayStatus } from "./uiRender.js"; 
import { getState } from "./dataManager.js";
import { toJstAdjustedIsoString } from "./cal.js"; // JST時刻調整は cal.js に移すことが望ましい

function toLocalIsoString(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// モーダルを開く (責務: openReportModal)
function openReportModal(mobNo) {
  const mob = getState().mobs.find(m => m.No === mobNo);
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

// モーダルを閉じる (責務: closeReportModal)
function closeReportModal() {
  DOM.reportModal.classList.add("hidden");
  DOM.modalTimeInput.value = "";
  DOM.modalMemoInput.value = "";
}

// DOMElements (責務: uiRender.js の DOM と重複するため、要検討)
const DOMElements = {
  reportSubmitBtn: document.getElementById("report-submit"),
  reportModal: document.getElementById("report-modal"),
  reportTimeInput: document.getElementById("report-time"),
  reportMemoInput: document.getElementById("report-memo"),
  mobList: document.getElementById("mob-list")
};

// submitReport は server.js に移動するため export から削除

// 注意: handleModalSubmit はまだ提供されていません。

export { openReportModal, closeReportModal, toJstAdjustedIsoString, DOMElements };
