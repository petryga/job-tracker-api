const asyncHandler = require("express-async-handler");
const Board = require("../models/boardModel");
const { Job, Contact } = require("../models/jobModel");

// Authentication (signup / login / sessions / password reset) is handled by
// Supabase Auth. This endpoint just lets a user erase everything they own.
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.userId;

  await Promise.all([
    Board.deleteMany({ createdBy: userId }),
    Job.deleteMany({ createdBy: userId }),
    Contact.deleteMany({ createdBy: userId }),
  ]);

  res.status(200).json({ message: "Account data deleted" });
});

module.exports = { deleteMe };
