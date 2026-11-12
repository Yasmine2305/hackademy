const z = (n) => String(n).padStart(2, '0');

/** Durée en secondes → « hh:mm:ss ». */
export function formatDuration(seconds) {
  const t = Math.max(0, Math.floor(seconds || 0));
  return `${z(Math.floor(t / 3600))}:${z(Math.floor(t / 60) % 60)}:${z(t % 60)}`;
}

/** Temps écoulé d'une partie (figé une fois le rapport débloqué). */
export function elapsed(startedAt, finishedAt, now = Date.now()) {
  if (!startedAt) return 0;
  const end = finishedAt ? Date.parse(finishedAt) : now;
  return (end - Date.parse(startedAt)) / 1000;
}

/** ISO → « 08:44 ». */
export function hhmm(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${z(d.getHours())}:${z(d.getMinutes())}`;
}

/** ISO → « aujourd’hui, 08:44 » ou « 12/03, 08:44 ». */
export function dayTime(iso) {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  return `${same ? 'aujourd’hui' : `${z(d.getDate())}/${z(d.getMonth() + 1)}`}, ${hhmm(iso)}`;
}

export const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
