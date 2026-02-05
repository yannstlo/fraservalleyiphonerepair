#!/usr/bin/env node
/**
 * Import Blogger ATOM feed into Astro Content Collection markdown files.
 *
 * Usage:
 *   node scripts/import-blogger-atom.mjs \
 *     --feed "https://www.fraservalleyiphonerepair.com/feeds/posts/default" \
 *     --out "src/content/blog"
 *
 * Notes:
 * - This keeps the post body as HTML inside the markdown file (Astro supports this).
 * - It attempts to pull tags from <category term="..."/> on each entry.
 * - It uses the <link rel="alternate"> as originalUrl.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

function parseArgs(argv) {
  const out = { feed: null, outDir: "src/content/blog", limit: 1000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--feed") out.feed = argv[++i];
    else if (a === "--out") out.outDir = argv[++i];
    else if (a === "--limit") out.limit = Number(argv[++i]);
    else if (a === "-h" || a === "--help") out.help = true;
  }
  return out;
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    // numeric entities
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

function toYamlString(s) {
  // simple, safe JSON-style quoting (YAML compatible)
  return JSON.stringify(s ?? "");
}

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

async function fetchAllEntries(feedBaseUrl, limit = 1000) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
  });

  const entries = [];
  let nextUrl = `${feedBaseUrl}?max-results=150`;

  while (nextUrl && entries.length < limit) {
    const xml = await fetchText(nextUrl);
    const doc = parser.parse(xml);
    const feed = doc.feed;
    const batch = asArray(feed.entry);
    entries.push(...batch);

    const links = asArray(feed.link);
    const next = links.find((l) => l["@_rel"] === "next");
    nextUrl = next?.["@_href"] || null;

    process.stdout.write(`Fetched ${entries.length} posts...\n`);
    if (!batch.length) break;
  }

  return entries.slice(0, limit);
}

function pickAlternateUrl(entry) {
  const links = asArray(entry.link);
  const alt = links.find((l) => l["@_rel"] === "alternate");
  return alt?.["@_href"] || null;
}

function pickCategories(entry) {
  const cats = asArray(entry.category);
  return cats
    .map((c) => c?.["@_term"])
    .filter(Boolean)
    .map((t) => String(t).trim())
    // avoid thousands of extremely generic historical tags if they exist
    .filter((t) => t.length && t.length <= 40)
    .slice(0, 12);
}

function extractContentHtml(entry) {
  // entry.content can be string or object with #text
  const c = entry.content;
  const raw = typeof c === "string" ? c : (c?.["#text"] ?? c?.["@_type"] ? c?.["#text"] : "");
  return decodeHtmlEntities(String(raw || "").trim());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.feed) {
    console.log("Usage: node scripts/import-blogger-atom.mjs --feed <ATOM_URL> [--out <dir>] [--limit N]");
    process.exit(args.feed ? 0 : 1);
  }

  const outDir = path.resolve(args.outDir);
  await fs.mkdir(outDir, { recursive: true });

  const entries = await fetchAllEntries(args.feed, args.limit);

  const used = new Map();
  let written = 0;

  for (const entry of entries) {
    const title = typeof entry.title === "string" ? entry.title : (entry.title?.["#text"] ?? entry.title?.["@_type"] ? entry.title?.["#text"] : "");
    const published = entry.published;
    const updated = entry.updated;
    const pubDate = new Date(published);

    const originalUrl = pickAlternateUrl(entry);
    const tags = pickCategories(entry);

    const baseSlug = originalUrl
      ? originalUrl.split("/").filter(Boolean).pop()?.replace(/\.html$/i, "")
      : slugify(title);

    let slug = slugify(baseSlug || title);
    const datePrefix = pubDate.toISOString().slice(0, 10);
    let filename = `${datePrefix}-${slug}.md`;

    const count = used.get(filename) || 0;
    if (count) filename = `${datePrefix}-${slug}-${count + 1}.md`;
    used.set(filename, count + 1);

    const bodyHtml = extractContentHtml(entry);

    const md = [
      "---",
      `title: ${toYamlString(String(title || "Untitled").trim())}`,
      originalUrl ? `originalUrl: ${toYamlString(originalUrl)}` : null,
      `pubDate: ${datePrefix}`,
      updated ? `updatedDate: ${new Date(updated).toISOString().slice(0, 10)}` : null,
      tags.length ? `tags: [${tags.map((t) => toYamlString(t)).join(", ")}]` : null,
      "---",
      "",
      bodyHtml || "",
      "",
    ].filter(Boolean).join("\n");

    await fs.writeFile(path.join(outDir, filename), md, "utf8");
    written++;
  }

  console.log(`\nWrote ${written} markdown files to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
