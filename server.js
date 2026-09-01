const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app.js");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set — cannot start.");
  process.exit(1);
}
if (!process.env.SUPABASE_URL && process.env.AUTH_DISABLED !== "true") {
  console.error(
    'SUPABASE_URL is not set. Set it, or set AUTH_DISABLED=true to run without auth on purpose.',
  );
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => console.log(error.message));
