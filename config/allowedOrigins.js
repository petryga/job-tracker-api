// Comma-separated list of origins allowed to call this API (CORS). Set
// CORS_ORIGIN to the deployed frontend's URL in production; defaults to the
// local Vite dev server.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = allowedOrigins;
