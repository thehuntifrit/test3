// modal.js
import { toJstAdjustedIsoString } from "./utils.js";
import { getMobByNo } from "./store.js";

const MODAL = {
  reportModal: document.getElementById("report-modal"),
  reportForm: document.getElementById("report-form"),
  modalMobName: document.getElementById("modal-mob-name"),
  modalStatus: document.getElementById("modal-status"),
  modalTimeInput: document.getElementById("report-datetime"),
  modalMemoInput: document.getElementById("report-memo"),
  cancelBtn: document.getElementById("cancel-report"),
};

function openReportModal(mobNo) {
  const mob = getMobByNo(mobNo);
  if (!mob) return;
  const isoString = toJstAdjustedIsoString(new Date());
  MODAL.reportForm.dataset.mobNo = mobNo;
  MODAL.modalMobName.textContent = `対象: ${mob.Name} (${mob.Area})`;
  MODAL.modalTimeInput.value = isoString;
  MODAL.modalMemoInput.value = mob.last_kill_memo || "";
  MODAL.modalMemoInput.placeholder = `LKTとして記録されます。例: ${mob.Area} (X:00.0, Y:00.0) // ログアウトします`;
  MODAL.modalStatus.textContent = "";
  MODAL.reportModal.classList.remove("hidden");
  MODAL.reportModal.classList.add("flex");
}

function closeReportModal() {
  MODAL.reportModal.classList.add("hidden");
  MODAL.reportModal.classList.remove("flex");
}

export { MODAL, openReportModal, closeReportModal };
