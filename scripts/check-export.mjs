import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  ff = require("ffmpeg-static"),
  probe = require("ffprobe-static").path;
const dir = await mkdtemp(join(tmpdir(), "morrow-check-"));
const url = process.env.TEST_URL || "http://localhost:3000";
const before = (await readdir(tmpdir()))
  .filter((x) => x.startsWith("morrow-"))
  .sort();
try {
  execFileSync(
    ff,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=green:s=320x568:r=30",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=44100",
      "-t",
      "2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      join(dir, "a.mp4"),
    ],
    { stdio: "ignore" },
  );
  execFileSync(
    ff,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=orange:s=568x320:r=24",
      "-t",
      "2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      join(dir, "b.mp4"),
    ],
    { stdio: "ignore" },
  );
  async function send(cuts, invalid = false) {
    const form = new FormData();
    for (const f of ["a.mp4", "b.mp4"])
      form.append(
        "files",
        new Blob([invalid ? "invalid video" : await readFile(join(dir, f))], {
          type: "video/mp4",
        }),
        f,
      );
    form.append("cuts", JSON.stringify(cuts));
    form.append("design", JSON.stringify({theme:"night",percent:75,minutes:60,goal:80,start:"2026-10-19",end:"2026-10-25"}));
    return fetch(url + "/api/export", { method: "POST", body: form });
  }
  const cuts = [
    { start: 0, end: 1.5 },
    { start: 0.5, end: 2 },
  ];
  const response = await send(cuts);
  assert.equal(
    response.status,
    200,
    await response
      .clone()
      .text()
      .then((t) => t.slice(0, 200)),
  );
  await writeFile(
    join(dir, "output.mp4"),
    Buffer.from(await response.arrayBuffer()),
  );
  // A constant-color source must still animate: compare early and settled overlay frames.
  const frameAt = (time) => execFileSync(ff, ['-v','error','-ss',String(time),'-i',join(dir,'output.mp4'),'-frames:v','1','-f','image2pipe','-vcodec','png','-']);
  assert.notDeepEqual(frameAt(0.15), frameAt(1.7), 'Opening must animate over footage');
  if (process.env.SAVE_DEMO) await writeFile(process.env.SAVE_DEMO, await readFile(join(dir, 'output.mp4')));
  const meta = JSON.parse(
    execFileSync(probe, [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      join(dir, "output.mp4"),
    ]),
  );
  const video = meta.streams.find((s) => s.codec_type === "video");
  assert.equal(video.width, 720);
  assert.equal(video.height, 1280);
  assert.equal(video.codec_name, "h264");
  assert(meta.streams.some((s) => s.codec_name === "aac"));
  assert(Math.abs(Number(meta.format.duration) - 8) < 0.15);
  assert.equal(
    (
      await send([
        { start: 0, end: 40 },
        { start: 0, end: 30 },
      ])
    ).status,
    400,
  );
  const tooLong = await send([{start:0,end:28},{start:0,end:28}]);
  assert.equal(tooLong.status, 400);
  assert.match((await tooLong.json()).error, /55초/);
  assert.equal((await send(cuts, true)).status, 400);
  assert.deepEqual(
    (await readdir(tmpdir())).filter((x) => x.startsWith("morrow-")).sort(),
    before,
  );
  console.log(
    "PASS: mixed aspect/audio export, H.264/AAC 720x1280, branded intro/outro (+5s), 60s limit, invalid media, cleanup.",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
