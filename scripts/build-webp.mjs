/**
 * Converts all JPG/PNG assets under images/ into optimised WebP in images/webp/.
 * Output names are derived from each file's relative path (kebab-case, flat).
 * Run: npm run build:images
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const imagesDir = path.join(root, "images");
const outDir = path.join(imagesDir, "webp");

const INPUT_EXT = new Set([".jpg", ".jpeg", ".png"]);

function kebabSegment(s) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** e.g. "Home/Game/Slots.jpg" -> "home-game-slots.webp" */
function toOutputName(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  const withoutExt = normalized.replace(/\.[^./\\]+$/i, "");
  const segments = withoutExt.split("/").map(kebabSegment).filter(Boolean);
  return `${segments.join("-")}.webp`;
}

async function collectSources(dir, base = dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path.resolve(full) === path.resolve(outDir)) continue;
      files.push(...(await collectSources(full, base)));
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!INPUT_EXT.has(ext)) continue;

    files.push(path.relative(base, full).replace(/\\/g, "/"));
  }

  return files;
}

async function convert(srcRel, destName, options = {}) {
  const src = path.join(imagesDir, ...srcRel.split("/"));
  const dest = path.join(outDir, destName);

  await fs.promises.mkdir(outDir, { recursive: true });

  let pipeline = sharp(src);
  if (options.resize) pipeline = pipeline.resize(options.resize);

  await pipeline
    .webp({
      quality: options.quality ?? 82,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(dest);

  const st = await fs.promises.stat(dest);
  console.log("ok", destName, `(${(st.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  const sources = (await collectSources(imagesDir)).sort();
  const usedNames = new Set();

  if (sources.length === 0) {
    console.log("No JPG/PNG files found under images/ (excluding webp/).");
  }

  for (const rel of sources) {
    const base = path.basename(rel);

    if (/logo/i.test(base) && /\.png$/i.test(base)) {
      await convert(rel, "logo-m99.webp", {
        quality: 90,
        resize: { width: 160, height: 160, fit: "inside", withoutEnlargement: true },
      });
      usedNames.add("logo-m99.webp");
      continue;
    }

    const destName = toOutputName(rel);
    if (usedNames.has(destName)) {
      console.warn("skip (name collision):", rel, "->", destName);
      continue;
    }

    await convert(rel, destName);
    usedNames.add(destName);
  }

  const ogSrc = path.join(imagesDir, "Hero Banner", "Slots.jpg");
  if (fs.existsSync(ogSrc)) {
    await fs.promises.mkdir(outDir, { recursive: true });
    await sharp(ogSrc)
      .resize(1200, 630, { fit: "cover", position: "attention" })
      .webp({ quality: 85, effort: 6 })
      .toFile(path.join(outDir, "og-share.webp"));
    console.log("ok og-share.webp (1200×630)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
