const express = require("express");
const router = express.Router();
const {
  getJob,
  updateJob,
} = require("../controllers/jobController");

router.get("/getOne/:id", getJob);
router.put("/:id", updateJob);

module.exports = router;
