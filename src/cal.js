// cal.js

// エオルゼア時間計算
function getEorzeaTime(date = new Date()) {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const eTime = (unixSeconds * 20.5714285714) % 86400; // 1日 = 70分
  const hours = Math.floor(eTime / 3600);
  const minutes = Math.floor((eTime % 3600) / 60);
  return { hours, minutes };
}

// 月齢計算
function getEorzeaMoonPhase(date = new Date()) {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const phase = Math.floor((unixSeconds / 3456) % 8); // 1フェーズ = 57分36秒
  return phase;
}

// 天候シード算出
function getEorzeaWeatherSeed(date = new Date()) {
  const bell = Math.floor(date.getTime() / 175000); // 1エオルゼア時間 = 175秒
  const increment = (bell + 8 - (bell % 8)) % 24;
  const totalDays = Math.floor(date.getTime() / 420000); // 1日 = 20時間
  const calcBase = (totalDays * 100) + increment;
  const step1 = (calcBase << 11) ^ calcBase;
  const step2 = (step1 >>> 8) ^ step1;
  return step2 % 100;
}

// 天候判定
function getEorzeaWeather(area, date = new Date()) {
  const seed = getEorzeaWeatherSeed(date);
  const weatherRates = area.weatherRates;
  let cumulative = 0;
  for (const [weather, rate] of weatherRates) {
    cumulative += rate;
    if (seed < cumulative) return weather;
  }
  return "Unknown";
}

// モブ出現条件チェック
function checkMobSpawnCondition(mob, date = new Date()) {
  if (!mob.Condition) return true;
  // 条件文を評価する（天候・時間・月齢など）
  // 実装は省略例
  return true;
}

// 次回条件成立時間を探索
function findNextSpawnTime(mob, fromDate = new Date()) {
  for (let i = 0; i < 1000; i++) {
    const testDate = new Date(fromDate.getTime() + i * 175000); // 1エオルゼア時間刻み
    if (checkMobSpawnCondition(mob, testDate)) {
      return testDate;
    }
  }
  return null;
}

// リポップ計算
function calculateRepop(mob) {
  if (!mob.last_kill_time) return {};
  const now = Date.now();
  const killTime = mob.last_kill_time * 1000;
  const elapsed = (now - killTime) / 1000;
  const minRepop = mob.REPOP_s;
  const maxRepop = mob.REPOP_max_s;
  const elapsedPercent = Math.min(100, (elapsed / maxRepop) * 100);

  let status = "Waiting";
  if (elapsed >= minRepop && elapsed < maxRepop) status = "PopWindow";
  if (elapsed >= maxRepop) status = "MaxOver";

  return {
    elapsedPercent,
    status,
    nextMinRepopDate: new Date(killTime + minRepop * 1000),
    maxRepop,
    timeRemaining: `${Math.floor((maxRepop - elapsed) / 60)}m`
  };
}

// 時間フォーマット
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
}

// デバウンス
function debounce(func, wait) {
  let timeout;
  return function executed(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export { getEorzeaTime, getEorzeaMoonPhase, getEorzeaWeatherSeed, getEorzeaWeather, checkMobSpawnCondition, findNextSpawnTime, calculateRepop, formatDuration, debounce };
