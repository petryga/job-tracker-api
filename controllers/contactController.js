const asyncHandler = require("express-async-handler");
const { Contact, Job } = require("../models/jobModel");
const { notFoundError } = require("./helpers");

const getContacts = asyncHandler(async (req, res) => {
  const { boardID } = req.params;

  const contacts = await Contact.find({ boardID });
  if (!contacts) {
    return notFoundError("Contacts");
  }
  res.status(200).json(contacts);
});

const getContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const contact = await Contact.findById(id);

  if (!contact) {
    return notFoundError("Contact");
  }
  res.status(200).json(contact);
});

// const updateContact = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   // const
//   const contact = await Contact.findByIdAndUpdate(id, req.body.contact, {
//     new: true,
//   });

//   if (!contact) {
//     return notFoundError("Contact");
//   }
//   const job = await Job.findById(req.body.contact.jobID);
//   if (!job) {
//     return notFoundError("Job");
//   }

//   const contactIndex = job.contacts.findIndex((contact) => {
//     return contact._id == req.body.contact._id;
//   });
//   job.contacts[contactIndex] = req.body.contact;
//   await job.save();

//   res.status(200).json({ data: contact, message: "Contact updated" });
// });

const deleteContact = asyncHandler(async (req, res) => {
  const { contactID } = req.params;
  const contact = await Contact.findByIdAndDelete(contactID);

  if (!contact) {
    return notFoundError("Contact");
  }
  res.status(200).json({ message: "Contact deleted" });
});

module.exports = {
  getContacts,
  getContact,
  deleteContact,
  // , updateContact, deleteContact
};
