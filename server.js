const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const userRoute = require("./routes/userRoute.js");
const boardRoute = require("./routes/boardRoute.js");
const jobRoute = require("./routes/jobRoute.js");
const contactRoute = require("./routes/contactRoute.js");
const allowedOrigins = require("./config/allowedOrigins.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS Configuration
app.use(
  cors({
    origin: allowedOrigins, // TODO move to env
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Routes
app.use("/api/users", userRoute);
app.use("/api/boards", boardRoute);
app.use("/api/jobs", jobRoute);
app.use("/api/contacts", contactRoute);

// Connect to MongoDB and start server
mongoose
  // @ts-ignore
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => console.log(error.message));
