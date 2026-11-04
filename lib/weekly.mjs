/** Monday–Sunday boundaries in local calendar time, including year/month crossings. */
export function weekRange(date) {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(year, month - 1, day, 12);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const key = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: key(start), end: key(end) };
}
/** A day-cell uses cumulative time up to that day; summaries use the full week. */
export function weeklySeconds(
  logs,
  date,
  routineId = undefined,
  throughDate = false,
) {
  const { start, end } = weekRange(date);
  return logs
    .filter(
      (log) =>
        log.date >= start &&
        log.date <= (throughDate ? date : end) &&
        (routineId === undefined || log.routineId === routineId),
    )
    .reduce((sum, log) => sum + log.seconds, 0);
}
