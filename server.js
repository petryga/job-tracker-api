const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app.js");

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
mongoose
  // @ts-ignore
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => console.log(error.message));
