import { formatDuration } from "./utils.js";

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
    if (now >= minRepop - 3600) {
      timeRemaining = `Next: ${formatDuration(minRepop - now)}`;
    } else {
      const nextDate = new Date(minRepop * 1000);
      timeRemaining = `Next: ${nextDate.toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    status = "Next";
  } else if (now >= minRepop && now < maxRepop) {
    elapsedPercent = ((now - minRepop) / (maxRepop - minRepop)) * 100;
    elapsedPercent = Math.min(elapsedPercent, 100);
    timeRemaining = `${elapsedPercent.toFixed(0)}% (${formatDuration(maxRepop - now)}`;
    status = "PopWindow";
  } else {
    elapsedPercent = 100;
    timeRemaining = `100% (+${formatDuration(now - maxRepop)} over)`;
    status = "MaxOver";
  }

  const nextMinRepopDate = minRepop > now ? new Date(minRepop * 1000) : null;
  return { minRepop, maxRepop, elapsedPercent, timeRemaining, status, nextMinRepopDate };
}

export { calculateRepop };
