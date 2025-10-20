// location.js

// 🚨 修正1 (パス修正): 依存関係を修正・整理
import { DOM } from "./uiRender.js";
import { toggleCrushStatus } from "./server.js";
import { getState, getMobByNo } from "./dataManager.js";

// ----------------------------------------------------
// 🔴 uiEvents.js からの統合 (湧き潰しロジック)
// ----------------------------------------------------

/**
 * モブカード内の湧き潰しボタンクリックを処理する（DOM.colContainerのデリゲーション内で処理）
 * @param {Event} e
 * @returns {boolean} 湧き潰しトグルイベントが処理されたかどうか
 */
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
      // uiEvents.js のロジックから移植
      // location.js の責務である toggleCrushStatus の呼び出しを維持
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
    // drawSpawnPoint 関数内で湧き潰しUIの描画と更新が行われると想定。
    // この関数自体は、UIの再描画が必要な際に外部から呼び出されるためのインターフェースとして残す。
}

/**
 * 湧き潰しボタン、マップ関連のイベントリスナーをアタッチする
 * (DOM.colContainerのデリゲーションに統合されるため、ここではダミー関数として残す)
 */
function attachLocationEvents() {
    // イベントデリゲーションは app.js の attachEventListeners に統合される
}


/**
 * 湧き潰しポイントを描画する（utils から移動済みと仮定）
 * @param {object} mob - モブデータ
 */
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
            marker.dataset.locationId = id;
            marker.dataset.isCulled = isCulled ? 'true' : 'false';
            marker.dataset.isInteractive = 'true'; // クリック可能

            overlay.appendChild(marker);
        });
    }
}

export { drawSpawnPoint, handleCrushToggle, updateCrushUI, attachLocationEvents };
