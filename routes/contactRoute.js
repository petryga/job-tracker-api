const express = require("express");
const router = express.Router();
const {
  getContacts,
  getContact,
  // updateContact,
  // deleteContact,
} = require("../controllers/contactController");

router.get("/getAll/:boardID", getContacts);
router.get("/getOne/:id", getContact);
// router.put("/update/:id", updateContact);
// router.delete("/delete/:id", deleteContact);

module.exports = router;
