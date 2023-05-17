const asyncHandler = require("express-async-handler");
const { Job, Contact } = require("../models/jobModel");
const { notFoundError } = require("./helpers");
const Board = require("../models/boardModel");

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

  const updatedJob = await Job.findByIdAndUpdate(
    jobID,
    {
      companyName,
      position,
      isFavorite,
      contacts,
      ...rest,
    },
    { new: true }
  );

  contacts.forEach(async (contact) => {
    const existingContact = await Contact.findById(contact._id);
    if (existingContact) {
      existingContact.contactName = contact.contactName;
      existingContact.companyName = companyName;
      existingContact.contactEmail = contact.contactEmail;
      existingContact.contactPhone = contact.contactPhone;
      existingContact.contactNotes = contact.contactNotes;
      existingContact.position = contact.position;
      await existingContact.save();
    } else {
      await Contact.create({
        createdBy: userId,
        contactName: contact.contactName,
        position: contact.position,
        contactEmail: contact.contactEmail,
        contactPhone: contact.contactPhone,
        contactNotes: contact.contactNotes,
        jobID,
        companyName: companyName,
        boardID,
      });
    }
  });

  if (!updatedJob) {
    return notFoundError("Job");
  }

  await board.save();
  res.status(200).json({ data: updatedJob, message: "Job updated" });
});

module.exports = { getJob, updateJob };
