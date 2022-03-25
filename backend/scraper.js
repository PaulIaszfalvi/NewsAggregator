const reddit = require("./templates/reddit");

(async () => {
  //Get the links
  const myList = getList();

  // -1 because I can only scan reddit right now
  for (var i = 0; i < myList.links.length - 1; i++) {
    console.log(myList.links[i].main);
    for (var j = 0; j < myList.links[i].subs.length; j++) {
      //console.log(myList.links[i].subs[j]);

      const subSite = myList.links[i].subs[j];

      console.log("\n" + subSite + "\n");
      await reddit.initialize(subSite);

      let result = await reddit.getResults(10);

      console.log(result);
    }
  }
})();

function getList() {
  var json = require("./textFiles/links.json");

  return json;
}

// const puppeteer = require("puppeteer");

// (async () => {
//   let webUrl = "https://old.reddit.com/r/learnprogramming/";

//   let browser = await puppeteer.launch(/*{ headless: false }*/);
//   let page = await browser.newPage();

//   await page.goto(webUrl, { waitUntil: "networkidle2" });

//   let data = await page.evaluate(() => {
//     //let myPanel = document.querySelector('p[class="title"]').innerText;
//     let title = document.querySelector('p[class="title"]').innerText;
//     let author = document.querySelector('a[class="author"]').innerText;
//     // let user = document.querySelector().innerText;

//     return {
//       //myPanel,
//       title,
//       author,
//     };
//   });

//   console.log(data);

//   debugger;

//   await browser.close();
// })();

// import puppeteer from "puppeteer";

// const scraper = async (subreddit) => {
//   let URL = "https://www.reddit.com/r/" + subreddit + "/top/";
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(URL, { waitUntil: "networkidle2" });

//   let data = await page.evaluate(() => {
//     let post_titles = Array.from(document.querySelectorAll("h3")).map(
//       (item) => item.textContent
//     );

//     return post_titles;
//   });

//   console.log(data);

//   await browser.close();

//   return data;
// };

// export default scraper;
