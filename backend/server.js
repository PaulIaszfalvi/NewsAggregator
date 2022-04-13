const express = require("express");
const { stringify } = require("nodemon/lib/utils");
const scraper = require("./scraper");
const router = express.Router();
const app = express();
const PORT = process.env.PORT || 5000;
var favicon = require("serve-favicon");
var path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

// Configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
//fetch(request, { mode: "cors" });

app.use(favicon(path.join(__dirname, "../frontend/public/network.png")));

app.get("/", async (req, res) => {
  console.log(await scraper); //, new Date().getTime());
  res.send(await scraper);
});

// app.get("/", (req, res) => {
//   res.json({
//     name: "Paul",
//     age: 37,
//   });
//   //res.send("This is your data.");
// });

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

module.exports = app;
module.exports = router;
