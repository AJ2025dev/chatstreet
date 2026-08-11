import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("embed captures live publisher context and resizes inline inventory", async () => {
  const source = await readFile(new URL("../app/embed.js/route.ts", import.meta.url), "utf8");
  assert.match(source, /articleText/);
  assert.match(source, /pageContext/);
  assert.match(source, /mode===\"inline\"/);
  assert.match(source, /impressionId/);
  assert.match(source, /insertionOrderId/);
  assert.match(source, /auctionId/);
});

test("chat prompt includes live article context", async () => {
  const source = await readFile(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
  assert.match(source, /Live article text/);
  assert.match(source, /pageContext/);
});

test("widget separates a load from a single engaged session", async () => {
  const source = await readFile(new URL("../app/widget/widget.tsx", import.meta.url), "utf8");
  assert.match(source, /type: "unit_loaded"/);
  assert.match(source, /engagedRef\.current/);
  assert.match(source, /track\("engagement_start"\)/);
});

test("analytics exposes reconciliation dimensions and CSV export", async () => {
  const source = await readFile(new URL("../app/api/analytics/route.ts", import.meta.url), "utf8");
  assert.match(source, /matchedImpressions/);
  assert.match(source, /format.*csv/);
  assert.match(source, /text\/csv/);
});
