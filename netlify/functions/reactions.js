/**
 * IP-capped like/love reactions for announcement posts.
 * Storage: Netlify Blobs JSON map announcementId -> { likes: { [ip]: true }, loves: { [ip]: true } }
 * Count = number of keys. Seed IPs are synthetic and never match real clients.
 */

const FLOCK_ID = "2026-09-11-flock-transparency";
const BLOB_KEY = "reactions";
const STORE_NAME = "hoa-reactions";

const SEED_LIKES = ["seed-like-1", "seed-like-2", "seed-like-3", "seed-like-4", "seed-like-5"];
const SEED_LOVES = ["seed-love-1", "seed-love-2", "seed-love-3"];

/** In-memory fallback when Blobs is unavailable (local `netlify dev` without credentials). */
let memoryStore = null;

function emptyAnnouncement() {
  return { likes: {}, loves: {} };
}

function ensureSeed(data) {
  if (!data || typeof data !== "object") data = {};
  if (!data[FLOCK_ID]) data[FLOCK_ID] = emptyAnnouncement();
  const entry = data[FLOCK_ID];
  if (!entry.likes || typeof entry.likes !== "object") entry.likes = {};
  if (!entry.loves || typeof entry.loves !== "object") entry.loves = {};
  let changed = false;
  for (const ip of SEED_LIKES) {
    if (!entry.likes[ip]) {
      entry.likes[ip] = true;
      changed = true;
    }
  }
  for (const ip of SEED_LOVES) {
    if (!entry.loves[ip]) {
      entry.loves[ip] = true;
      changed = true;
    }
  }
  data[FLOCK_ID] = entry;
  return { data, changed };
}

function getClientIp(event) {
  const nf = event.headers["x-nf-client-connection-ip"] || event.headers["X-NF-Client-Connection-Ip"];
  if (nf && String(nf).trim()) return String(nf).trim();
  const xff = event.headers["x-forwarded-for"] || event.headers["X-Forwarded-For"];
  if (xff) {
    const first = String(xff).split(",")[0].trim();
    if (first) return first;
  }
  const real = event.headers["x-real-ip"] || event.headers["X-Real-Ip"];
  if (real && String(real).trim()) return String(real).trim();
  return "unknown";
}

async function getBlobStore() {
  try {
    // Lazy require so local CRA / missing package does not crash the module load.
    // eslint-disable-next-line global-require, import/no-unresolved
    const { getStore } = require("@netlify/blobs");
    return getStore(STORE_NAME);
  } catch (err) {
    console.warn("Netlify Blobs unavailable, using memory store:", err && err.message);
    return null;
  }
}

async function readData(store) {
  if (!store) {
    if (!memoryStore) memoryStore = {};
    const { data, changed } = ensureSeed(memoryStore);
    memoryStore = data;
    return data;
  }
  try {
    const raw = await store.get(BLOB_KEY, { type: "json" });
    const { data, changed } = ensureSeed(raw && typeof raw === "object" ? raw : {});
    if (changed || !raw) {
      await store.setJSON(BLOB_KEY, data);
    }
    return data;
  } catch (err) {
    console.warn("Blob read failed, seeding empty:", err && err.message);
    const { data } = ensureSeed({});
    try {
      await store.setJSON(BLOB_KEY, data);
    } catch (e2) {
      console.warn("Blob write failed:", e2 && e2.message);
      memoryStore = data;
    }
    return data;
  }
}

async function writeData(store, data) {
  if (!store) {
    memoryStore = data;
    return;
  }
  try {
    await store.setJSON(BLOB_KEY, data);
  } catch (err) {
    console.warn("Blob write failed, memory only:", err && err.message);
    memoryStore = data;
  }
}

function summarize(data, ip, announcementId) {
  const announcements = {};
  const ids = announcementId ? [announcementId] : Object.keys(data);
  for (const id of ids) {
    const entry = data[id] || emptyAnnouncement();
    const likes = entry.likes || {};
    const loves = entry.loves || {};
    announcements[id] = {
      likes: Object.keys(likes).length,
      loves: Object.keys(loves).length,
      likedByMe: !!likes[ip],
      lovedByMe: !!loves[ip],
    };
  }
  return { announcements };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const ip = getClientIp(event);
  const store = await getBlobStore();

  try {
    if (event.httpMethod === "GET") {
      const qs = event.queryStringParameters || {};
      const data = await readData(store);
      return json(200, summarize(data, ip, qs.announcementId || null));
    }

    if (event.httpMethod === "POST") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Invalid JSON" });
      }
      const { announcementId, reaction, op } = body;
      if (!announcementId || typeof announcementId !== "string") {
        return json(400, { error: "announcementId required" });
      }
      if (reaction !== "like" && reaction !== "love") {
        return json(400, { error: "reaction must be like or love" });
      }
      if (op !== "add" && op !== "remove") {
        return json(400, { error: "op must be add or remove" });
      }
      if (ip === "unknown") {
        return json(400, { error: "Could not determine client IP" });
      }

      const data = await readData(store);
      if (!data[announcementId]) data[announcementId] = emptyAnnouncement();
      const entry = data[announcementId];
      if (!entry.likes) entry.likes = {};
      if (!entry.loves) entry.loves = {};
      const bucket = reaction === "like" ? entry.likes : entry.loves;

      if (op === "add") {
        bucket[ip] = true; // idempotent
      } else if (bucket[ip]) {
        delete bucket[ip]; // only own reaction
      }

      data[announcementId] = entry;
      // Re-ensure flock seed after mutations (in case store was empty)
      const seeded = ensureSeed(data);
      await writeData(store, seeded.data);

      return json(200, summarize(seeded.data, ip, announcementId));
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("reactions handler error:", err);
    return json(500, { error: "Internal error" });
  }
};
