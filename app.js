import { fetchBaseMobData } from "./dataManager.js";
import { displayStatus, renderMobCards } from "./uiRender.js";
import { attachEventListeners } from "./uiEvents.js";

document.addEventListener("DOMContentLoaded", async () => {
  displayStatus("データ読み込み中...");
  await fetchBaseMobData("./mob_data.json");
  renderMobCards();
  attachEventListeners();
  displayStatus("準備完了", "success");
});
