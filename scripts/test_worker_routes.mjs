import assert from "node:assert/strict";
import test from "node:test";
import worker from "../_worker.js";

const assets = { fetch: async () => new Response("public HTML", { status: 200 }) };

test("www URLs redirect to the canonical apex and preserve queries", async () => {
  const res = await worker.fetch(new Request("https://www.smatdesigns.com/software/?ref=search"), { ASSETS: assets });
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://smatdesigns.com/software/?ref=search");
});

test("hub trailing slash redirects without losing the query", async () => {
  const res = await worker.fetch(new Request("https://smatdesigns.com/hub/?ref=search"), { ASSETS: assets });
  assert.equal(res.status, 308);
  assert.equal(res.headers.get("location"), "https://smatdesigns.com/hub?ref=search");
});

test("public portfolio URLs use the static asset boundary", async () => {
  const res = await worker.fetch(new Request("https://smatdesigns.com/software/"), { ASSETS: assets });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "public HTML");
});

test("private intelligence responses retain upstream authentication", async () => {
  const originalFetch = globalThis.fetch;
  const paths = ["/api/intelligence/hub-funnel", "/api/intelligence/hub-conversions"];
  try {
    globalThis.fetch = async (request) => {
      assert.equal(new URL(request.url).hostname, "commerce-os.smatdesigns.com");
      return new Response('{"error":"unauthorized"}', { status: 401, headers: { "content-type": "application/json" } });
    };
    for (const path of paths) {
      const res = await worker.fetch(new Request("https://smatdesigns.com" + path), { ASSETS: assets });
      assert.equal(res.status, 401, path);
      assert.equal(res.headers.get("x-hub-origin"), "smatdesigns-pages");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
