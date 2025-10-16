// uiEvents.js
import { openReportModal, closeReportModal, MODAL } from "./modal.js";
import { toJstAdjustedIsoString } from "./utils.js";
import { submitReport } from "./dataManager.js";
import { getState, setFilter, setOpenMobCardNo } from "./store.js";
import { renderMobCards, updateFilterUI } from "./uiRender.js";

function attachEventListeners() {
  const { filter } = getState();

  // ランクタブ操作
  document.getElementById("rank-tabs").addEventListener("click", e => {
    const btn = e.target.closest(".tab-button");
    if (!btn) return;
    const newRank = btn.dataset.rank;
    let clickCount = parseInt(btn.dataset.clickCount || 0, 10);

    const prevRank = filter.rank;
    if (newRank !== prevRank) {
      setFilter({ rank: newRank });
      clickCount = 1;
      document.getElementById("area-filter-wrapper").classList.remove("open");
    } else {
      if (newRank === "ALL") {
        document.getElementById("area-filter-wrapper").classList.remove("open");
        clickCount = 0;
      } else {
        clickCount = (clickCount % 3) + 1;
        const wrapper = document.getElementById("area-filter-wrapper");
        if (clickCount === 2) wrapper.classList.add("open");
        else if (clickCount === 3) {
          wrapper.classList.remove("open");
          clickCount = 0;
        }
      }
    }
    btn.dataset.clickCount = clickCount;
    renderMobCards(); // タブ切り替え後に再描画
  });

  // エリアフィルタチェックボックス操作
  document.getElementById("area-filter-panel").addEventListener("change", e => {
    if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
      const expansion = e.target.dataset.expansion;
      const { filter } = getState();
      const set = filter.areaSets[filter.rank] || new Set();

      if (e.target.checked) {
        set.add(expansion);
      } else {
        set.delete(expansion);
      }

      setFilter({
        areaSets: { ...filter.areaSets, [filter.rank]: set }
      });

      renderMobCards(); // チェック変更後に再描画
    }
  });

  // カードクリック（報告ボタン・パネル開閉）
  document.getElementById("column-container").addEventListener("click", e => {
    const card = e.target.closest(".mob-card");
    if (!card) return;
    const mobNo = parseInt(card.dataset.mobNo, 10);
    const rank = card.dataset.rank;

    const reportBtn = e.target.closest("button[data-report-type]");
    if (reportBtn) {
      e.stopPropagation();
      const reportType = reportBtn.dataset.reportType;
      if (reportType === "modal") {
        openReportModal(mobNo);
      } else if (reportType === "instant") {
        const timeISO = toJstAdjustedIsoString(new Date());
        submitReport(mobNo, timeISO, `${rank}ランク即時報告`);
      }
      return;
    }

    // 展開パネルの開閉
    if (e.target.closest('[data-toggle="card-header"]')) {
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

  // モーダルキャンセル
  MODAL.cancelBtn?.addEventListener("click", closeReportModal);

  // モーダル送信
  MODAL.reportForm?.addEventListener("submit", e => {
    e.preventDefault();
    const mobNo = parseInt(MODAL.reportForm.dataset.mobNo, 10);
    const datetime = MODAL.modalTimeInput.value;
    const memo = MODAL.modalMemoInput.value;
    submitReport(mobNo, datetime, memo);
  });

  // 初期UI更新
  updateFilterUI();
}

export { attachEventListeners };
