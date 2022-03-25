const puppeteer = require("puppeteer");

const SUBREDDIT_URL = (reddit) => `https://old.reddit.com/r/${reddit}/`;

const self = {
  browser: null,
  page: null,

  //get url and make a call
  initialize: async (reddit) => {
    self.browser = await puppeteer.launch({
      // headless: false,
    });
    self.page = await self.browser.newPage();

    await self.page.goto(SUBREDDIT_URL(reddit), { waitUntil: "networkidle0" });
  },

  getResults: async (nr) => {
    let data = await this.page.evaluate(() => {
      let user = document.querySelector('a[data-click-id="user"]').innerText;
    });

    //let elements = await self.page.$$('#siteTable > div[class*="thing"]');

    var myArray = [];

    for (let element of elements) {
      // let title = await element.$eval('p[class="title"]', (node) =>
      //   node.innerText.trim()
      // );
      let title = await element.$eval("a", (node) => node.innerText);
      let user = await element.$eval('a[data-click-id="user"]', (node) =>
        node.innterText.trim()
      );
      //let likes = await element.$eval("p", (node) => node.innterText);

      let tempArray = [title, user];

      myArray.push(tempArray);
    }
    return myArray;
  },
};

module.exports = self;
