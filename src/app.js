// app.js
import { initializeAuth, subscribeMobStatusDocs, subscribeMobLocations } from "./server.js";
import { loadBaseMobData, setMobs, getState } from "./dataManager.js";
import { filterAndRender, updateProgressBars } from "./uiRender.js";
import { attachModalEvents } from "./modal.js";
import { attachLocationEvents } from "./location.js";
import { attachFilterEvents } from "./filter.js";

async function setupApp() {
  // Firebase認証
  const userId = await initializeAuth();
  const state = getState();
  state.userId = userId;

  // モブデータ読み込み
  const baseMobs = await loadBaseMobData();
  setMobs(baseMobs);

  // Firestore購読
  subscribeMobStatusDocs((mobStatusDataMap) => {
    const state = getState();
    state.mobStatusDataMap = mobStatusDataMap;
    filterAndRender();
  });

  subscribeMobLocations((mobLocationsMap) => {
    const state = getState();
    state.mobLocationsMap = mobLocationsMap;
    filterAndRender();
  });

  // 初期描画
  filterAndRender({ isInitialLoad: true });

  // プログレスバー定期更新
  setInterval(updateProgressBars, 60 * 1000);
}

function attachEventListeners() {
  attachModalEvents();
  attachLocationEvents();
  attachFilterEvents();
}

document.addEventListener("DOMContentLoaded", async () => {
  await setupApp();
  attachEventListeners();
});
