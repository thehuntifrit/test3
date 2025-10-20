// app.js (統合後)

import { setupApp } from "./dataManager.js";
// attachEventListeners の中身を app.js 内に定義し、不要になった import を整理
import { DOM } from "./uiRender.js"; // DOM は uiRender.js に移動済み

// イベント処理に必要な依存関係を import (仕様に沿ってimport元を修正)
import { getState, setFilter, setOpenMobCardNo } from "./dataManager.js"; // store.js => dataManager.js
import { renderRankTabs, renderAreaFilterPanel, sortAndRedistribute, toggleAreaFilterPanel } from "./filter.js"; // filter.js (仮)
import { openReportModal, closeReportModal, toJstAdjustedIsoString, attachModalEvents } from "./modal.js"; // modal.js
import { attachLocationEvents } from "./location.js"; // location.js
import { FILTER_TO_DATA_RANK_MAP } from "./dataManager.js"; // uiShared.js => dataManager.js
import { submitReport, toggleCrushStatus } from "./server.js"; // firestore.js => server.js
import { debounce } from "./cal.js"; // utils.js => cal.js
import { filterAndRender } from "./uiRender.js";

// ----- FILTER/RANK TABS EVENTS (app.js の責務: attachEventListeners) -----

// Rank tabs / Area filter イベント登録
function attachFilterEvents() {
  // Rank tabs
  DOM.rankTabs.addEventListener("click", e => {
    const btn = e.target.closest(".tab-button");
    if (!btn) return;
    const newRank = btn.dataset.rank.toUpperCase();
    const state = getState();
    let clickCount = parseInt(btn.dataset.clickCount || 0, 10);

    if (newRank !== state.filter.rank) {
      setFilter({
        rank: newRank,
        areaSets: {
          ...state.filter.areaSets,
          [newRank]: state.filter.areaSets[newRank] instanceof Set ? state.filter.areaSets[newRank] : new Set()
        }
      });
      clickCount = 1;
      toggleAreaFilterPanel(true);
      filterAndRender({ isInitialLoad: true });
    } else {
      if (newRank === "ALL") {
        toggleAreaFilterPanel(true);
        clickCount = 0;
  	  } else {
        clickCount = (clickCount % 3) + 1;
        if (clickCount === 2) toggleAreaFilterPanel(false);
        else if (clickCount === 3) {
          toggleAreaFilterPanel(true);
          clickCount = 0;
        }
      }
    }
    btn.dataset.clickCount = String(clickCount);
  });

  // Area filter
  DOM.areaFilterPanel.addEventListener("click", e => {
    const btn = e.target.closest(".area-filter-btn");
    if (!btn) return;
    const state = getState();
    const uiRank = state.filter.rank;
    const dataRank = FILTER_TO_DATA_RANK_MAP[uiRank] || uiRank;
    const currentSet = state.filter.areaSets[uiRank] instanceof Set ? state.filter.areaSets[uiRank] : new Set();

    if (btn.dataset.area === "ALL") {
      const allAreas = Array.from(
        state.mobs
          .filter(m => (dataRank === "A" || dataRank === "F") ? (m.Rank === dataRank || m.Rank.startsWith("B")) : (m.Rank === dataRank))
          .reduce((set, m) => {
            const mobExpansion = m.Rank.startsWith("B")
              ? state.mobs.find(x => x.No === m.related_mob_no)?.Expansion || m.Expansion
              : m.Expansion;
            if (mobExpansion) set.add(mobExpansion);
            return set;
          }, new Set())
      );
      const nextSet = (currentSet.size === allAreas.length) ? new Set() : new Set(allAreas);
      setFilter({ areaSets: { ...state.filter.areaSets, [uiRank]: nextSet } });
    } else {
      const area = btn.dataset.area;
      if (currentSet.has(area)) currentSet.delete(area);
      else currentSet.add(area);
      setFilter({ areaSets: { ...state.filter.areaSets, [uiRank]: new Set(currentSet) } });
    }

    renderAreaFilterPanel();
    sortAndRedistribute(); // debounce内でfilterAndRenderが呼ばれる
  });

}

// Column container delegation (report/map/card header) (app.js の責務: attachEventListeners)
function attachCardEvents() {
  DOM.colContainer.addEventListener("click", e => {
    const card = e.target.closest(".mob-card");
    if (!card) return;
    const mobNo = parseInt(card.dataset.mobNo, 10);
    const rank = card.dataset.rank;

    // Report buttons (MODAL/INSTANT)
    const reportBtn = e.target.closest("button[data-report-type]");
    if (reportBtn) {
      e.stopPropagation();
      const type = reportBtn.dataset.reportType;
      if (type === "modal") {
        openReportModal(mobNo);
      } else if (type === "instant") {
        const iso = toJstAdjustedIsoString(new Date());
        submitReport(mobNo, iso, `${rank}ランク即時報告`);
      }
      return;
    }

    // 湧き潰しボタンのクリック処理 (LOCATION)
    const point = e.target.closest(".spawn-point");
    if (point && point.dataset.isInteractive === "true") {
      e.preventDefault();
      e.stopPropagation();
      const locationId = point.dataset.locationId;
      const isCurrentlyCulled = point.dataset.isCulled === "true";
      toggleCrushStatus(mobNo, locationId, isCurrentlyCulled);
      return;
    }

    // Expand/collapse
    if (e.target.closest("[data-toggle='card-header']")) {
      if (rank === "S" || rank === "A" || rank === "F") {
        const panel = card.querySelector(".expandable-panel");
        if (panel) {
          if (!panel.classList.contains("open")) {
            document.querySelectorAll(".expandable-panel.open").forEach(p => {
              if (p.closest(".mob-card") !== card) p.classList.remove("open");
            });
            panel.classList.add("open");
            setOpenMobCardNo(mobNo);
          } else {
            panel.classList.remove("open");
            setOpenMobCardNo(null);
          }
        }
      }
    }
  });
}

// Window Resize Event (app.js の責務: attachEventListeners)
function attachWindowResizeEvents() {
    window.addEventListener("resize", debounce(() => sortAndRedistribute(), 200));
}

// DOMContentLoaded でのイベント登録
function attachEventListeners() {
    renderRankTabs(); // 初期化時に呼び出し
    attachFilterEvents();
    attachCardEvents();
    attachWindowResizeEvents();
    // モーダルとロケーションのイベントは、modal.js と location.js の責務とする
    attachModalEvents();
    attachLocationEvents();
}

document.addEventListener("DOMContentLoaded", () => {
    // 初期タブのclickCount整備（localStorage復元に合わせる）
    DOM.rankTabs.querySelectorAll(".tab-button").forEach(btn => {
        // 復元rankと一致するものは1、それ以外は0
        const currentRank = JSON.parse(localStorage.getItem("huntFilterState"))?.rank || "ALL";
        btn.dataset.clickCount = btn.dataset.rank === currentRank ? "1" : "0";
    });
    
    setupApp();
});

export { attachEventListeners };
