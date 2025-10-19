// modal.js

import { DOM } from "./uiShared.js";
import { getState, getMobByNo } from "./store.js";
import { toJstAdjustedIsoString, displayStatus } from "./utils.js";
import { submitReport } from "./server.js";

function openReportModal(mobNo) {
  const mob = getMobByNo(mobNo);
  if (!mob) {
    displayStatus("モブ情報が見つかりません。", "error");
    return;
  }

  DOM.modalMobName.textContent = mob.Name;
  DOM.modalTimeInput.value = toJstAdjustedIsoString(new Date());
  DOM.modalMemoInput.value = "";
  DOM.modalStatus.textContent = "";
  DOM.reportModal.classList.remove("hidden");
  DOM.reportModal.dataset.mobNo = mobNo;
}

function closeReportModal() {
  DOM.reportModal.classList.add("hidden");
  DOM.reportModal.dataset.mobNo = "";
}

function handleReportButtonClick(event) {
  const btn = event.target.closest("button[data-report-type]");
  if (!btn) return;

  const mobNo = parseInt(btn.dataset.mobNo, 10);
  const type = btn.dataset.reportType;

  if (type === "instant") {
    handleModalSubmit({ mobNo, isInstant: true });
  } else {
    openReportModal(mobNo);
  }
}

async function handleModalSubmit({ mobNo = null, isInstant = false } = {}) {
  const state = getState();
  const mobId = mobNo ?? parseInt(DOM.reportModal.dataset.mobNo, 10);
  const mob = getMobByNo(mobId);
  const userId = state.userId;

  if (!mob || !userId) {
    displayStatus("報告に必要な情報が不足しています。", "error");
    return;
  }

  const timeISO = isInstant
    ? new Date().toISOString()
    : DOM.modalTimeInput.value;

  const memo = isInstant ? "" : DOM.modalMemoInput.value;

  DOM.modalStatus.textContent = "送信中...";
  displayStatus(`${mob.Name} 討伐報告中...`);

  try {
    await submitReport(mobId, timeISO, memo);
    closeReportModal();
    displayStatus("報告が完了しました。", "success");
  } catch (err) {
    console.error("報告送信エラー:", err);
    DOM.modalStatus.textContent = "送信エラー";
    displayStatus("報告送信に失敗しました。", "error");
  }
}

export {
  openReportModal,
  closeReportModal,
  handleReportButtonClick,
  handleModalSubmit
};
