const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoute = require("./routes/userRoute.js");
const boardRoute = require("./routes/boardRoute.js");
const jobRoute = require("./routes/jobRoute.js");
const errorHandler = require("./middleware/errorMiddleware.js");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const allowedOrigins = require("./config/allowedOrigins.js");

const app = express();

const PORT = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

//routes middleware
app.use("/api/users", userRoute);
app.use("/api/boards", boardRoute);
app.use("/api/jobs", jobRoute);

//routes
app.get("/", (_req, res) => {
  res.send("Home page");
});

//error middleware
app.use(errorHandler);

//connect to db and start server
mongoose
  .connect(String(process.env.MONGODB_URI))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => console.log(error.message));
