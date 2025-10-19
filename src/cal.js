// cal.js
import { formatDuration } from "./utils.js";

// エオルゼア時間 (Eorzea Time)
function getEorzeaTime(date = new Date()) {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  // 1 ET秒 = 20.571428571 リアル秒
  const eorzeaTotalSeconds = Math.floor(unixSeconds * 20.571428571);
  const eorzeaDaySeconds = eorzeaTotalSeconds % 86400; // 1日 = 86400秒
  const hours = Math.floor(eorzeaDaySeconds / 3600);
  const minutes = Math.floor((eorzeaDaySeconds % 3600) / 60);
  return { hours, minutes };
}

// 月齢 (Moon Phase)
function getEorzeaMoonPhase(date = new Date()) {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const eorzeaDays = Math.floor(unixSeconds * 20.571428571 / 86400);
  const phase = eorzeaDays % 32; // 0=新月, 16=満月
  return phase;
}

// 天候シード計算
function getEorzeaWeatherSeed(date = new Date()) {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const bell = Math.floor(unixSeconds / 175) % 24; // ETの時刻
  const increment = (Math.floor(unixSeconds / 175 / 24) * 100) + bell;
  const step1 = (increment << 11) ^ increment;
  const step2 = (step1 >>> 8) ^ step1;
  return step2 % 100; // 0〜99 の値
}

// 天候決定（エリアごとのテーブルを渡す）
function getEorzeaWeather(date = new Date(), weatherTable) {
  const seed = getEorzeaWeatherSeed(date);
  let cumulative = 0;
  for (const entry of weatherTable) {
    cumulative += entry.rate;
    if (seed < cumulative) return entry.weather;
  }
  return "Unknown";
}

/**
 * モブの出現条件を判定する（天候シード専用）
 */
function checkMobSpawnCondition(mob, date) {
  const et = getEorzeaTime(date); // { hours, minutes }
  const moon = getEorzeaMoonPhase(date);
  const seed = getEorzeaWeatherSeed(date);

  if (mob.moonPhase && mob.moonPhase !== moon) return false;

  if (mob.weatherSeedRange) {
    const [min, max] = mob.weatherSeedRange;
    if (seed < min || seed > max) return false;
  }

  if (mob.weatherSeedRanges) {
    const ok = mob.weatherSeedRanges.some(([min, max]) => seed >= min && seed <= max);
    if (!ok) return false;
  }

  if (mob.timeRange) {
    const { start, end } = mob.timeRange;
    const h = et.hours;
    if (start < end) {
      if (h < start || h >= end) return false;
    } else {
      if (h < start && h >= end) return false;
    }
  }

  if (mob.timeRanges) {
    const h = et.hours;
    const ok = mob.timeRanges.some(({ start, end }) => {
      if (start < end) return h >= start && h < end;
      return h >= start || h < end;
    });
    if (!ok) return false;
  }

  return true;
}

/**
 * 次回条件成立時刻を探索する
 */
function findNextSpawnTime(mob, now = new Date()) {
  let date = new Date(now.getTime());
  const limit = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  while (date.getTime() < limit) {
    if (checkMobSpawnCondition(mob, date)) {
      return date;
    }
    date = new Date(date.getTime() + 1400 * 1000); // 23分20秒
  }
  return null;
}

function calculateRepop(mob) {
  const now = Date.now() / 1000;
  const lastKill = mob.last_kill_time || 0;
  const repopSec = mob.REPOP_s;
  const maxSec = mob.MAX_s;

  let minRepop = lastKill + repopSec;
  let maxRepop = lastKill + maxSec;
  let elapsedPercent = 0;
  let timeRemaining = "Unknown";
  let status = "Unknown";

  if (lastKill === 0) {
    minRepop = now + repopSec;
    maxRepop = now + maxSec;
    timeRemaining = `Next: ${formatDuration(minRepop - now)}`;
    status = "Next";
  } else if (now < minRepop) {
    timeRemaining = `Next: ${formatDuration(minRepop - now)}`;
    status = "Next";
  } else if (now >= minRepop && now < maxRepop) {
    elapsedPercent = ((now - minRepop) / (maxRepop - minRepop)) * 100;
    elapsedPercent = Math.min(elapsedPercent, 100);
    timeRemaining = `${elapsedPercent.toFixed(0)}% (${formatDuration(maxRepop - now)})`;
    status = "PopWindow";
  } else {
    elapsedPercent = 100;
    timeRemaining = `100% (+${formatDuration(now - maxRepop)})`;
    status = "MaxOver";
  }

  const nextMinRepopDate = minRepop > now ? new Date(minRepop * 1000) : null;

  return { minRepop, maxRepop, elapsedPercent, timeRemaining, status, nextMinRepopDate };
}

export { calculateRepop, checkMobSpawnCondition, findNextSpawnTime, getEorzeaTime, getEorzeaMoonPhase, getEorzeaWeatherSeed, getEorzeaWeather };
