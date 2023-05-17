const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name"],
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [9, "Minimum password length is 9 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// @ts-ignore
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  // @ts-ignore
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
