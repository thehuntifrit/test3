// filter.js
import { getState } from "./store.js";
import { includesIgnoreCase } from "./utils.js";

// ランクフィルタ
function filterByRank(mobs, rank) {
  if (rank === "ALL") return mobs;
  return mobs.filter(mob => mob.Rank === rank);
}

// 名前フィルタ
function filterByName(mobs, keyword) {
  if (!keyword) return mobs;
  return mobs.filter(mob => includesIgnoreCase(mob.Name, keyword));
}

// エリアセットフィルタ（例: expansionごと）
function filterByAreaSets(mobs, areaSets) {
  if (!areaSets || Object.keys(areaSets).length === 0) return mobs;
  return mobs.filter(mob => areaSets[mob.Expansion]);
}

// 総合フィルタ
function applyFilters() {
  const { mobs, filter } = getState();
  let result = [...mobs];
  result = filterByRank(result, filter.rank);
  result = filterByName(result, filter.name);
  result = filterByAreaSets(result, filter.areaSets);
  return result;
}

export { applyFilters };
