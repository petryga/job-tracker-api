const { createRemoteJWKSet, jwtVerify } = require("jose");

// Verification against Supabase's JWKS (asymmetric ES256/RS256) — the API only
// needs SUPABASE_URL, never a shared secret. Cached because createRemoteJWKSet
// keeps its own key cache and re-fetches on rotation.
let cachedJwks = null;
const getJwks = (supabaseUrl) => {
  if (!cachedJwks) {
    const url = new URL(
      `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`,
    );
    cachedJwks = createRemoteJWKSet(url);
  }
  return cachedJwks;
};

const requireAuth = async (req, res, next) => {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    // Only run unauthenticated when it was asked for explicitly (local dev, CI).
    // Otherwise fail closed rather than serving every request as one anonymous user.
    if (process.env.AUTH_DISABLED === "true") {
      req.userId = process.env.AUTH_DISABLED_USER_ID || null;
      return next();
    }
    console.error(
      'SUPABASE_URL is not set and AUTH_DISABLED is not "true" — refusing to serve unauthenticated requests.',
    );
    return res.status(500).json({ message: "Server auth is not configured" });
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(supabaseUrl), {
      algorithms: ["ES256", "RS256"],
    });
    if (!payload.sub) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { requireAuth };
