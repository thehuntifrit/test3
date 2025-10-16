import { currentFilter, saveFilterState } from "./dataManager.js";
import { renderMobCards } from "./uiRender.js";

const DOM = {
  modal: document.getElementById("mob-modal"),
  modalClose: document.getElementById("modal-close"),
  filterRank: document.getElementById("filter-rank"),
  filterName: document.getElementById("filter-name")
};

function openModal(mob) {
  DOM.modal.classList.remove("hidden");
  DOM.modal.querySelector(".modal-title").textContent = mob.Name;
}
function closeModal() {
  DOM.modal.classList.add("hidden");
}

function attachEventListeners() {
  DOM.modalClose.addEventListener("click", closeModal);

  DOM.filterRank.addEventListener("change", e => {
    currentFilter.rank = e.target.value;
    saveFilterState();
    renderMobCards();
  });

  DOM.filterName.addEventListener("input", e => {
    currentFilter.name = e.target.value;
    saveFilterState();
    renderMobCards();
  });
}

export { openModal, closeModal, attachEventListeners };
