const asyncHandler = require("express-async-handler");
const { Job, Contact } = require("../models/jobModel");
const { notFoundError } = require("./helpers");
const Board = require("../models/boardModel");
const mongoose = require("mongoose");

const getJob = asyncHandler(async (req, res) => {
  const { id: cardID } = req.params;
  const job = await Job.find({ cardID });
  if (!job) {
    return notFoundError("Job");
  }

  res.status(200).json(job[0]);
});

const updateJob = asyncHandler(async (req, res) => {
  const { id: jobID } = req.params;
  const {
    companyName,
    position,
    isFavorite,
    boardID,
    cardID,
    listID,
    contacts: formContacts,
    ...rest
  } = req.body;

  if (!companyName) {
    res.status(400);
    throw new Error("Please provide a company name");
  }

  const board = await Board.findById(boardID);
  if (!board) {
    return notFoundError(res, "Board");
  }

  // @ts-ignore
  const list = board.lists.find((list) => list._id == listID);
  if (!list) {
    return notFoundError(res, "List");
  }

  // @ts-ignore
  const card = list.cards.find((card) => card._id == cardID);
  if (!card) {
    return notFoundError(res, "Card");
  }
  card.text = companyName;
  card.subtext = position;
  card.isFavorite = isFavorite;

  const newId = new mongoose.Types.ObjectId();

  const updatedFormContacts = () => {
    return formContacts.map((contact) => {
      return {
        ...contact,
        jobID,
        companyName,
        _id: newId,
      };
    });
  };

  const updatedJob = await Job.findByIdAndUpdate(
    jobID,
    {
      companyName,
      position,
      isFavorite,
      contacts: updatedFormContacts(),
      ...rest,
    },
    { new: true }
  );

  if (!updatedJob) {
    return notFoundError("Job");
  }

  await board.save();
  res.status(200).json({ data: updatedJob, message: "Job updated" });
});



module.exports = { getJob, updateJob };
