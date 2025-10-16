// filter.js
import { getState } from "./store.js";

const FILTER_TO_DATA_RANK_MAP = { FATE: "F", ALL: "ALL", S: "S", A: "A" };

function applyFilters() {
  const { mobs, filter } = getState();
  const targetDataRank = FILTER_TO_DATA_RANK_MAP[filter.rank] || filter.rank;

  const filtered = mobs.filter(mob => {
    if (targetDataRank === "ALL") return true;
    if (targetDataRank === "A") {
      if (mob.Rank !== "A" && !mob.Rank.startsWith("B")) return false;
    } else if (targetDataRank === "F") {
      if (mob.Rank !== "F" && !mob.Rank.startsWith("B")) return false;
    } else if (mob.Rank !== targetDataRank) {
      return false;
    }
    const areaSet = filter.areaSets[filter.rank];
    const mobExpansion = mob.Rank.startsWith("B")
      ? mobs.find(m => m.No === mob.related_mob_no)?.Expansion || mob.Expansion
      : mob.Expansion;
    if (!areaSet || !(areaSet instanceof Set) || areaSet.size === 0) return true;
    return areaSet.has(mobExpansion);
  });

  filtered.sort((a, b) => (b.repopInfo?.elapsedPercent || 0) - (a.repopInfo?.elapsedPercent || 0));
  return filtered;
}

export { applyFilters, FILTER_TO_DATA_RANK_MAP };
