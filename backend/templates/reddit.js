const puppeteer = require("puppeteer");

let SUBREDDIT_URL = (reddit) => `https://old.reddit.com/r/${reddit}/`;

const self = {
  browser: null,
  page: null,

  // setURL: async (mainURL) => {
  //   SUBREDDIT_URL = mainURL;
  // },
  //get url and make a call
  initialize: async (reddit) => {
    self.browser = await puppeteer.launch({
      // headless: false,
    });
    self.page = await self.browser.newPage();

    await self.page.goto(SUBREDDIT_URL(reddit) + ".json", {
      waitUntil: "networkidle0",
    });
  },

  getResults: async (nr) => {
    let elements = await self.page.$eval("*", (el) => el.innerText);
    let myArray = [];

    let myParsedJson = JSON.parse(elements);

    // Get all the required data.

    for (let i = 0; i < nr; i++) {
      let title = myParsedJson.data.children[i].data.title;
      let user = myParsedJson.data.children[i].data.author;
      let score = myParsedJson.data.children[i].data.score;
      let selftext = myParsedJson.data.children[i].data.selftext;
      let sourceLink = myParsedJson.data.children[i].data.url;
      // If the post isn't a discussion, return the link to what it points to instead of the discussion
      if (selftext === "") {
        selftext = myParsedJson.data.children[i].data.url;
      }

      myArray.push({
        title: title,
        user: user,
        score: score,
        selfText: selftext,
        sourceLink: sourceLink,
      });
    }

    return myArray;
  },
};

module.exports = self;
