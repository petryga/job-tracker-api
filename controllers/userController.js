const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Board = require("../models/boardModel");
const { Job } = require("../models/jobModel");

const generateToken = (id) => {
  return jwt.sign({ id }, String(process.env.JWT_SECRET), {
    expiresIn: "7d",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, name, confirm_password } = req.body;
  if (!email) {
    res.status(400).json({ message: "Please enter an email" });
    return;
  }

  if (!name) {
    res.status(400).json({ message: "Please enter a name" });
    return;
  }

  if (!password || !confirm_password) {
    res.status(400).json({ message: "Please enter a password" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  if (!email.match(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/)) {
    res.status(400).json({ message: "Please enter a valid email" });
    return;
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
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
    res.status(400).json({ message: "Invalid user data" });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ message: "Please enter an email" });
    return;
  }

  if (!password) {
    res.status(400).json({ message: "Please enter a password" });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({ message: "User does not exist, please sign up" });
    return;
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
    res.status(400).json({ message: "Invalid credentials" });
    return;
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

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  const boards = await Board.find({ createdBy: req.params.userId });
  if (boards) {
    boards.forEach(async (board) => {
      await board.deleteOne();
    });
  }

  const jobs = await Job.find({ createdBy: req.params.userId });
  if (jobs) {
    jobs.forEach(async (job) => {
      await job.deleteOne();
    });
  }

  if (user) {
    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } else {
    res.status(404).json({ message: "User not found" });
    return;
  }
});

module.exports = {
  registerUser,
  loginUser,
  deleteUser,
};
