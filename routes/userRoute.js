const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  deleteUser,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.delete("/delete/:userId", deleteUser);

module.exports = router;
