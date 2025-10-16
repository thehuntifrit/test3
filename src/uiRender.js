// uiRender.js
import { applyFilters } from "./filter.js";
import { calculateRepop } from "./cal.js";
import { getState, EXPANSION_MAP } from "./store.js";
import { toggleCrushStatus } from "./dataManager.js";

const DOM = {
  masterContainer: document.getElementById("master-mob-container"),
  colContainer: document.getElementById("column-container"),
  cols: [
    document.getElementById("column-1"),
    document.getElementById("column-2"),
    document.getElementById("column-3"),
  ],
  statusMessage: document.getElementById("status-message"),
  areaFilterPanel: document.getElementById("area-filter-panel"),
  areaFilterWrapper: document.getElementById("area-filter-wrapper"),
};

// ステータスメッセージ
function displayStatus(message, type = "loading") {
  DOM.statusMessage.classList.remove("hidden");
  DOM.statusMessage.textContent = message;
  DOM.statusMessage.className =
    "fixed top-14 left-0 right-0 z-40 text-center py-1 text-sm transition-colors duration-300";

  DOM.statusMessage.classList.remove(
    "bg-red-700/80",
    "bg-green-700/80",
    "bg-blue-700/80",
    "text-white"
  );

  if (type === "error") {
    DOM.statusMessage.classList.add("bg-red-700/80", "text-white");
  } else if (type === "success") {
    DOM.statusMessage.classList.add("bg-green-700/80", "text-white");
    setTimeout(() => {
      DOM.statusMessage.textContent = "";
      DOM.statusMessage.classList.add("hidden");
    }, 3000);
  } else {
    DOM.statusMessage.classList.add("bg-blue-700/80", "text-white");
  }
}

// モブカード生成
function createMobCard(mob) {
  const repop = calculateRepop(mob);

  // Bランク湧き潰しマップ（S/Aと関連付けられている場合のみ）
  let spawnOverlayHTML = "";
  if (mob.Rank.startsWith("B") && mob.related_mob_no) {
    const relatedMob = getState().mobs.find(m => m.No === mob.related_mob_no);
    if (relatedMob && relatedMob.spawn_cull_status) {
      spawnOverlayHTML = `
        <div class="map-content relative mt-2">
          <img src="./maps/${mob.Area}.jpg" alt="${mob.Area}" class="w-full rounded" />
          <div class="map-overlay absolute inset-0">
            ${Object.entries(relatedMob.spawn_cull_status)
              .map(([pointId, status]) => drawSpawnPoint(mob.No, pointId, status))
              .join("")}
          </div>
        </div>
      `;
    }
  }

  return `
    <div class="mob-card bg-gray-700 rounded-lg shadow-xl overflow-hidden cursor-pointer border border-gray-700 transition duration-150"
         data-mob-no="${mob.No}" data-rank="${mob.Rank}">
      <div class="p-3 flex justify-between items-center" data-toggle="card-header">
        <div>
          <h3 class="font-bold text-lg">${mob.Name}</h3>
          <p class="text-sm text-gray-300">${mob.Area}</p>
        </div>
        <div class="text-right">
          <p class="text-xs">${repop.timeRemaining}</p>
        </div>
      </div>
      <div class="progress-bar-wrapper h-2 bg-gray-600">
        <div class="progress-bar-bg h-2 transition-all duration-500"></div>
      </div>
      <div class="expandable-panel hidden p-3">
        <button data-report-type="modal" data-mob-no="${mob.No}" class="px-3 py-1 bg-blue-600 rounded text-white">報告する</button>
        <button data-report-type="instant" data-mob-no="${mob.No}" class="px-3 py-1 bg-green-600 rounded text-white">即時報告</button>
        ${spawnOverlayHTML}
      </div>
    </div>
  `;
}

// スポーンポイント描画
function drawSpawnPoint(mobNo, pointId, status) {
  const isCulled = status === "culled";
  const isLastOne = status === "lastone";
  const classes = ["spawn-point"];

  if (isLastOne) {
    classes.push("spawn-point-lastone", "color-lastone", "spawn-point-shadow-lastone");
  } else if (isCulled) {
    classes.push("spawn-point-sa", "culled-with-white-border");
  } else {
    classes.push("spawn-point-sa", "color-b1", "spawn-point-shadow-sa");
  }

  return `
    <div class="${classes.join(" ")}"
         style="top:${Math.random() * 90 + 5}%; left:${Math.random() * 90 + 5}%"
         data-mob-no="${mobNo}"
         data-point-id="${pointId}"
         data-is-interactive="true"
         onclick="window.handleSpawnPointClick(${mobNo}, '${pointId}', ${isCulled})">
    </div>
  `;
}

// グローバル関数としてクリック処理を登録
window.handleSpawnPointClick = (mobNo, pointId, isCulled) => {
  toggleCrushStatus(mobNo, pointId, isCulled);
};

// カードをカラムに分配
function distributeCards(cards) {
  DOM.cols.forEach(col => (col.innerHTML = ""));
  cards.forEach((cardHTML, i) => {
    const colIndex = i % DOM.cols.length;
    DOM.cols[colIndex].insertAdjacentHTML("beforeend", cardHTML);
  });
}

// フィルタ適用後に描画
function renderMobCards() {
  const filteredMobs = applyFilters();
  const cards = filteredMobs.map(mob => createMobCard(mob));
  distributeCards(cards);
  updateFilterUI();
}

// エリアフィルタパネル描画
function renderAreaFilterPanel() {
  const { filter } = getState();
  if (!DOM.areaFilterPanel) return;

  DOM.areaFilterPanel.innerHTML = "";

  Object.entries(EXPANSION_MAP).forEach(([key, label]) => {
    const checked = filter.areaSets[filter.rank]?.has(label) ? "checked" : "";
    const checkbox = `
      <label class="flex items-center space-x-2 text-sm text-white">
        <input type="checkbox" data-expansion="${label}" ${checked} />
        <span>${label}</span>
      </label>
    `;
    DOM.areaFilterPanel.insertAdjacentHTML("beforeend", checkbox);
  });
}

// フィルタUI更新
function updateFilterUI() {
  const { filter } = getState();
  const rankTabs = document.querySelectorAll("#rank-tabs .tab-button");

  rankTabs.forEach(btn => {
    const rank = btn.dataset.rank;
    btn.dataset.clickCount = rank === filter.rank ? "1" : "0";
  });

  renderAreaFilterPanel();
}

export { displayStatus, renderMobCards, updateFilterUI, DOM };
