// filter.js
import { getState, EXPANSION_MAP } from "./store.js";
import { DOM, FILTER_TO_DATA_RANK_MAP } from "./uiShared.js";
import { debounce } from "./utils.js";
import { filterAndRender } from "./uiRender.js";

function renderAreaFilterPanel() {
  DOM.areaFilterPanel.innerHTML = "";
  const state = getState();
  const uiRank = state.filter.rank;
  const dataRank = FILTER_TO_DATA_RANK_MAP[uiRank] || uiRank;

  const areas = state.mobs
    .filter(m => (dataRank === "A" || dataRank === "F") ? (m.Rank === dataRank || m.Rank.startsWith("B")) : (m.Rank === dataRank))
    .reduce((set, m) => {
      const mobExpansion = m.Rank.startsWith("B")
        ? state.mobs.find(x => x.No === m.related_mob_no)?.Expansion || m.Expansion
        : m.Expansion;
      if (mobExpansion) set.add(mobExpansion);
      return set;
    }, new Set());

  const currentSet = state.filter.areaSets[uiRank] instanceof Set ? state.filter.areaSets[uiRank] : new Set();
  const isAllSelected = areas.size > 0 && currentSet.size === areas.size;

  const allBtn = document.createElement("button");
  allBtn.textContent = isAllSelected ? "全解除" : "全選択";
  allBtn.className = `area-filter-btn px-3 py-1 text-xs rounded font-semibold transition ${isAllSelected ? "bg-red-500" : "bg-gray-500 hover:bg-gray-400"}`;
  allBtn.dataset.area = "ALL";
  DOM.areaFilterPanel.appendChild(allBtn);

  Array.from(areas)
    .sort((a, b) => {
      const indexA = Object.values(EXPANSION_MAP).indexOf(a);
      const indexB = Object.values(EXPANSION_MAP).indexOf(b);
      return indexB - indexA;
    })
    .forEach(area => {
      const btn = document.createElement("button");
      const isSelected = currentSet.has(area);
      btn.textContent = area;
      btn.className = `area-filter-btn px-3 py-1 text-xs rounded font-semibold transition ${isSelected ? "bg-green-500" : "bg-gray-500 hover:bg-gray-400"}`;
      btn.dataset.area = area;
      DOM.areaFilterPanel.appendChild(btn);
    });
}

function toggleAreaFilterPanel(forceClose = false) {
  const state = getState();
  if (state.filter.rank === "ALL") forceClose = true;
  if (forceClose || DOM.areaFilterWrapper.classList.contains("open")) {
    DOM.areaFilterWrapper.classList.remove("open");
    DOM.areaFilterWrapper.classList.add("max-h-0", "opacity-0", "pointer-events-none");
  } else {
    DOM.areaFilterWrapper.classList.add("open");
    DOM.areaFilterWrapper.classList.remove("max-h-0", "opacity-0", "pointer-events-none");
    renderAreaFilterPanel();
  }
}

const sortAndRedistribute = debounce(() => filterAndRender(), 200);

function updateFilterUI() {
  const state = getState();
  const currentRankKeyForColor = FILTER_TO_DATA_RANK_MAP[state.filter.rank] || state.filter.rank;
  DOM.rankTabs.querySelectorAll(".tab-button").forEach(btn => {
    btn.classList.remove("bg-blue-800", "bg-red-800", "bg-yellow-800", "bg-indigo-800");
    btn.classList.add("bg-gray-600");
    if (btn.dataset.rank !== state.filter.rank) {
      btn.dataset.clickCount = "0";
    }
    if (btn.dataset.rank === state.filter.rank) {
      btn.classList.remove("bg-gray-600");
      const rank = btn.dataset.rank;
      btn.classList.add(
        rank === "ALL" ? "bg-blue-800"
        : currentRankKeyForColor === "S" ? "bg-red-800"
        : currentRankKeyForColor === "A" ? "bg-yellow-800"
        : currentRankKeyForColor === "F" ? "bg-indigo-800"
        : "bg-gray-800"
      );
    }
  });
}

export { renderAreaFilterPanel, toggleAreaFilterPanel, sortAndRedistribute, updateFilterUI };
