const express = require("express");
const cors = require("cors");

const boardRoute = require("./routes/boardRoute.js");
const jobRoute = require("./routes/jobRoute.js");
const contactRoute = require("./routes/contactRoute.js");
const allowedOrigins = require("./config/allowedOrigins.js");
const { requireAuth } = require("./middleware/auth.js");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Unauthenticated: hosting platforms ping this to check the container is up.
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Everything below requires a valid Supabase access token.
app.use(requireAuth);

app.use("/api/boards", boardRoute);
app.use("/api/jobs", jobRoute);
app.use("/api/contacts", contactRoute);

module.exports = app;
