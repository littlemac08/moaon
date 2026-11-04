import assert from "node:assert/strict";
import { weekRange, weeklySeconds } from "../lib/weekly.mjs";
assert.deepEqual(weekRange("2026-10-22"), {
  start: "2026-10-19",
  end: "2026-10-25",
});
assert.deepEqual(weekRange("2026-10-25"), {
  start: "2026-10-19",
  end: "2026-10-25",
});
assert.deepEqual(weekRange("2026-10-26"), {
  start: "2026-10-26",
  end: "2026-11-01",
});
assert.deepEqual(weekRange("2027-01-01"), {
  start: "2026-12-28",
  end: "2027-01-03",
});
const logs = [
  { date: "2026-10-18", seconds: 999, routineId: "a" },
  { date: "2026-10-19", seconds: 1800, routineId: "a" },
  { date: "2026-10-22", seconds: 1800, routineId: "b" },
  { date: "2026-10-25", seconds: 600, routineId: "a" },
  { date: "2026-10-26", seconds: 999, routineId: "a" },
];
assert.equal(weeklySeconds(logs, "2026-10-22"), 4200);
assert.equal(weeklySeconds(logs, "2026-10-22", "a"), 2400);
assert.equal(weeklySeconds(logs, "2026-10-19", undefined, true), 1800);
assert.equal(weeklySeconds(logs, "2026-10-22", undefined, true) / 3600, 1);
assert.equal(weeklySeconds(logs, "2026-10-25", undefined, true), 4200);
assert.equal(weeklySeconds(logs, "2026-10-26", undefined, true), 999);
assert.equal(weeklySeconds([], "2026-10-22"), 0);
console.log(
  "PASS: weekly totals, cumulative day rings, routine totals, Monday reset, Sunday inclusion, month/year boundaries.",
);
