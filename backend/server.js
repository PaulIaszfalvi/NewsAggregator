const express = require("express");
const { stringify } = require("nodemon/lib/utils");
const scraper = require("./scraper");
const router = express.Router();
const app = express();
const PORT = process.env.PORT || 5000;
var favicon = require("serve-favicon");
var path = require("path");

app.use(favicon(path.join(__dirname, "../frontend/public/favicon.ico")));

// app.use(app.router);
// routes.initialize(app);
app.get("/", (req, res) => {
  res.send(scraper);
  //res.send("This is your data.");
});

app.get("/", (req, res) => {
  res.json({
    name: "Paul",
    age: 37,
  });
  //res.send("This is your data.");
});

//app.use("/", require("./hello"));

// app.get("/api", (req, res) => {
//   res.json({ message: "Hello from server!" });
// });

// app.listen(PORT, () => {
//   console.log(`Server listening on ${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

module.exports = app;
module.exports = router;
