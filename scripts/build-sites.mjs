import { cp, mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (args, cwd, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
  child.on("error", reject);
  child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Build failed (${signal || code}).`)));
});

await run([join(root, "scripts/prepare-browser-assets.mjs")], root);
// Build from a temporary copy: never remove or rewrite the native API source.
await mkdir(join(root, ".sites-build"), { recursive: true });
const stage = await mkdtemp(join(root, ".sites-build", "build-"));
try {
  for (const name of ["app", "lib", "public", "package.json", "next.config.mjs", "tsconfig.json", "next-env.d.ts"]) {
    await cp(join(root, name), join(stage, name), {
      recursive: true,
      filter: (source) => source !== join(root, "app", "api"),
    });
  }
  await symlink(join(root, "node_modules"), join(stage, "node_modules"), "junction");
  await run([join(root, "node_modules/next/dist/bin/next"), "build"], stage, {
    MOAON_STATIC_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1",
  });
  // Keep the last successful output until the new build succeeds.
  await rm(join(root, "out"), { recursive: true, force: true });
  await cp(join(stage, "out"), join(root, "out"), { recursive: true });
  console.log("Static browser-only build ready in out/. Native API source is unchanged.");
} finally {
  await rm(stage, { recursive: true, force: true });
}
