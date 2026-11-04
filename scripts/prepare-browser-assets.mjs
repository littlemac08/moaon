import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const core = dirname(require.resolve("@ffmpeg/core"));
const output = join(root, "public", "ffmpeg");
const wasm = await readFile(join(core, "ffmpeg-core.wasm"));
const size = 8 * 1024 * 1024;
const suffixes = ["aa", "ab", "ac", "ad"];
if (wasm.length <= size * 3 || wasm.length > size * 4) {
  throw new Error("FFmpeg core size changed. Update and test the browser loader before upgrading.");
}
await mkdir(output, { recursive: true });
await writeFile(join(output, "core.js"), await readFile(join(core, "ffmpeg-core.js")));
for (const [index, suffix] of suffixes.entries()) {
  await writeFile(join(output, `core.wasm.part-${suffix}`), wasm.subarray(index * size, (index + 1) * size));
}
console.log(`Prepared browser FFmpeg assets (${wasm.length} WASM bytes, four parts).`);
