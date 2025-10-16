import { globalMobData } from "./dataManager.js";
import { calculateRepop } from "./cal.js";

const DOM = {
  container: document.getElementById("master-mob-container"),
  status: document.getElementById("status-message")
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

export { displayStatus, renderMobCards, DOM };
