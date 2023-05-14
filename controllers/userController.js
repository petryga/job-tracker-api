const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, String(process.env.JWT_SECRET), {
    expiresIn: "7d",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, name, confirm_password } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Please enter an email");
  }

  if (!name) {
    res.status(400);
    throw new Error("Please enter a name");
  }

  if (!password || !confirm_password) {
    res.status(400);
    throw new Error("Please enter a password");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  if (!email.match(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/)) {
    res.status(400);
    throw new Error("Please enter a valid email");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    confirm_password,
  });

  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 86400000 * 7),
    sameSite: "none",
    secure: true,
  });

  if (user) {
    res.status(201).json({
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        password: user.password,
        token,
      },
      message: "User created successfully, please log in",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, confirm_password } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Please enter an email");
  }

  if (!password || !confirm_password) {
    res.status(400);
    throw new Error("Please enter a password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User does not exist, please sign up");
  }

  const isMatch = await bcrypt.compare(password, String(user.password));

  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 86400000 * 7), // 7d
    sameSite: "none",
    secure: true,
  });

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  const data = {
    _id: user._id,
    email: user.email,
    password: user.password,
    token,
    name: user.name,
  };

  if (user && isMatch) {
    res.status(200).json(data);
  }
});

module.exports = {
  registerUser,
  loginUser,
};
