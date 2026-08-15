// @ts-nocheck

const asyncHandler = require("express-async-handler");
const Board = require("../models/boardModel");
const mongoose = require("mongoose");
const { Job, Contact } = require("../models/jobModel");
const { getRandomColor, jobSearchLists, notFoundError } = require("./helpers");

const createBoard = asyncHandler(async (req, res) => {
  const { title, userId } = req.body;
  if (!title || !userId) {
    res.status(400).json({ message: "Please fill in all fields" });
    return;
  }

  let board;

  if (title === "Job Search") {
    const cardID = new mongoose.Types.ObjectId();
    const cardID2 = new mongoose.Types.ObjectId();
    const boardID = new mongoose.Types.ObjectId();
    const lists = jobSearchLists(cardID, cardID2);
    const jobID = new mongoose.Types.ObjectId();
    const jobID2 = new mongoose.Types.ObjectId();
    const contactID = new mongoose.Types.ObjectId();
    const contactID2 = new mongoose.Types.ObjectId();

    board = await Board.create({
      title,
      createdBy: userId,
      lists,
      isJobSearchBoard: true,
      _id: boardID,
    });

    await Job.create({
      _id: jobID,
      createdBy: userId,
      companyName: "Google",
      position: "Software Engineer",
      isFavorite: true,
      boardID,
      cardID,
      contacts: {
        _id: contactID,
        companyName: "Google",
        jobID,
      },
    });

    await Job.create({
      _id: jobID2,
      createdBy: userId,
      companyName: "Meta",
      position: "CEO",
      isFavorite: false,
      boardID,
      cardID: cardID2,
      contacts: {
        _id: contactID2,
        companyName: "Meta",
        jobID2,
      },
    });

    await Contact.create({
      createdBy: userId,
      companyName: "Google",
      jobID,
      _id: contactID,
      boardID,
    });

    await Contact.create({
      createdBy: userId,
      companyName: "Meta",
      jobID: jobID2,
      _id: contactID2,
      boardID,
    });
  } else {
    board = await Board.create({ title, createdBy: userId, lists: [] });
  }

  res.status(201).json(board);
});

const getBoards = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const boards = await Board.find({ createdBy: userId });
  res.json(boards);
});

const getBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const board = await Board.findById(id);
  if (board) {
    res.status(200).json(board);
  } else {
    return notFoundError(res, "Board");
  }
});

const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const board = await Board.findById(id);
  if (board) {
    await board.deleteOne();

    const jobs = await Job.find({ boardID: id });

    if (jobs) {
      jobs.forEach(async (job) => {
        await job.deleteOne();
      });
    }

    const contacts = await Contact.find({ boardID: id });
    if (contacts) {
      contacts.forEach(async (contact) => {
        await contact.deleteOne();
      });
    }
    res.json({ message: "Board deleted" });
  } else {
    return notFoundError(res, "Board");
  }
});

const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const board = await Board.findById(id);
  if (board) {
    const updatedBoard = await Board.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
    });
    res.status(201).json(updatedBoard);
  } else {
    return notFoundError(res, "Board");
  }
});

const createList = asyncHandler(async (req, res) => {
  const { title, boardID } = req.body;
  if (!title || !boardID) {
    res.status(400).json({ message: "Please fill in all fields" });
    return;
  }

  const board = await Board.findById(boardID);
  if (!board) {
    return notFoundError(res, "Board");
  }
  board.lists.push({ title, cards: [] });
  await board.save();
  res.status(201).json(board.lists);
});

const updateList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, boardID } = req.body;
  if (!title || !boardID) {
    res.status(400).json({ message: "Please fill in all fields" });
    return;
  }

  const board = await Board.findById(boardID);
  if (!board) {
    return notFoundError(res, "Board");
  }

  const list = board.lists.find((list) => list._id == id);
  if (!list) {
    return notFoundError(res, "List");
  }

  list.title = title;
  await board.save();

  res.status(201).json({ message: "List updated" });
});

const deleteList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { boardID } = req.body;
  const board = await Board.findById(boardID);
  if (!board) {
    return notFoundError(res, "Board");
  }

  board.lists = board.lists.filter((list) => list._id != id);
  await board.save();
  res.status(201).json({ message: "List deleted" });
});

const createCard = asyncHandler(async (req, res) => {
  const { text, listID, boardID, isJobSearchBoard, userId } = req.body;
  if (!text || !listID || !boardID) {
    res.status(400).json({ message: "Please fill in all fields" });
    return;
  }
  const board = await Board.findById(boardID);

  if (!board) {
    return notFoundError(res, "Board");
  }

  const list = board.lists.find((list) => list._id == listID);
  if (!list) {
    return notFoundError(res, "List");
  }

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

  if (isJobSearchBoard) {
    await Job.create({
      _id: jobID,
      createdBy: userId,
      companyName: text,
      cardID,
      boardID,
      contacts: {
        _id: contactID,
        companyName: text,
        jobID,
      },
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
    res.status(400).json({ message: "Please fill in all fields" });
    return;
  }

  const board = await Board.findById(boardID);
  if (!board) {
    return notFoundError(res, "Board");
  }

  const list = board.lists.find((list) => list._id == listID);
  if (!list) {
    return notFoundError(res, "List");
  }

  const card = list.cards.find((card) => card._id == id);
  if (!card) {
    return notFoundError(res, "Card");
  }

  card.text = text;

  await board.save();
  res.status(201).json(board);
});

const deleteCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { listID, boardID } = req.body;

  const board = await Board.findById(boardID);
  if (!board) {
    return notFoundError(res, "Board");
  }

  const list = board.lists.find((list) => list._id == listID);
  if (!list) {
    return notFoundError(res, "List");
  }

  list.cards = list.cards.filter((card) => card._id != id);

  const job = await Job.findOne({ cardID: id });

  if (job) {
    await job.deleteOne();
  }

  await board.save();
  res.status(201).json({ message: "Deleted" });
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
  const board = await Board.findById(boardID);

  if (!board) {
    return notFoundError(res, "Board");
  }
  // dragging lists around
  if (type === "list") {
    const lists = board.lists;
    const pulledOutList = lists.splice(droppableIndexStart, 1);
    lists.splice(droppableIndexEnd, 0, ...pulledOutList);
    await board.save();
    return res.status(201).json(board);
  }

  // cards in the same list
  if (type === "card" && droppableIdStart === droppableIdEnd) {
    // @ts-ignore
    const list = board.lists.find((list) => list._id == droppableIdStart);
    if (!list) {
      return notFoundError(res, "List");
    }
    const card = list.cards.splice(droppableIndexStart, 1);
    list.cards.splice(droppableIndexEnd, 0, ...card);
    await board.save();
    return res.status(201).json(board);
  }

  if (droppableIdStart !== droppableIdEnd) {
    const listStart = board.lists.find((list) => list._id == droppableIdStart);
    if (!listStart) {
      return notFoundError(res, "List");
    }
    const listEnd = board.lists.find((list) => list._id == droppableIdEnd);
    if (!listEnd) {
      return notFoundError(res, "List");
    }
    // pull out the card from the list
    const card = listStart.cards.splice(droppableIndexStart, 1);
    // put the card in the new list
    listEnd.cards.splice(droppableIndexEnd, 0, ...card);
    await board.save();
    return res.status(201).json(board);
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
