import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const sizes = [[320,568,2],[375,667,2],[414,736,3],[375,812,3],[360,780,3],[390,844,3],[393,852,3],[402,874,3],[414,896,2],[414,896,3],[428,926,3],[430,932,3],[440,956,3]];
const ghost = await readFile("public/yuri-app-mark.svg");
await mkdir("public/startup", { recursive: true });
for (const [width, height, scale] of sizes) {
  const w = width * scale, h = height * scale;
  const logoSize = Math.round(w * .32);
  const image = await sharp(ghost).resize(logoSize, logoSize).png().toBuffer();
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#314f78"/><text x="50%" y="${Math.round(h*.59)}" text-anchor="middle" fill="#f5faff" font-family="Arial,sans-serif" font-size="${Math.round(w*.065)}" font-weight="700" letter-spacing="-1">moaon.</text></svg>`);
  await sharp(background).composite([{ input: image, left: Math.round((w-logoSize)/2), top: Math.round(h*.43-logoSize/2) }]).png().toFile(join("public/startup", `${width}x${height}@${scale}.png`));
}
