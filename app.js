const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoute = require("./routes/userRoute.js");
const boardRoute = require("./routes/boardRoute.js");
const jobRoute = require("./routes/jobRoute.js");
const contactRoute = require("./routes/contactRoute.js");
const allowedOrigins = require("./config/allowedOrigins.js");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS Configuration
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Routes
app.use("/api/users", userRoute);
app.use("/api/boards", boardRoute);
app.use("/api/jobs", jobRoute);
app.use("/api/contacts", contactRoute);

module.exports = app;
