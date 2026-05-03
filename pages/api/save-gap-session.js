// pages/api/save-gap-session.js
// Saves resume + JD into a temporary session so /api/skills-gap can
// retrieve it after payment is verified.
//
// Storage: in-memory (globalThis) — works out of the box, no Redis needed.
// For production, swap the store calls with Redis (see comments below).

import { randomUUID } from "crypto";

// ─── In-memory store ──────────────────────────────────────────────────────────
// globalThis persists across hot-reloads in Next.js dev.
// In production (serverless), each function instance has its own memory,
// so swap this with Redis/Upstash for multi-instance deployments.

function getStore() {
  if (!globalThis.__gapSessions) {
    globalThis.__gapSessions = new Map();
  }
  return globalThis.__gapSessions;
}

// Auto-expire sessions after 2 hours (in-memory TTL)
const TTL_MS = 2 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, resume, jd } = req.body;

    // ── Validate ─────────────────────────────────────────────────────────────
    if (!resume) {
      return res.status(400).json({ error: "resume is required" });
    }
    if (!jd || !jd.trim()) {
      return res.status(400).json({ error: "jd (job description) is required" });
    }

    // ── Generate a unique ID for this gap session ─────────────────────────────
    const gapSessionId = randomUUID();

    // ── Save to store ─────────────────────────────────────────────────────────
    const store = getStore();
    store.set(gapSessionId, {
      resume,
      jd,
      parentSessionId: sessionId || null,
      createdAt: Date.now(),
    });

    // ── Schedule cleanup (in-memory TTL) ──────────────────────────────────────
    setTimeout(() => {
      store.delete(gapSessionId);
      console.log(`[GapSession] Expired and removed: ${gapSessionId}`);
    }, TTL_MS);

    console.log(`[GapSession] Saved: ${gapSessionId}`);

    return res.status(200).json({ gapSessionId });

  } catch (err) {
    console.error("[save-gap-session] Error:", err);
    return res.status(500).json({ error: "Failed to save session. Please try again." });
  }
}

// ─── Export getter so /api/skills-gap can read the session ───────────────────
// Import this in skills-gap.js: import { getGapSession } from "./save-gap-session"
// Note: this only works when both routes run in the same process (dev / single server).
// For serverless/multi-instance prod → switch to Redis (see below).

export function getGapSession(gapSessionId) {
  const store = getStore();
  const session = store.get(gapSessionId);

  if (!session) return null;

  // Check if expired manually (belt-and-suspenders)
  if (Date.now() - session.createdAt > TTL_MS) {
    store.delete(gapSessionId);
    return null;
  }

  return session;
}

/*
─── Redis upgrade (for production / Vercel / serverless) ────────────────────────

npm install ioredis

import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

// In handler, replace store.set with:
await redis.set(
  `gap_session:${gapSessionId}`,
  JSON.stringify({ resume, jd, parentSessionId: sessionId }),
  "EX",
  60 * 60 * 2   // 2 hour TTL
);

// In getGapSession, replace store.get with:
const raw = await redis.get(`gap_session:${gapSessionId}`);
return raw ? JSON.parse(raw) : null;

─────────────────────────────────────────────────────────────────────────────── */