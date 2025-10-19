// modal.js
import { submitReport } from "./server.js";
import { DOM } from "./uiRender.js";

// モーダルを開く
function openReportModal(mobNo) {
  if (!DOM.reportModal) return;
  DOM.reportModal.classList.remove("hidden");
  DOM.reportForm.dataset.mobNo = mobNo;
  DOM.modalStatus.textContent = "";
}

// モーダルを閉じる
function closeReportModal() {
  if (!DOM.reportModal) return;
  DOM.reportModal.classList.add("hidden");
  DOM.reportForm.reset();
  DOM.modalStatus.textContent = "";
}

// モーダル送信処理
function handleModalSubmit(e) {
  e.preventDefault();
  const mobNo = parseInt(DOM.reportForm.dataset.mobNo, 10);
  const datetime = DOM.modalTimeInput.value;
  const memo = DOM.modalMemoInput.value;

  submitReport(mobNo, datetime, memo)
    .then(() => {
      closeReportModal();
    })
    .catch(err => {
      console.error("報告送信エラー:", err);
      DOM.modalStatus.textContent = "送信エラー: " + (err.message || "通信失敗");
    });
}

// イベント登録
function attachModalEvents() {
  if (!DOM.reportForm) return;
  DOM.reportForm.addEventListener("submit", handleModalSubmit);

  const cancelBtn = document.getElementById("cancel-report");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeReportModal);
  }
}

export {
  openReportModal,
  closeReportModal,
  handleModalSubmit,
  attachModalEvents
};
