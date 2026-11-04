import sharp from "sharp";
import {
  momentCard,
  momentThemes,
  INTRO_SECONDS,
  OUTRO_SECONDS,
} from "../../../lib/moment-design.mjs";
import { NextResponse } from "next/server";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const run = promisify(execFile);
export const runtime = "nodejs";
export const maxDuration = 300;
let busy = false;
export async function POST(request: Request) {
  if (busy)
    return NextResponse.json(
      { error: "다른 영상을 처리 중입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  if (Number(request.headers.get("content-length")) > 250 * 1024 * 1024)
    return NextResponse.json(
      { error: "총 파일 크기는 250MB 이하여야 합니다." },
      { status: 413 },
    );
  busy = true;
  let dir: string | undefined;
  try {
    const form = await request.formData();
    const files = form.getAll("files") as File[];
    const design = JSON.parse(String(form.get("design") || "{}"));
    if (!design || !momentThemes.some((t) => t.id === (design.theme || "sage")))
      throw new Error("디자인 필터를 다시 선택해주세요.");
    const cuts = JSON.parse(String(form.get("cuts") || "[]"));
    if (
      !files.length ||
      files.length > 12 ||
      !Array.isArray(cuts) ||
      cuts.length !== files.length
    )
      throw new Error("1~12개 영상과 컷 구간을 선택해주세요.");
    if (
      files.some((f) => !(f instanceof File)) ||
      files.reduce((s, f) => s + f.size, 0) > 250 * 1024 * 1024
    )
      throw new Error("파일 크기 합계는 250MB 이하여야 합니다.");
    const total = cuts.reduce(
      (s: number, c: { start: number; end: number }) => s + (c.end - c.start),
      0,
    );
    if (
      cuts.some(
        (c: { start: number; end: number }) =>
          !Number.isFinite(c.start) ||
          !Number.isFinite(c.end) ||
          c.start < 0 ||
          c.end - c.start < 0.1,
      ) ||
      !Number.isFinite(total) ||
      total > 60 - INTRO_SECONDS - OUTRO_SECONDS + 0.001
    )
      throw new Error(
        "각 컷은 0.1초 이상, 브랜드 장면 5초를 제외한 원본 컷 합계는 55초 이하여야 합니다.",
      );
    dir = await mkdtemp(join(tmpdir(), "morrow-"));
    const ffmpeg = require("ffmpeg-static") as string;
    const ffprobe = process.env.FFPROBE_PATH || (require("ffprobe-static").path as string);
    for (let i = 0; i < files.length; i++) {
      const input = join(dir, `input-${i}`);
      await writeFile(input, Buffer.from(await files[i].arrayBuffer()));
      let meta;
      try {
        const { stdout } = await run(
          ffprobe,
          [
            "-v",
            "error",
            "-show_format",
            "-show_streams",
            "-of",
            "json",
            input,
          ],
          { timeout: 30000 },
        );
        meta = JSON.parse(stdout);
      } catch {
        throw new Error(
          "읽을 수 없는 영상입니다. MP4 또는 MOV 파일을 확인해주세요.",
        );
      }
      if (
        !meta.streams.some(
          (s: { codec_type: string }) => s.codec_type === "video",
        ) ||
        cuts[i].end > Number(meta.format.duration) + 0.15
      )
        throw new Error("선택한 구간이 영상 길이를 초과합니다.");
      const hasAudio = meta.streams.some(
        (s: { codec_type: string }) => s.codec_type === "audio",
      );
      const duration = String(cuts[i].end - cuts[i].start);
      const args = ["-y", "-ss", String(cuts[i].start), "-i", input];
      if (!hasAudio)
        args.push(
          "-f",
          "lavfi",
          "-i",
          "anullsrc=channel_layout=stereo:sample_rate=44100",
        );
      args.push(
        "-t",
        duration,
        "-map",
        "0:v:0",
        "-map",
        hasAudio ? "0:a:0" : "1:a:0",
        "-vf",
        "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x141c18,setsar=1,fps=30",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-af",
        "apad",
        "-video_track_timescale",
        "90000",
        join(dir, `cut-${i}.mp4`),
      );
      await run(ffmpeg, args, { timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    }
    for (const [kind, duration] of [
      ["intro", INTRO_SECONDS],
      ["outro", OUTRO_SECONDS],
    ] as const) {
      // Render time-based SVG frames; the browser uses the exact same renderer.
      for (let frame = 0; frame < duration * 30; frame++) {
        await sharp(Buffer.from(momentCard({ ...design, kind, time: frame / 30 })))
          .png().toFile(join(dir, `${kind}-${String(frame).padStart(3, "0")}.png`));
      }
      await run(
        ffmpeg,
        [
          "-y",
          "-stream_loop", "-1", "-i",
          join(dir, `cut-${kind === "intro" ? 0 : files.length - 1}.mp4`),
          "-framerate", "30", "-i", join(dir, `${kind}-%03d.png`),
          "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
          "-t", String(duration),
          "-filter_complex",
          `[0:v]eq=saturation=${design.theme === "night" ? 0.18 : 0.82}:contrast=1.04:brightness=-0.015,setsar=1[film];[film][1:v]overlay=0:0:shortest=1[v]`,
          "-map", "[v]", "-map", "2:a:0",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-ar",
          "44100",
          "-ac",
          "2",
          "-video_track_timescale",
          "90000",
          join(dir, `${kind}.mp4`),
        ],
        { timeout: 120000, maxBuffer: 4 * 1024 * 1024 },
      );
    }
    await writeFile(
      join(dir, "list.txt"),
      [
        "file 'intro.mp4'",
        ...files.map((_, i) => `file 'cut-${i}.mp4'`),
        "file 'outro.mp4'",
      ].join("\n"),
    );
    await run(
      ffmpeg,
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        join(dir, "list.txt"),
        "-t",
        "60",
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        join(dir, "morrow.mp4"),
      ],
      { timeout: 120000, maxBuffer: 4 * 1024 * 1024 },
    );
    const result = await readFile(join(dir, "morrow.mp4"));
    return new Response(result, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="moaon-moments.mp4"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && !("cmd" in error)
            ? error.message
            : "영상 변환에 실패했습니다. 다른 영상으로 다시 시도해주세요.",
      },
      { status: 400 },
    );
  } finally {
    try {
      if (dir) await rm(dir, { recursive: true, force: true });
    } finally {
      busy = false;
    }
  }
}
