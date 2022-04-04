exports.hello = (req, res) => {
  res.json({ hello: ["chris", "ben"] });
};

const express = require("express");
const router = express.Router();
module.exports = router;
