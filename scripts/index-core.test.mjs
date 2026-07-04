import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIpIndex,
  mergeIndex,
  normalizeRecord,
  pickNextUsers,
} from "./index-core.mjs";

test("normalizeRecord keeps only valid user/ip evidence fields", () => {
  const record = normalizeRecord({
    userId: " AreLies ",
    ip: " 162.120.248.120 ",
    type: "reply",
    board: "Gossiping",
    dateText: "2026/07/03",
    url: "https://example.test/article",
    title: "hello",
  });

  assert.deepEqual(record, {
    userId: "arelies",
    ip: "162.120.248.120",
    type: "reply",
    board: "Gossiping",
    dateText: "2026/07/03",
    url: "https://example.test/article",
    title: "hello",
  });
});

test("buildIpIndex groups users by shared ip", () => {
  const index = buildIpIndex([
    normalizeRecord({ userId: "a", ip: "1.1.1.1", type: "post", url: "u1" }),
    normalizeRecord({ userId: "b", ip: "1.1.1.1", type: "reply", url: "u2" }),
    normalizeRecord({ userId: "a", ip: "2.2.2.2", type: "post", url: "u3" }),
  ]);

  assert.deepEqual(Object.keys(index.byIp).sort(), ["1.1.1.1", "2.2.2.2"]);
  assert.deepEqual(index.byIp["1.1.1.1"].users.map((user) => user.userId), ["a", "b"]);
  assert.equal(index.byUser.a.ips.length, 2);
});

test("mergeIndex de-duplicates evidence by user/ip/type/url", () => {
  const existing = buildIpIndex([
    normalizeRecord({ userId: "a", ip: "1.1.1.1", type: "post", url: "u1" }),
  ]);
  const merged = mergeIndex(existing, [
    normalizeRecord({ userId: "a", ip: "1.1.1.1", type: "post", url: "u1" }),
    normalizeRecord({ userId: "b", ip: "1.1.1.1", type: "reply", url: "u2" }),
  ]);

  assert.equal(merged.records.length, 2);
  assert.equal(merged.byIp["1.1.1.1"].users.length, 2);
});

test("pickNextUsers rotates through seed list using cursor", () => {
  assert.deepEqual(pickNextUsers(["a", "b", "c"], 0, 2), { users: ["a", "b"], nextCursor: 2 });
  assert.deepEqual(pickNextUsers(["a", "b", "c"], 2, 2), { users: ["c", "a"], nextCursor: 1 });
});
