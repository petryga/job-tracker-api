const asyncHandler = require("express-async-handler");
const { Job, Contact } = require("../models/jobModel");
const { notFoundError } = require("./helpers");
const Board = require("../models/boardModel");
const mongoose = require("mongoose");

const getJob = asyncHandler(async (req, res) => {
  const { id: cardID } = req.params;
  const job = await Job.findOne({ cardID });
  if (!job) {
    return notFoundError(res, "Job");
  }
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
    contacts,
    ...rest
  } = req.body;

  if (!companyName) {
    res.status(400).json({ message: "Please enter a company name" });
    return;
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

  let updatedContacts = contacts.map((contact) => ({
    createdBy: userId,
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

  const updatedJob = await Job.findByIdAndUpdate(
    jobID,
    {
      companyName,
      position,
      isFavorite,
      contacts: updatedContacts,
      ...rest,
    },
    { new: true }
  );

  if (!updatedJob) {
    return notFoundError(res, "Job");
  }

  const contactOperations = updatedJob?.contacts.map(async (contact) => {
    try {
      const existingContact = await Contact.findById(contact._id);

      if (!existingContact) {
        const contactData = { ...contact._doc };
        await Contact.create(contactData);
      } else {
        Object.assign(existingContact, contact._doc);
        await existingContact.save();
      }
    } catch (error) {
      console.error("Error processing contact:", error);
    }
  });

  await Promise.all(contactOperations);

  await board.save();
  res.status(200).json({ data: updatedJob, message: "Job updated" });
});

module.exports = { getJob, updateJob };
