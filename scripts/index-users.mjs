import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  buildIpIndex,
  mergeIndex,
  normalizeRecord,
  pickNextUsers,
} from "./index-core.mjs";

const seedPath = "data/seed-users.json";
const indexPath = "data/ip-index.json";
const statePath = "data/index-state.json";
const batchSize = Number(process.env.PTT_INDEX_BATCH_SIZE || 3);
const perUserLimit = Number(process.env.PTT_INDEX_PER_USER_LIMIT || 30);

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 ptt-ip-indexer/0.1",
      "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
      cookie: "over18=1",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value) {
  return decodeHtml(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function absolutePttwebUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://www.pttweb.cc${path.startsWith("/") ? path : `/${path}`}`;
}

function splitThreadItems(html) {
  return html.match(/<div class="thread-item[\s\S]*?(?=<div class="thread-item|$)/g) || [];
}

function parseArticleIp(html) {
  const text = cleanText(html);
  return text.match(/(?:\u4f86\u81ea|from):\s*([0-9]{1,3}(?:\.[0-9]{1,3}){3})/i)?.[1] || null;
}

function parseItems(userId, html, type, limit) {
  const records = [];
  for (const item of splitThreadItems(html)) {
    if (records.length >= limit) break;
    const href = decodeHtml(item.match(/<a href="([^"]*\/bbs\/[^"]*\/M\.[^"]+)"/)?.[1] || "");
    if (!href) continue;

    const meta = cleanText(item.match(/<span class="ml-3 grey--text text--lighten-1"[^>]*>([\s\S]*?)<\/span>/)?.[1] || "");
    const replyIp = meta.match(/([0-9]{1,3}(?:\.[0-9]{1,3}){3})/)?.[1] || null;
    const title = cleanText(item.match(/<span class="thread-title"[^>]*>([\s\S]*?)<\/span>/)?.[1] || "");
    const board = cleanText(item.match(/<span class="thread-list-board"[^>]*>\[\s*([^\]]+)\s*\]<\/span>/)?.[1] || "");
    const dateText = type === "reply"
      ? meta.replace(replyIp || "", "").trim()
      : cleanText(item.match(/<span class="thread-posttime"[^>]*>(20\d{2}\/\d{1,2}\/\d{1,2}(?:\s+\d{1,2}:\d{2})?)<\/span>/)?.[1] || "");

    records.push({
      userId,
      ip: replyIp,
      type,
      board,
      dateText,
      url: absolutePttwebUrl(href),
      title,
    });
  }
  return records;
}

async function crawlUser(userId, limit) {
  const articleHtml = await fetchText(`https://www.pttweb.cc/user/${encodeURIComponent(userId)}?t=article&page=1`);
  const messageHtml = await fetchText(`https://www.pttweb.cc/user/${encodeURIComponent(userId)}?t=message&page=1`);
  const articleRecords = parseItems(userId, articleHtml, "post", limit);
  const replyRecords = parseItems(userId, messageHtml, "reply", limit);

  for (const record of articleRecords) {
    if (record.ip) continue;
    try {
      record.ip = parseArticleIp(await fetchText(record.url));
    } catch {
      record.ip = null;
    }
  }

  return [...articleRecords, ...replyRecords].map(normalizeRecord).filter(Boolean);
}

const seeds = await readJson(seedPath, ["a22663564", "arelies"]);
const state = await readJson(statePath, { cursor: 0 });
const existingIndex = await readJson(indexPath, buildIpIndex([]));
const { users, nextCursor } = pickNextUsers(seeds, state.cursor, batchSize);

const newRecords = [];
for (const user of users) {
  console.log(`Indexing ${user}`);
  try {
    newRecords.push(...await crawlUser(user, perUserLimit));
  } catch (error) {
    console.error(`Failed ${user}: ${error instanceof Error ? error.message : error}`);
  }
}

const nextIndex = mergeIndex(existingIndex, newRecords);
await writeJson(indexPath, nextIndex);
await writeJson(statePath, {
  cursor: nextCursor,
  lastRunAt: new Date().toISOString(),
  lastUsers: users,
  newRecordCount: newRecords.length,
  totalRecordCount: nextIndex.records.length,
});

console.log(`Indexed ${newRecords.length} new records. Total records: ${nextIndex.records.length}`);
