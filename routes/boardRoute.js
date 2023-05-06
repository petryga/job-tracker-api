const express = require("express");
const router = express.Router();
const {
  createBoard,
  getBoards,
  getBoard,
  deleteBoard,
  updateBoard,
  createList,
  updateList,
  deleteList,
  createCard,
  updateCard,
  deleteCard,
  dragHappened,
} = require("../controllers/boardController");

router.post("/create", createBoard);
router.get("/getAll/:userId", getBoards);
router.get("/:id", getBoard);
router.delete("/:id", deleteBoard);
router.put("/:id", updateBoard);
router.post("/lists/createList", createList);
router.put("/lists/updateList/:id", updateList);
router.delete("/lists/deleteList/:id", deleteList);
router.post("/cards/createCard", createCard);
router.put("/cards/updateCard/:id", updateCard);
router.delete("/cards/deleteCard/:id", deleteCard);
router.put("/all/drag", dragHappened);

module.exports = router;
