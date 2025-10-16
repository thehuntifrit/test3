import { globalMobData, currentFilter, saveFilterState } from "./dataManager.js";
import { calculateRepop } from "./cal.js";

const DOM = {
  container: document.getElementById("master-mob-container"),
  status: document.getElementById("status-message"),
  filterRank: document.getElementById("filter-rank"),
  filterName: document.getElementById("filter-name")
};

function displayStatus(message, type = "info") {
  DOM.status.textContent = message;
  DOM.status.className = `status ${type}`;
}

function renderMobCards() {
  DOM.container.innerHTML = "";
  globalMobData.forEach(mob => {
    mob.repopInfo = calculateRepop(mob);
    const card = document.createElement("div");
    card.className = "mob-card";
    card.textContent = `${mob.Name} - ${mob.repopInfo.status}`;
    DOM.container.appendChild(card);
  });
}

function attachEventListeners() {
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

export { displayStatus, renderMobCards, attachEventListeners };
