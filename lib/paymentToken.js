import crypto from "crypto";

const TOKEN_SECRET = process.env.PAYMENT_SECRET || "super-secret-key";
const TOKEN_EXPIRY_MS = 1000 * 60 * 10; // 10 minutes

const usedTokens = new Set(); // replace with DB/Redis in production

export function generateToken(utr) {
  const payload = JSON.stringify({
    utr,
    ts: Date.now()
  });

  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");

  return Buffer.from(payload).toString("base64") + "." + signature;
}

export function verifyToken(token) {
  try {
    if (!token.includes(".")) return false;

    const [payload64, signature] = token.split(".");
    const payload = Buffer.from(payload64, "base64").toString();
    const data = JSON.parse(payload);

    const expectedSig = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSig !== signature) return false;

    if (Date.now() - data.ts > TOKEN_EXPIRY_MS) return false;

    if (usedTokens.has(token)) return false;

    return true;
  } catch {
    return false;
  }
}

export function markTokenUsed(token) {
  usedTokens.add(token);
}
