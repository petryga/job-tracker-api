const asyncHandler = require("express-async-handler");
const { Job, Contact } = require("../models/jobModel");
const { notFoundError } = require("./helpers");
const Board = require("../models/boardModel");
const mongoose = require("mongoose");

const getJob = asyncHandler(async (req, res) => {
  const { id: cardID } = req.params;
  const job = await Job.findOne({ cardID, createdBy: req.userId });
  if (!job) return notFoundError(res, "Job");
  res.status(200).json(job);
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
    userId,
    createdBy,
    contacts = [],
    ...rest
  } = req.body;

  if (!companyName) {
    res.status(400).json({ message: "Please enter a company name" });
    return;
  }

  const board = await Board.findOne({ _id: boardID, createdBy: req.userId });
  if (!board) return notFoundError(res, "Board");

  const list = board.lists.find((list) => list._id == listID);
  if (!list) return notFoundError(res, "List");

  const card = list.cards.find((card) => card._id == cardID);
  if (!card) return notFoundError(res, "Card");

  card.text = companyName;
  card.subtext = position;
  card.isFavorite = isFavorite;

  const updatedContacts = contacts.map((contact) => ({
    createdBy: req.userId,
    contactName: contact.contactName,
    position: contact.position,
    contactEmail: contact.contactEmail,
    contactPhone: contact.contactPhone,
    contactNotes: contact.contactNotes,
    jobID,
    boardID,
    companyName,
    _id: contact._id ? contact._id : new mongoose.Types.ObjectId(),
  }));

  const updatedJob = await Job.findOneAndUpdate(
    { _id: jobID, createdBy: req.userId },
    { companyName, position, isFavorite, contacts: updatedContacts, ...rest },
    { returnDocument: "after" },
  );

  if (!updatedJob) return notFoundError(res, "Job");

  // Mirror the job's contacts into the standalone Contact collection. A failure
  // here rejects the request (500) rather than being swallowed, so the client
  // never sees "updated" over a partial write.
  await Promise.all(
    updatedJob.contacts.map(async (contact) => {
      const data = contact._doc ?? contact;
      const existingContact = await Contact.findById(data._id);
      if (existingContact) {
        existingContact.set(data);
        await existingContact.save();
      } else {
        await Contact.create(data);
      }
    }),
  );

  await board.save();
  res.status(200).json({ data: updatedJob, message: "Job updated" });
});

module.exports = { getJob, updateJob };
