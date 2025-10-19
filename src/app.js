// app.js
import { setupApp } from "./dataManager.js";
import { attachModalEvents } from "./modal.js";
import { attachLocationEvents } from "./location.js";
import { attachFilterEvents } from "./uiRender.js";
import { DOM } from "./uiRender.js";

function attachEventListeners() {
  attachModalEvents();
  attachLocationEvents(DOM);
  attachFilterEvents(DOM);
}

document.addEventListener("DOMContentLoaded", () => {
  attachEventListeners();

  // 初期タブの clickCount 整備（localStorage 復元に合わせる）
  DOM.rankTabs.querySelectorAll(".tab-button").forEach(btn => {
    const currentRank =
      JSON.parse(localStorage.getItem("huntFilterState"))?.rank || "ALL";
    btn.dataset.clickCount = btn.dataset.rank === currentRank ? "1" : "0";
  });

  setupApp();
});
