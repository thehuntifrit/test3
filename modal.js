// modal.js
const DOM = {
  modal: document.getElementById("mob-modal"),
  modalTitle: document.querySelector("#mob-modal .modal-title"),
  modalContent: document.querySelector("#mob-modal .modal-content"),
  modalClose: document.getElementById("modal-close")
};

// 開く
function openModal(mob) {
  if (!DOM.modal) return;
  DOM.modal.classList.remove("hidden");
  if (DOM.modalTitle) DOM.modalTitle.textContent = mob.Name;
  if (DOM.modalContent) {
    DOM.modalContent.innerHTML = `
      <p>ランク: ${mob.Rank}</p>
      <p>エリア: ${mob.Expansion}</p>
      <p>状態: ${mob.repopInfo?.status || "不明"}</p>
    `;
  }
}

// 閉じる
function closeModal() {
  if (!DOM.modal) return;
  DOM.modal.classList.add("hidden");
}

// 初期化（閉じるボタンにイベント付与）
function initModal() {
  if (DOM.modalClose) {
    DOM.modalClose.addEventListener("click", closeModal);
  }
}

export { openModal, closeModal, initModal };
