const reddit = require("./templates/reddit");

(async () => {
  await reddit.initialize("learnprogramming");

  let result = await reddit.getResults(10);
})();

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
