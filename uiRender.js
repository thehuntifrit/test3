// uiRender.js
import { applyFilters } from "./filter.js";
import { calculateRepop } from "./cal.js";
import { getState } from "./store.js";

const PROGRESS_CLASSES = {
  P0_60: 'progress-p0-60',
  P60_80: 'progress-p60-80',
  P80_100: 'progress-p80-100',
  TEXT_NEXT: 'progress-next-text',
  TEXT_POP: 'progress-pop-text',
  MAX_OVER_BLINK: 'progress-max-over-blink'
};

const DOM = {
  masterContainer: document.getElementById('master-mob-container'),
  colContainer: document.getElementById('column-container'),
  cols: [document.getElementById('column-1'), document.getElementById('column-2'), document.getElementById('column-3')],
  statusMessage: document.getElementById('status-message')
};

function displayStatus(message, type = 'loading') {
  DOM.statusMessage.classList.remove('hidden');
  DOM.statusMessage.textContent = message;
  DOM.statusMessage.className = 'fixed top-14 left-0 right-0 z-40 text-center py-1 text-sm transition-colors duration-300';
  DOM.statusMessage.classList.remove('bg-red-700/80','bg-green-700/80','bg-blue-700/80','text-white');
  if (type === 'error') {
    DOM.statusMessage.classList.add('bg-red-700/80','text-white');
  } else if (type === 'success') {
    DOM.statusMessage.classList.add('bg-green-700/80','text-white');
    setTimeout(() => {
      DOM.statusMessage.textContent = '';
      DOM.statusMessage.classList.add('hidden');
    }, 3000);
  } else {
    DOM.statusMessage.classList.add('bg-blue-700/80','text-white');
  }
}

function createMobCardHTML(mob, rankConfig, contentHTML) {
  return `
    <div class="mob-card bg-gray-700 rounded-lg shadow-xl overflow-hidden cursor-pointer border border-gray-700 transition duration-150"
         data-mob-no="${mob.No}" data-rank="${mob.Rank}">
      ${contentHTML}
    </div>
  `;
}

// 進捗バーだけ現行そのまま更新
function updateProgressBars() {
  const { mobs } = getState();
  document.querySelectorAll('.mob-card').forEach(card => {
    const mobNo = parseInt(card.dataset.mobNo, 10);
    const mob = mobs.find(m => m.No === mobNo);
    if (!mob) return;
    const withRepop = { ...mob, repopInfo: calculateRepop(mob) };
    const { elapsedPercent, timeRemaining, status } = withRepop.repopInfo;
    const progressBar = card.querySelector('.progress-bar-bg');
    const progressText = card.querySelector('.progress-text');
    const progressBarWrapper = progressBar ? progressBar.parentElement : null;
    if (!progressBar || !progressText) return;
    progressBar.style.width = `${elapsedPercent}%`;
    progressText.textContent = timeRemaining;
    let bgColorClass = '';
    let textColorClass = '';
    let blinkClass = '';
    progressBar.classList.remove(PROGRESS_CLASSES.P0_60, PROGRESS_CLASSES.P60_80, PROGRESS_CLASSES.P80_100);
    if (status === 'PopWindow') {
      if (elapsedPercent <= 60) bgColorClass = PROGRESS_CLASSES.P0_60;
      else if (elapsedPercent <= 80) bgColorClass = PROGRESS_CLASSES.P60_80;
      else bgColorClass = PROGRESS_CLASSES.P80_100;
      textColorClass = PROGRESS_CLASSES.TEXT_POP;
    } else if (status === 'MaxOver') {
      bgColorClass = PROGRESS_CLASSES.P80_100;
      textColorClass = PROGRESS_CLASSES.TEXT_POP;
      blinkClass = PROGRESS_CLASSES.MAX_OVER_BLINK;
    } else {
      textColorClass = PROGRESS_CLASSES.TEXT_NEXT;
    }
    if (bgColorClass) progressBar.classList.add(bgColorClass);
    progressText.classList.remove(PROGRESS_CLASSES.TEXT_NEXT, PROGRESS_CLASSES.TEXT_POP);
    progressText.classList.add(textColorClass);
    progressBarWrapper?.classList.remove(PROGRESS_CLASSES.MAX_OVER_BLINK);
    if (blinkClass) progressBarWrapper?.classList.add(blinkClass);
  });
}

export { displayStatus, updateProgressBars, DOM };
