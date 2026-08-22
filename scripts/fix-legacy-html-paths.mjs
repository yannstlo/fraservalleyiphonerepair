import { promises as fs } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findLegacyHtmlDirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.name.endsWith(".html") && (await exists(path.join(fullPath, "index.html")))) {
      matches.push(fullPath);
      continue;
    }

    matches.push(...(await findLegacyHtmlDirs(fullPath)));
  }

  return matches;
}

const legacyDirs = await findLegacyHtmlDirs(distDir);

for (const legacyDir of legacyDirs) {
  const indexPath = path.join(legacyDir, "index.html");
  const html = await fs.readFile(indexPath);
  const targetPath = legacyDir;
  const tempPath = `${legacyDir}.tmp`;

  await fs.writeFile(tempPath, html);
  await fs.rm(legacyDir, { recursive: true, force: true });
  await fs.rename(tempPath, targetPath);
}

console.log(`Converted ${legacyDirs.length} legacy Blogger .html route(s).`);
