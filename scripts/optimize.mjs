import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = "G:\\My Drive\\Motion Carpenters - Website Photos";
const outDir = path.resolve("public/images");
const thumbDir = path.join(outDir, "thumbs");

const photos = [
  "tv-unit-hero.jpeg",
  "tv-unit-1.jpeg",
  "tv-unit-2.jpeg",
  "tv-unit-3.jpeg",
  "tv-unit-4.jpeg",
  "tv-unit-5.jpeg",
  "kitchen-1.jpeg",
  "kitchen-2.jpeg",
  "kitchen-3.jpeg",
  "kitchen-4.jpeg",
  "wardrobe-1.jpeg",
  "wardrobe-2.jpeg",
  "wardrobe-3.jpeg",
  "other-1.jpeg",
  "other-2.jpeg",
  "other-3.jpeg",
];

const skipped = ["duplicate-10.jpeg"];

function pixelIndex(x, y, width, channels) {
  return (y * width + x) * channels;
}

function isBarSample(data, index) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  return r < 28 && g < 28 && b < 28;
}

function largestBand(length, isBar) {
  let best = null;
  let start = null;
  for (let i = 0; i < length; i += 1) {
    const bar = isBar(i);
    if (!bar && start === null) start = i;
    if ((bar || i === length - 1) && start !== null) {
      const end = bar ? i - 1 : i;
      if (end >= start && (!best || end - start > best[1] - best[0])) best = [start, end];
      start = null;
    }
  }
  return best;
}

function findCrop(data, width, height, channels) {
  const rowIsBar = (y) => {
    let dark = 0;
    let sum = 0;
    for (let x = 0; x < width; x += 1) {
      const index = pixelIndex(x, y, width, channels);
      sum += (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (isBarSample(data, index)) dark += 1;
    }
    return sum / width < 28 || dark / width > 0.85;
  };
  const rowBand = largestBand(height, rowIsBar);
  if (!rowBand) return null;

  const top = rowBand[0];
  const cropHeight = rowBand[1] - top + 1;
  const trimmed = top > 8 || height - cropHeight - top > 8;
  if (!trimmed) return null;
  if (cropHeight < height * 0.45) return null;
  return { left: 0, top, width, height: cropHeight };
}

async function orientedPipeline(filePath) {
  const base = sharp(filePath, { failOn: "error" }).rotate();
  const { data, info } = await base
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const crop = findCrop(data, info.width, info.height, info.channels);
  let pipeline = sharp(filePath, { failOn: "error" }).rotate();
  if (crop) pipeline = pipeline.extract(crop);
  return { pipeline, crop };
}

async function writeVariants(fileName) {
  const sourcePath = path.join(sourceDir, fileName);
  const fileStat = await stat(sourcePath);
  if (fileStat.size < 1000) {
    throw new Error(`${fileName} looks empty or still syncing (${fileStat.size} bytes)`);
  }

  const id = path.parse(fileName).name;
  const { pipeline, crop } = await orientedPipeline(sourcePath);
  const fullPath = path.join(outDir, `${id}.webp`);
  const thumbPath = path.join(thumbDir, `${id}.webp`);

  const full = await pipeline
    .clone()
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toFile(fullPath);

  const thumb = await pipeline
    .clone()
    .resize({
      width: 640,
      height: 640,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 68 })
    .toFile(thumbPath);

  let og = null;
  if (id === "tv-unit-hero") {
    const ogPath = path.join(outDir, "og.jpg");
    og = await pipeline
      .clone()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(ogPath);
  }

  return {
    id,
    bytes: fileStat.size,
    crop,
    full: { width: full.width, height: full.height, size: full.size },
    thumb: { width: thumb.width, height: thumb.height, size: thumb.size },
    og,
  };
}

async function removeStrayOriginals() {
  const entries = await readdir(outDir, { withFileTypes: true });
  const allowed = new Set(["thumbs", "og.jpg", ...photos.map((name) => `${path.parse(name).name}.webp`)]);
  for (const entry of entries) {
    if (!allowed.has(entry.name)) {
      await unlink(path.join(outDir, entry.name));
      console.log(`removed stray ${entry.name}`);
    }
  }
}

await mkdir(thumbDir, { recursive: true });
console.log(`skipped: ${skipped.join(", ")}`);

const results = [];
for (const fileName of photos) {
  const result = await writeVariants(fileName);
  results.push(result);
  const cropNote = result.crop
    ? ` cropped ${result.crop.width}x${result.crop.height} @ ${result.crop.left},${result.crop.top}`
    : "";
  console.log(
    `${result.id}: ${result.full.width}x${result.full.height} ${result.full.size}B${cropNote}`,
  );
}

await removeStrayOriginals();
console.log(JSON.stringify(results, null, 2));
