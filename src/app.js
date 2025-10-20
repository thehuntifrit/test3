// app.js

// 🚨 修正1: 依存関係を修正・整理
import { setupApp, setOpenMobCardNo } from "./dataManager.js";
import { DOM, sortAndRedistribute } from "./uiRender.js";
import { attachModalEvents, openReportModal, closeReportModal } from "./modal.js";
import { attachFilterEvents } from "./filter.js";
import { handleCrushToggle } from "./location.js";
import { submitReport } from "./server.js";
import { toJstAdjustedIsoString, debounce } from "./cal.js";

// ----------------------------------------------------
// 🔴 uiEvents.js からの統合 (イベントデリゲーション)
// ----------------------------------------------------

/**
 * 全てのイベントリスナーをアタッチする
 */
function attachEventListeners() {
    // 1. 各ファイルのイベントリスナーをアタッチ
    attachFilterEvents(); // RankTabs, AreaFilter
    attachModalEvents(); // Modal submit/cancel

    // 2. Column container delegation (report/map/card header)
    DOM.colContainer.addEventListener("click", e => {
        const card = e.target.closest(".mob-card");
        if (!card) return;
        const mobNo = parseInt(card.dataset.mobNo, 10);
        const rank = card.dataset.rank;

        // Report buttons
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

        // 湧き潰しボタンのクリック処理 (location.jsの責務)
        if (handleCrushToggle(e)) {
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

    // 3. Resize listener (cal.jsのdebounceを使用)
    window.addEventListener("resize", debounce(() => sortAndRedistribute(), 200));

    // 4. Modal submit (uiEvents.jsのDOMContentLoaded内の処理)
    DOM.reportSubmitBtn?.addEventListener("click", () => {
        const mobNo = parseInt(DOM.reportModal.dataset.mobNo, 10);
        const timeISO = DOM.modalTimeInput.value;
        const memo = DOM.modalMemoInput.value;

        submitReport(mobNo, timeISO, memo)
            .then(() => closeReportModal())
            .catch(err => console.error("報告送信エラー:", err));
    });

    // 5. 湧き潰しボタンのクリック処理 (uiEvents.jsのDOMContentLoaded内の処理 - colContainerに統合)
    DOM.mobList?.addEventListener("click", e => {
        if (e.target.classList.contains("crush-toggle")) {
             e.preventDefault();
        }
    });

}

// ----------------------------------------------------
// 🔴 app.js 本体からの統合
// ----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  attachEventListeners();

  // 初期タブのclickCount整備（localStorage復元に合わせる）
  DOM.rankTabs.querySelectorAll(".tab-button").forEach(btn => {
    // 復元rankと一致するものは1、それ以外は0
    const currentRank = JSON.parse(localStorage.getItem("huntFilterState"))?.rank || "ALL";
    btn.dataset.clickCount = btn.dataset.rank === currentRank ? "1" : "0";
  });

  setupApp();
});
