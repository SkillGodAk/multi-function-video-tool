const ipPattern = /^[0-9]{1,3}(?:\.[0-9]{1,3}){3}$/;

export function normalizeRecord(input) {
  const userId = String(input.userId || "").trim().toLowerCase();
  const ip = String(input.ip || "").trim();
  const type = input.type === "reply" ? "reply" : "post";

  if (!/^[a-z0-9_-]{1,32}$/.test(userId)) return null;
  if (!ipPattern.test(ip)) return null;

  return {
    userId,
    ip,
    type,
    board: String(input.board || "").trim(),
    dateText: String(input.dateText || "").trim(),
    url: String(input.url || "").trim(),
    title: String(input.title || "").trim(),
  };
}

export function buildIpIndex(records) {
  const cleanRecords = records.filter(Boolean);
  const byIpMap = new Map();
  const byUserMap = new Map();

  for (const record of cleanRecords) {
    const ipEntry = byIpMap.get(record.ip) || { ip: record.ip, users: new Map(), evidenceCount: 0 };
    const ipUser = ipEntry.users.get(record.userId) || { userId: record.userId, evidenceCount: 0, evidence: [] };
    ipUser.evidenceCount += 1;
    ipUser.evidence.push(record);
    ipEntry.evidenceCount += 1;
    ipEntry.users.set(record.userId, ipUser);
    byIpMap.set(record.ip, ipEntry);

    const userEntry = byUserMap.get(record.userId) || { userId: record.userId, ips: new Map(), evidenceCount: 0 };
    const userIp = userEntry.ips.get(record.ip) || { ip: record.ip, evidenceCount: 0, evidence: [] };
    userIp.evidenceCount += 1;
    userIp.evidence.push(record);
    userEntry.evidenceCount += 1;
    userEntry.ips.set(record.ip, userIp);
    byUserMap.set(record.userId, userEntry);
  }

  return {
    generatedAt: new Date().toISOString(),
    records: cleanRecords,
    byIp: Object.fromEntries([...byIpMap.entries()].map(([ip, entry]) => [
      ip,
      {
        ip,
        evidenceCount: entry.evidenceCount,
        users: [...entry.users.values()]
          .map((user) => ({
            ...user,
            evidence: user.evidence.slice(0, 20),
          }))
          .sort((a, b) => b.evidenceCount - a.evidenceCount || a.userId.localeCompare(b.userId)),
      },
    ])),
    byUser: Object.fromEntries([...byUserMap.entries()].map(([userId, entry]) => [
      userId,
      {
        userId,
        evidenceCount: entry.evidenceCount,
        ips: [...entry.ips.values()]
          .map((ipEntry) => ({
            ...ipEntry,
            evidence: ipEntry.evidence.slice(0, 20),
          }))
          .sort((a, b) => b.evidenceCount - a.evidenceCount || a.ip.localeCompare(b.ip)),
      },
    ])),
  };
}

export function mergeIndex(existingIndex, newRecords) {
  const seen = new Set();
  const merged = [];

  for (const record of [...(existingIndex?.records || []), ...newRecords].filter(Boolean)) {
    const key = `${record.userId}|${record.ip}|${record.type}|${record.url}|${record.dateText}|${record.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(record);
  }

  return buildIpIndex(merged);
}

export function pickNextUsers(seedUsers, cursor, batchSize) {
  const seeds = seedUsers.map((user) => String(user).trim().toLowerCase()).filter(Boolean);
  if (seeds.length === 0) return { users: [], nextCursor: 0 };

  const users = [];
  let nextCursor = Math.max(0, Number(cursor) || 0) % seeds.length;
  for (let index = 0; index < Math.min(batchSize, seeds.length); index += 1) {
    users.push(seeds[nextCursor]);
    nextCursor = (nextCursor + 1) % seeds.length;
  }

  return { users, nextCursor };
}
