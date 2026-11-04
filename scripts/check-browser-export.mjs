/** Deterministic orchestration tests; no browser, server, upload, or real encoding.
 * Run: node scripts/check-browser-export.mjs
 * Real codec compatibility, rendered pixels and output timing still need browser QA.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { momentCard, momentThemes, INTRO_SECONDS, OUTRO_SECONDS } from '../lib/moment-design.mjs';

const source = await readFile(new URL('../lib/browser-export.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const corePaths = ['aa', 'ab', 'ac', 'ad'].map(s => `/ffmpeg/core.wasm.part-${s}`).concat('/ffmpeg/core.js');
const clip = (start, end) => ({ start, end, file: new File(['local-video'], 'clip.mp4', { type: 'video/mp4' }) });
const option = (args, key) => args[args.indexOf(key) + 1];

function harness(failure = '') {
  const state = { commands: [], writes: new Map(), deleted: [], urls: new Set(), requests: [], listeners: new Set(), terminated: 0, frames: 0 };
  class FFmpeg {
    async load(options) {
      assert.ok(state.urls.has(options.coreURL));
      assert.ok(state.urls.has(options.wasmURL));
      if (failure === 'load') throw new Error('load failed');
    }
    async writeFile(name, bytes) { state.writes.set(name, bytes); }
    async deleteFile(name) { state.deleted.push(name); }
    on(event, listener) { assert.equal(event, 'log'); state.listeners.add(listener); }
    off(event, listener) { assert.equal(event, 'log'); state.listeners.delete(listener); }
    async exec(args) {
      state.commands.push(Array.from(args));
      if (args.length === 2 && args[0] === '-i') {
        // FFmpeg probe returns nonzero without an output; this must not fail export.
        if (args[1] === 'input-0') for (const listener of state.listeners) listener({ message: 'Stream #0:1: Audio: aac' });
        return 1;
      }
      return failure === 'encode' ? 1 : 0;
    }
    async readFile(name) {
      assert.equal(name, 'result.mp4');
      return failure === 'read' ? 'unexpected string' : new Uint8Array([0, 0, 0, 24]);
    }
    terminate() { state.terminated++; }
  }
  let serial = 0;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports, module, Blob, File, Uint8Array, TextEncoder,
    require(name) {
      if (name === '@ffmpeg/ffmpeg') return { FFmpeg };
      if (name === './moment-design.mjs') return { momentCard, momentThemes, INTRO_SECONDS, OUTRO_SECONDS };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    async fetch(path, init) {
      // Any media upload, remote request or API call fails immediately.
      assert.ok(corePaths.includes(path), `Unexpected network request: ${path}`);
      assert.ok(!init?.body, 'The browser exporter must never upload a body');
      assert.ok(!init?.method || init.method === 'GET');
      state.requests.push(path);
      return { ok: failure !== 'fetch', arrayBuffer: async () => new ArrayBuffer(1), text: async () => '/* core */' };
    },
    URL: {
      createObjectURL() { const url = `blob:test-${serial++}`; state.urls.add(url); return url; },
      revokeObjectURL(url) { assert.ok(state.urls.delete(url), `Missing or duplicate URL cleanup: ${url}`); },
    },
    Image: class {
      set src(url) {
        assert.ok(state.urls.has(url));
        if (failure === 'image') this.onerror(); else this.onload();
      }
    },
    document: {
      createElement(kind) {
        assert.equal(kind, 'canvas');
        return {
          getContext: () => failure === 'canvas' ? null : {
            clearRect() {}, drawImage() { state.frames++; },
          },
          toBlob(callback, type) { assert.equal(type, 'image/png'); callback(failure === 'png' ? null : new Blob(['png'])); },
        };
      },
    },
  }, { filename: 'browser-export.test.cjs' });
  return { state, renderVideo: module.exports.renderVideo };
}

const { state, renderVideo } = harness();
// Exact 55-second clip budget plus 3+2-second cards reaches the 60-second limit.
const result = await renderVideo([clip(2, 27), clip(4, 34)], { theme: 'night' });
assert.equal(result.type, 'video/mp4');
assert.equal(result.size, 4);
assert.deepEqual(state.requests.slice().sort(), corePaths.slice().sort());
const cuts = state.commands.filter(args => /^cut-\d+\.mp4$/.test(args.at(-1)));
assert.equal(cuts.length, 2);
for (const [i, args] of cuts.entries()) {
  assert.equal(option(args, '-ss'), String([2, 4][i]));
  assert.equal(option(args, '-t'), String([25, 30][i]));
  assert.equal(option(args, '-c:v'), 'libx264');
  assert.equal(option(args, '-pix_fmt'), 'yuv420p');
  assert.equal(option(args, '-c:a'), 'aac');
  assert.equal(option(args, '-ar'), '44100');
  assert.equal(option(args, '-ac'), '2');
  assert.equal(option(args, '-af'), 'apad');
  assert.match(option(args, '-vf'), /scale=720:1280.*setsar=1,fps=30/);
  const maps = args.flatMap((arg, index) => arg === '-map' ? [args[index + 1]] : []);
  assert.deepEqual(maps, ['0:v:0', i === 0 ? '0:a:0' : '1:a:0']);
  assert.equal(args.includes('anullsrc=channel_layout=stereo:sample_rate=44100'), i === 1);
}
for (const [kind, seconds, input] of [['intro', 3, 'cut-0.mp4'], ['outro', 2, 'cut-1.mp4']]) {
  const args = state.commands.find(args => args.at(-1) === `${kind}.mp4`);
  assert.equal(option(args, '-t'), String(seconds));
  assert.equal(option(args, '-i'), input);
  assert.equal(option(args, '-framerate'), '10');
  assert.ok(args.includes('2:a:0'));
  assert.equal(option(args, '-r'), '30');
  assert.equal([...state.writes.keys()].filter(name => name.startsWith(`${kind}-`)).length, seconds * 10);
  assert.equal(state.deleted.filter(name => name.startsWith(`${kind}-`)).length, seconds * 10);
}
assert.equal(state.frames, 50);
assert.equal(new TextDecoder().decode(state.writes.get('list.txt')), "file 'intro.mp4'\nfile 'cut-0.mp4'\nfile 'cut-1.mp4'\nfile 'outro.mp4'");
const concat = state.commands.at(-1);
assert.equal(option(concat, '-t'), '60');
assert.equal(option(concat, '-c'), 'copy');
assert.equal(option(concat, '-movflags'), '+faststart');
assert.ok(state.deleted.includes('input-0') && state.deleted.includes('input-1'));
assert.equal(state.listeners.size, 0);
assert.equal(state.urls.size, 0);
assert.equal(state.terminated, 1);

for (const failure of ['fetch', 'load', 'encode', 'canvas', 'image', 'png', 'read']) {
  const { state, renderVideo } = harness(failure);
  await assert.rejects(() => renderVideo([clip(0, 1)], { theme: 'sage' }));
  assert.equal(state.terminated, 1, `${failure}: worker termination`);
  assert.equal(state.urls.size, 0, `${failure}: object URL cleanup`);
  assert.equal(state.listeners.size, 0, `${failure}: probe listener cleanup`);
}
// Metadata-only size fixtures keep this fast without allocating 250 MB of media.
function sizedClip(size) {
  const value = clip(0, 1);
  Object.defineProperty(value.file, 'size', { value: size });
  return value;
}
const maxBytes = 250 * 1024 * 1024;
for (const [name, clips, design] of [
  ['empty list', [], {}],
  ['13 clips', Array.from({ length: 13 }, () => clip(0, 1)), {}],
  ['non-File input', [{ start: 0, end: 1, file: new Blob(['video']) }], {}],
  ['negative start', [clip(-1, 1)], {}],
  ['reversed range', [clip(2, 1)], {}],
  ['zero length', [clip(0, 0)], {}],
  ['under 0.1 second', [clip(0, 0.099)], {}],
  ['NaN start', [clip(NaN, 1)], {}],
  ['infinite end', [clip(0, Infinity)], {}],
  ['over 55 second budget', [clip(0, 55.002)], {}],
  ['single oversized file', [sizedClip(maxBytes + 1)], {}],
  ['aggregate oversized files', [sizedClip(maxBytes / 2), sizedClip(maxBytes / 2 + 1)], {}],
  ['unknown theme', [clip(0, 1)], { theme: 'unknown' }],
]) {
  const { state, renderVideo } = harness();
  await assert.rejects(() => renderVideo(clips, design), name);
  assert.equal(state.requests.length, 0, `${name}: reject before loading assets`);
  assert.equal(state.commands.length, 0, `${name}: reject before encoding`);
}
for (const [name, clips, design] of [
  ['minimum duration', [clip(0, 0.1)], {}],
  ['12 clips', Array.from({ length: 12 }, () => clip(0, 1)), { theme: 'warm' }],
  ['exact size limit', [sizedClip(maxBytes)], { theme: 'sage' }],
  ['rounding tolerance', [clip(0, 55.0005)], { theme: 'night' }],
]) {
  const { state, renderVideo } = harness();
  const result = await renderVideo(clips, design);
  assert.equal(result.type, 'video/mp4', name);
  assert.equal(state.urls.size, 0, `${name}: object URL cleanup`);
  assert.equal(state.terminated, 1, `${name}: worker termination`);
}
console.log('PASS browser export: trim ranges, mixed audio, 3+2s cards, 60s cap, local-only assets, seven failure cleanup paths, and input validation boundaries.');
console.log('Scope: mocked orchestration only; real browser encoding, pixels and decoded timing are not asserted.');
