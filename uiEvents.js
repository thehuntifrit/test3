// uiEvents.js
import { setFilter } from "./store.js";
import { renderMobCards } from "./uiRender.js";

function attachEventListeners() {
  const filterRank = document.getElementById("filter-rank");
  const filterName = document.getElementById("filter-name");

  filterRank.addEventListener("change", e => {
    setFilter({ rank: e.target.value });
    renderMobCards();
  });

  filterName.addEventListener("input", e => {
    setFilter({ name: e.target.value });
    renderMobCards();
  });
}

export { attachEventListeners };
