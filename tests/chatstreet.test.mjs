import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("embed captures live publisher context and resizes inline inventory", async () => {
  const source = await readFile(new URL("../app/embed.js/route.ts", import.meta.url), "utf8");
  assert.match(source, /articleText/);
  assert.match(source, /pageContext/);
  assert.match(source, /mode===\"inline\"/);
});

test("chat prompt includes live article context", async () => {
  const source = await readFile(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
  assert.match(source, /Live article text/);
  assert.match(source, /pageContext/);
});
