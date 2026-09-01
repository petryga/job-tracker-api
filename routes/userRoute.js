const express = require("express");
const router = express.Router();
const { deleteMe } = require("../controllers/userController");

router.delete("/me", deleteMe);

module.exports = router;
