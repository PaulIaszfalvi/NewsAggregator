const express = require("express");
const scraper = require("./scraper");
const router = express.Router();
const app = express();

const PORT = process.env.PORT || 5000;

// app.use(app.router);
// routes.initialize(app);
app.get("/", (req, res) => {
  res.send(scraper);
});

app.use("/", require("./hello"));

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
