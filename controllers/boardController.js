const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Board = require("../models/boardModel");
const { Job, Contact } = require("../models/jobModel");
const { getRandomColor, notFoundError } = require("./helpers");
const { seedJobSearchBoard } = require("./seedJobSearchBoard");

// Loads a board only if it belongs to the caller. Everything that touches a
// board goes through this, so ownership is enforced in one place.
const findOwnedBoard = (id, userId) =>
  Board.findOne({ _id: id, createdBy: userId });

const createBoard = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  // "Job Search" is the one templated board — it comes pre-seeded with columns,
  // two example cards, and a matching Job + Contact for each.
  const board =
    title === "Job Search"
      ? await seedJobSearchBoard(req.userId)
      : await Board.create({ title, createdBy: req.userId, lists: [] });

  res.status(201).json(board);
});

const getBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find({ createdBy: req.userId });
  res.json(boards);
});

const getBoard = asyncHandler(async (req, res) => {
  const board = await findOwnedBoard(req.params.id, req.userId);
  if (!board) return notFoundError(res, "Board");
  res.status(200).json(board);
});

const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const board = await findOwnedBoard(id, req.userId);
  if (!board) return notFoundError(res, "Board");

  await board.deleteOne();
  await Promise.all([
    Job.deleteMany({ boardID: id }),
    Contact.deleteMany({ boardID: id }),
  ]);
  res.json({ message: "Board deleted" });
});

const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const board = await findOwnedBoard(id, req.userId);
  if (!board) return notFoundError(res, "Board");

  // createdBy / _id can't be reassigned through an update.
  const { createdBy, _id, ...updates } = req.body;
  const updatedBoard = await Board.findByIdAndUpdate(id, updates, {
    returnDocument: "after",
  });
  res.status(200).json(updatedBoard);
});

const createList = asyncHandler(async (req, res) => {
  const { title, boardID } = req.body;
  if (!title || !boardID) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const board = await findOwnedBoard(boardID, req.userId);
  if (!board) return notFoundError(res, "Board");

  board.lists.push({ title, cards: [] });
  await board.save();
  res.status(201).json(board.lists);
});

const updateList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, boardID } = req.body;
  if (!title || !boardID) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const board = await findOwnedBoard(boardID, req.userId);
  if (!board) return notFoundError(res, "Board");

  const list = board.lists.find((list) => list._id == id);
  if (!list) return notFoundError(res, "List");

  list.title = title;
  await board.save();
  res.status(200).json({ message: "List updated" });
});

const deleteList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { boardID } = req.body;
  const board = await findOwnedBoard(boardID, req.userId);
  if (!board) return notFoundError(res, "Board");

  board.lists = board.lists.filter((list) => list._id != id);
  await board.save();
  res.status(200).json({ message: "List deleted" });
});

const createCard = asyncHandler(async (req, res) => {
  const { text, listID, boardID, isJobSearchBoard } = req.body;
  const userId = req.userId;
  if (!text || !listID || !boardID) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }
  const board = await findOwnedBoard(boardID, userId);
  if (!board) return notFoundError(res, "Board");

  const list = board.lists.find((list) => list._id == listID);
  if (!list) return notFoundError(res, "List");

  const cardID = new mongoose.Types.ObjectId();
  const jobID = new mongoose.Types.ObjectId();
  const contactID = new mongoose.Types.ObjectId();
  const card = {
    _id: cardID,
    text,
    color: getRandomColor(),
    isFavorite: false,
    listID,
  };

  list.cards.push(card);

  // On a Job Search board a card is a job application, so it also gets a Job
  // (with an embedded contact) and a standalone Contact document.
  if (isJobSearchBoard) {
    await Job.create({
      _id: jobID,
      createdBy: userId,
      companyName: text,
      cardID,
      boardID,
      contacts: { _id: contactID, companyName: text, jobID },
    });

    await Contact.create({
      createdBy: userId,
      companyName: text,
      jobID,
      _id: contactID,
      boardID,
    });
  }

  await board.save();
  res.status(201).json(card);
});

const updateCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, listID, boardID } = req.body;
  if (!text || !listID || !boardID) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const board = await findOwnedBoard(boardID, req.userId);
  if (!board) return notFoundError(res, "Board");

  const list = board.lists.find((list) => list._id == listID);
  if (!list) return notFoundError(res, "List");

  const card = list.cards.find((card) => card._id == id);
  if (!card) return notFoundError(res, "Card");

  card.text = text;
  await board.save();
  res.status(200).json(board);
});

const deleteCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { listID, boardID } = req.body;

  const board = await findOwnedBoard(boardID, req.userId);
  if (!board) return notFoundError(res, "Board");

  const list = board.lists.find((list) => list._id == listID);
  if (!list) return notFoundError(res, "List");

  list.cards = list.cards.filter((card) => card._id != id);
  await Job.deleteOne({ cardID: id, createdBy: req.userId });

  await board.save();
  res.status(200).json({ message: "Deleted" });
});

const dragHappened = asyncHandler(async (req, res) => {
  const {
    droppableIdStart,
    droppableIdEnd,
    droppableIndexEnd,
    droppableIndexStart,
    type,
    boardID,
  } = req.body;
  const board = await findOwnedBoard(boardID, req.userId);
  if (!board) return notFoundError(res, "Board");

  // dragging lists around
  if (type === "list") {
    const lists = board.lists;
    const pulledOutList = lists.splice(droppableIndexStart, 1);
    lists.splice(droppableIndexEnd, 0, ...pulledOutList);
    await board.save();
    return res.status(200).json(board);
  }

  // cards in the same list
  if (type === "card" && droppableIdStart === droppableIdEnd) {
    const list = board.lists.find((list) => list._id == droppableIdStart);
    if (!list) return notFoundError(res, "List");
    const card = list.cards.splice(droppableIndexStart, 1);
    list.cards.splice(droppableIndexEnd, 0, ...card);
    await board.save();
    return res.status(200).json(board);
  }

  if (droppableIdStart !== droppableIdEnd) {
    const listStart = board.lists.find((list) => list._id == droppableIdStart);
    if (!listStart) return notFoundError(res, "List");
    const listEnd = board.lists.find((list) => list._id == droppableIdEnd);
    if (!listEnd) return notFoundError(res, "List");
    const card = listStart.cards.splice(droppableIndexStart, 1);
    listEnd.cards.splice(droppableIndexEnd, 0, ...card);
    await board.save();
    return res.status(200).json(board);
  }
});

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  deleteBoard,
  updateBoard,
  createList,
  updateList,
  dragHappened,
  deleteList,
  createCard,
  updateCard,
  deleteCard,
};
