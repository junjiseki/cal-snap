/**
 * 既存アイコンを約 80% に縮小して中央配置（maskable のセーフゾーン想定）。
 * 背景はライトテーマ色（manifest の theme に合わせる）。
 *
 * Usage: node scripts/generate-pwa-maskable-icons.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

const BG = { r: 255, g: 243, b: 199, alpha: 1 };
const SAFE_RATIO = 0.8;

async function makeMaskable(size, srcName, outName) {
  const inner = Math.round(size * SAFE_RATIO);
  const srcPath = path.join(publicDir, srcName);
  const input = await readFile(srcPath);
  const resized = await sharp(input)
    .resize(inner, inner, { fit: "contain", background: BG })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: resized,
        left: Math.floor((size - inner) / 2),
        top: Math.floor((size - inner) / 2),
      },
    ])
    .png()
    .toFile(path.join(publicDir, outName));
}

await makeMaskable(192, "icon-192.png", "icon-192-maskable.png");
await makeMaskable(512, "icon-512.png", "icon-512-maskable.png");
console.log("Wrote public/icon-192-maskable.png, public/icon-512-maskable.png");
