const reddit = require("./templates/reddit");
const ycombinator = require("./templates/ycombinator");

const scraper = (async () => {
  //Get the links
  const myList = getList();
  let resultsArray = [];
  let numResults = 10;
  // -1 because I can only scan reddit right now
  // First for loop goes through links, second for loop goes through subs
  for (var i = 0; i < myList.links.length; i++) {
    var title = myList.links[i].title;

    //console.log(title);

    // Determine which template to use based on which site will be scraped
    switch (title) {
      case "reddit":
        myTemplate = reddit;
        break;
      case "ycombinator":
        myTemplate = ycombinator;
        break;
      default:
        console.log("This should not happen");
        break;
    }

    for (var j = 0; j < myList.links[i].subs.length; j++) {
      const subSite = myList.links[i].subs[j] || "ycombinator";
      await myTemplate.initialize(subSite);
      let result = await myTemplate.getResults(numResults);

      resultsArray.push([subSite, result]);
      console.log(resultsArray);
    }
  }

  return resultsArray;
})();

//Get a list (json format) with the titles, links, and subs for the websites that will be scraped
function getList() {
  var json = require("./textFiles/links.json");

  return json;
}

module.exports = scraper;
