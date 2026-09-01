const mongoose = require("mongoose");
const Board = require("../models/boardModel");
const { Job, Contact } = require("../models/jobModel");
const { jobSearchLists } = require("./helpers");

// A brand-new "Job Search" board comes pre-filled with two example cards in the
// Wishlist column, plus a matching Job and Contact for each, so the board isn't
// empty on first open.
const SAMPLE_COMPANIES = [
  { companyName: "Google", position: "Software Engineer", isFavorite: true },
  { companyName: "Figma", position: "Product Designer", isFavorite: false },
];

const seedJobSearchBoard = async (userId) => {
  const boardID = new mongoose.Types.ObjectId();
  const cardIDs = SAMPLE_COMPANIES.map(() => new mongoose.Types.ObjectId());

  const board = await Board.create({
    _id: boardID,
    title: "Job Search",
    createdBy: userId,
    isJobSearchBoard: true,
    lists: jobSearchLists(...cardIDs),
  });

  await Promise.all(
    SAMPLE_COMPANIES.flatMap((sample, i) => {
      const jobID = new mongoose.Types.ObjectId();
      const contactID = new mongoose.Types.ObjectId();
      return [
        Job.create({
          _id: jobID,
          createdBy: userId,
          companyName: sample.companyName,
          position: sample.position,
          isFavorite: sample.isFavorite,
          boardID,
          cardID: cardIDs[i],
          contacts: { _id: contactID, companyName: sample.companyName, jobID },
        }),
        Contact.create({
          _id: contactID,
          createdBy: userId,
          companyName: sample.companyName,
          jobID,
          boardID,
        }),
      ];
    }),
  );

  return board;
};

module.exports = { seedJobSearchBoard };
