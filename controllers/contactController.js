const asyncHandler = require("express-async-handler");
const { Contact } = require("../models/jobModel");
const { notFoundError } = require("./helpers");

const getContacts = asyncHandler(async (req, res) => {
  const { boardID } = req.params;
  const contacts = await Contact.find({ boardID, createdBy: req.userId });
  res.status(200).json(contacts);
});

const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    createdBy: req.userId,
  });
  if (!contact) return notFoundError(res, "Contact");
  res.status(200).json(contact);
});

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOneAndDelete({
    _id: req.params.contactID,
    createdBy: req.userId,
  });
  if (!contact) return notFoundError(res, "Contact");
  res.status(200).json({ message: "Contact deleted" });
});

module.exports = {
  getContacts,
  getContact,
  deleteContact,
};
