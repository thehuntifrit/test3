// location.js

// 🚨 修正1: 依存関係を修正・整理
import { DOM } from "./uiRender.js";
import { toggleCrushStatus } from "./server.js";
import { getState, getMobByNo } from "./dataManager.js";

function handleCrushToggle(e) {
    const point = e.target.closest(".spawn-point");
    if (point && point.dataset.isInteractive === "true") {
      e.preventDefault();
      e.stopPropagation();
        const card = e.target.closest(".mob-card");
        if (!card) return true;
      const mobNo = parseInt(card.dataset.mobNo, 10);
      const locationId = point.dataset.locationId;
      const isCurrentlyCulled = point.dataset.isCulled === "true";
      toggleCrushStatus(mobNo, locationId, isCurrentlyCulled);
      return true;
    }
    return false;
}

/**
 * 湧き潰し状態に応じてUIを更新する
 * (drawSpawnPoint内で実行されるため、ここではロジック本体は不要と仮定)
 */
function updateCrushUI() {
    // UIの再描画が必要な際に外部から呼び出されるためのインターフェースとして残す
}

overlay.addEventListener("click", e => {
  const point = e.target.closest(".spawn-point");
  if (point && point.dataset.isInteractive === "true") {
    const mobNo = point.dataset.mobNo;
    const locationId = point.dataset.locationId;
    const isCurrentlyCulled = point.dataset.isCulled === "true";
    toggleCrushStatus(mobNo, locationId, isCurrentlyCulled);
  }
});

function drawSpawnPoint(mob) {
  const state = getState();
  const card = DOM.colContainer.querySelector(`.mob-card[data-mob-no="${mob.No}"]`);
  const overlay = card?.querySelector(".spawn-points-overlay");
  if (!overlay) return;

  overlay.innerHTML = ''; // クリア

  if (mob.spawn_locations) {
    Object.entries(mob.spawn_locations).forEach(([id, point]) => {
      const isCulled = point.culled_by.length > 0;
      const marker = document.createElement('div');
      marker.className = `spawn-point absolute w-3 h-3 rounded-full cursor-pointer transition-all ${isCulled ? 'bg-red-500' : 'bg-green-500'}`;
      marker.style.left = `${point.x}%`;
      marker.style.top = `${point.y}%`;
      marker.title = `湧き潰し: ${isCulled ? '済' : '未'}`;
      marker.dataset.mobNo = mob.No;
      marker.dataset.locationId = id;
      marker.dataset.isCulled = isCulled ? 'true' : 'false';
      marker.dataset.isInteractive = 'true';

      overlay.appendChild(marker);
    });
  }
}

export function attachLocationEvents() {
  const overlayContainers = document.querySelectorAll(".spawn-points-overlay");
  if (!overlayContainers.length) return;

  overlayContainers.forEach(overlay => {
    // hover は CSS に任せるので click のみ処理
    overlay.addEventListener("click", e => {
      const point = e.target.closest(".spawn-point");
      if (!point) return;

      // インタラクティブでなければ無視
      if (point.dataset.isInteractive !== "true") return;

      const mobNo = point.dataset.mobNo;
      const locationId = point.dataset.locationId;
      const isCurrentlyCulled = point.dataset.isCulled === "true";

      // Firebase 送信
      toggleCrushStatus(mobNo, locationId, isCurrentlyCulled);

      // UI 更新（潰し済みクラスの付け替え）
      point.dataset.isCulled = (!isCurrentlyCulled).toString();
      point.classList.toggle("spawn-point-culled", !isCurrentlyCulled);
      point.title = `湧き潰し: ${!isCurrentlyCulled ? "済" : "未"}`;
    });
  });
}

export { drawSpawnPoint, handleCrushToggle, updateCrushUI };
