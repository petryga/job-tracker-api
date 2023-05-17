const express = require("express");
const router = express.Router();
const {
  getContacts,
  getContact,
  deleteContact,
} = require("../controllers/contactController");

router.get("/getAll/:boardID", getContacts);
router.get("/getOne/:id", getContact);
router.delete("/delete/:contactID", deleteContact);

module.exports = router;
