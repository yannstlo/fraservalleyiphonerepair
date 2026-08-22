import { promises as fs } from "node:fs";

const requiredFiles = [
  "dist/index.html",
  "dist/contact/index.html",
  "dist/services/index.html",
  "dist/identify/index.html",
  "dist/museum/index.html",
  "dist/p/services.html",
  "dist/2023/04/iphone-11-screen-and-lcd-how-to-repair.html",
  "dist/sitemap-index.xml",
  "dist/CNAME",
];

const currentPageFiles = [
  "dist/index.html",
  "dist/contact/index.html",
  "dist/services/index.html",
  "dist/identify/index.html",
  "dist/museum/index.html",
  "dist/p/services.html",
];

const requiredText = [
  ["dist/index.html", "iPhone repair, handled clearly."],
  ["dist/index.html", "https://api.whatsapp.com/message/AOVXDEJODDRAJ1?autoload=1&app_absent=0"],
  ["dist/index.html", "https://m.me/FraserValleyiPhoneRepair"],
  ["dist/index.html", "imessage://yann@yann.ca"],
  ["dist/p/services.html", "Legacy services page"],
];

const blockedText = [
  "604-809-5169",
  "16048095169",
  "7709 Alpine",
  "Alpine Pl",
  "V2V 4T3",
  "tel:",
  "sms:",
  "mailto:",
  "call for details",
  "Call",
];

const failures = [];

for (const file of requiredFiles) {
  try {
    await fs.access(file);
  } catch {
    failures.push(`Missing required build output: ${file}`);
  }
}

for (const [file, text] of requiredText) {
  const html = await fs.readFile(file, "utf8");
  if (!html.includes(text)) {
    failures.push(`Expected ${file} to include ${text}`);
  }
}

for (const file of currentPageFiles) {
  const html = await fs.readFile(file, "utf8");
  for (const text of blockedText) {
    if (html.includes(text)) {
      failures.push(`Blocked text found in ${file}: ${text}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Build verification passed.");
