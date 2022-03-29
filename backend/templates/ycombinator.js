const puppeteer = require("puppeteer");

let SUBREDDIT_URL = (ycombinator) => `https://news.ycombinator.com`;

const self = {
  browser: null,
  page: null,

  // setURL: async (mainURL) => {
  //   SUBREDDIT_URL = mainURL;
  // },
  //get url and make a call
  initialize: async (ycombinator) => {
    self.browser = await puppeteer.launch({
      // headless: false,
    });
    self.page = await self.browser.newPage();

    await self.page.goto(SUBREDDIT_URL(ycombinator), {
      waitUntil: "networkidle0",
    });
  },

  getResults: async (nr) => {
    const titles = await self.page.$$(".titlelink");
    const users = await self.page.$$(".subtext");

    for (let i = 0; i < titles.length; i++) {
      let title = await (await titles[i].getProperty("innerText")).jsonValue();
      let link = await (await titles[i].getProperty("href")).jsonValue();

      let user = await (await users[i].getProperty("innerText")).jsonValue();

      console.log(title, "\n", link, user);
    }

    // for (var i = 0; i < 1; i++) {
    //   console.log(titles[i]);
    //   console.log(users[i]);
    // }
  },
};

module.exports = self;
