// uiEvents.js
import { openReportModal, closeReportModal, MODAL } from "./modal.js";
import { toJstAdjustedIsoString } from "./utils.js";
import { submitReport } from "./dataManager.js";
import { getState, setFilter, setOpenMobCardNo } from "./store.js";
import { updateProgressBars } from "./uiRender.js";
import { FILTER_TO_DATA_RANK_MAP } from "./filter.js";

function attachEventListeners() {
  const { filter } = getState();

  // rank tabs click
  document.getElementById('rank-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-button');
    if (!btn) return;
    const newRank = btn.dataset.rank;
    let clickCount = parseInt(btn.dataset.clickCount || 0, 10);

    const prevRank = filter.rank;
    if (newRank !== prevRank) {
      setFilter({ rank: newRank });
      clickCount = 1;
      document.getElementById('area-filter-wrapper').classList.remove('open');
    } else {
      if (newRank === 'ALL') {
        document.getElementById('area-filter-wrapper').classList.remove('open');
        clickCount = 0;
      } else {
        clickCount = (clickCount % 3) + 1;
        const wrapper = document.getElementById('area-filter-wrapper');
        if (clickCount === 2) wrapper.classList.add('open');
        else if (clickCount === 3) { wrapper.classList.remove('open'); clickCount = 0; }
      }
    }
    btn.dataset.clickCount = clickCount;
  });

  // column-container delegation
  document.getElementById('column-container').addEventListener('click', e => {
    const card = e.target.closest('.mob-card');
    if (!card) return;
    const mobNo = parseInt(card.dataset.mobNo, 10);
    const rank = card.dataset.rank;

    const reportBtn = e.target.closest('button[data-report-type]');
    if (reportBtn) {
      e.stopPropagation();
      const reportType = reportBtn.dataset.reportType;
      if (reportType === 'modal') {
        openReportModal(mobNo);
      } else if (reportType === 'instant') {
        const timeISO = toJstAdjustedIsoString(new Date());
        submitReport(mobNo, timeISO, `${rank}ランク即時報告`);
      }
      return;
    }

    // expandable panel toggle（現行挙動維持）
    if (e.target.closest('[data-toggle="card-header"]')) {
      if (rank === 'S' || rank === 'A' || rank === 'F') {
        const panel = card.querySelector('.expandable-panel');
        if (panel) {
          if (!panel.classList.contains('open')) {
            document.querySelectorAll('.expandable-panel.open').forEach(p => {
              if (p.closest('.mob-card') !== card) p.classList.remove('open');
            });
            panel.classList.add('open');
            setOpenMobCardNo(mobNo);
          } else {
            panel.classList.remove('open');
            setOpenMobCardNo(null);
          }
        }
      }
    }
  });

  // cancel
  MODAL.cancelBtn?.addEventListener('click', closeReportModal);

  // submit
  MODAL.reportForm?.addEventListener('submit', e => {
    e.preventDefault();
    const mobNo = parseInt(MODAL.reportForm.dataset.mobNo, 10);
    const datetime = MODAL.modalTimeInput.value;
    const memo = MODAL.modalMemoInput.value;
    submitReport(mobNo, datetime, memo);
  });

  // resize progress
  window.addEventListener('resize', () => updateProgressBars());
}

export { attachEventListeners };
