const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  contactName: {
    type: String,
  },
  position: {
    type: String,
  },
  contactEmail: {
    type: String,
    trim: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      "Please enter a valid email",
    ],
  },
  contactPhone: {
    type: String,
  },
  contactNotes: {
    type: String,
  },
  jobID: {
    type: String,
  },
  boardID: {
    type: String,
  },
  companyName: {
    type: String,
  },
});

const jobSchema = new Schema({
  cardID: {
    type: Schema.Types.ObjectId,
    ref: "Card",
    required: true,
  },
  boardID: {
    type: Schema.Types.ObjectId,
    ref: "Board",
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  companyName: {
    type: String,
    required: [true, "Please enter a company name"],
  },
  position: {
    type: String,
  },
  location: {
    type: String,
  },
  salary: {
    type: String,
  },
  remoteOnsite: {
    type: String,
  },
  link: {
    type: String,
  },
  description: {
    type: String,
  },
  notes: {
    type: String,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  contacts: [contactSchema],
});

const Job = mongoose.model("Job", jobSchema);
const Contact = mongoose.model("Contact", contactSchema);

module.exports = { Job, Contact };
