const asyncHandler = require("express-async-handler");
const { Contact, Job } = require("../models/jobModel");
const { notFoundError } = require("./helpers");

const getContacts = asyncHandler(async (req, res) => {
  const { boardID } = req.params;

  const contacts = await Contact.find({ boardID });
  if (!contacts) {
    return notFoundError(res, "Contacts");
  }
  res.status(200).json(contacts);
});

const getContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const contact = await Contact.findById(id);

  if (!contact) {
    return notFoundError(res, "Contact");
  }
  res.status(200).json(contact);
});

const deleteContact = asyncHandler(async (req, res) => {
  const { contactID } = req.params;
  const contact = await Contact.findByIdAndDelete(contactID);

  if (!contact) {
    return notFoundError(res, "Contact");
  }
  res.status(200).json({ message: "Contact deleted" });
});

module.exports = {
  getContacts,
  getContact,
  deleteContact,
};
