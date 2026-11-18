var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.mjs
var ORIGIN = "https://gurlbye.smatdesigns.com";
var DESTINATION = "jamonwidit@plushtrap.com";
var MAX_BYTES = 4096;
function json(status, value) {
  return Response.json(value, { status, headers: {
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff"
  } });
}
__name(json, "json");
function clean(value, max) {
  return typeof value === "string" ? value.trim().normalize("NFC").slice(0, max + 1) : "";
}
__name(clean, "clean");
function isEmail(v) {
  return v.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(v);
}
__name(isEmail, "isEmail");
function isPhone(v) {
  const digits = v.replace(/\D/g, "");
  return v.length <= 32 && /^[+0-9()\s.-]+$/.test(v) && digits.length >= 7 && digits.length <= 15;
}
__name(isPhone, "isPhone");
async function join(request, env) {
  if (request.method !== "POST") return json(405, { ok: false, message: "Method not allowed." });
  if (!env.EMAIL || !env.FORM_RATE_LIMITER) return json(503, { ok: false, message: "Registration is unavailable. Please try again later." });
  if (request.headers.get("origin") !== ORIGIN) return json(403, { ok: false, message: "Please submit from the Gurlbye website." });
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return json(403, { ok: false, message: "Please submit from the Gurlbye website." });
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || "")) return json(415, { ok: false, message: "Invalid submission type." });
  const declared = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declared) || declared > MAX_BYTES) return json(413, { ok: false, message: "Submission is too large." });
  let text;
  try {
    text = await request.text();
  } catch {
    return json(400, { ok: false, message: "Invalid submission." });
  }
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) return json(413, { ok: false, message: "Submission is too large." });
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { ok: false, message: "Invalid submission." });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json(422, { ok: false, message: "Please fill out all fields." });
  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 32);
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f\x7f<>]/.test(name) || !isEmail(email) || !isPhone(phone)) {
    return json(422, { ok: false, message: "Please check your name, email and phone number." });
  }
  if (body.website) return json(202, { ok: true, message: "Registration received." });
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip || ip.length > 80) return json(503, { ok: false, message: "Registration is temporarily unavailable." });
  try {
    const rate = await env.FORM_RATE_LIMITER.limit({ key: ip });
    if (!rate.success) return json(429, { ok: false, message: "Too many attempts. Please try again later." });
    const time = (/* @__PURE__ */ new Date()).toISOString();
    const result = await env.EMAIL.send({
      to: DESTINATION,
      from: "gurlbye@forms.smatdesigns.com",
      subject: "New Gurlbye Gurl Gang registration",
      text: "New Gurlbye registration\n\nName: " + name + "\nEmail: " + email + "\nPhone: " + phone + "\nSource: " + ORIGIN + "\nSubmitted: " + time + "\n"
    });
    if (Array.isArray(result?.permanent_bounces) && result.permanent_bounces.length) {
      return json(503, { ok: false, message: "Unable to process registration. Please retry." });
    }
    if (Array.isArray(result?.suppressed_recipients) && result.suppressed_recipients.length) {
      return json(503, { ok: false, message: "Unable to process registration. Please retry." });
    }
    return json(201, { ok: true, message: "Welcome to the Gurl Gang!" });
  } catch (error) {
    console.error("Email delivery failure category:", String(error?.code || error?.name || "unknown"), String(error?.message || "").slice(0, 300));
    return json(503, { ok: false, message: "Registration is temporarily unavailable. Please try again." });
  }
}
__name(join, "join");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/join") return join(request, env);
    if (url.pathname === "/__health") return json(200, { ok: true, site: "gurlbye", version: "v2", formBinding: !!env.EMAIL });
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    headers.set("x-frame-options", "DENY");
    headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    if (url.pathname === "/" || url.pathname.endsWith(".html")) headers.set("cache-control", "no-cache");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map