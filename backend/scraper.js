const reddit = require("./templates/reddit");
const ycombinator = require("./templates/ycombinator");

(async () => {
  //Get the links
  const myList = getList();

  // -1 because I can only scan reddit right now
  for (var i = 0; i < myList.links.length - 1; i++) {
    var title = myList.links[i].title;

    switch (title) {
      case "reddit":
        myTemplate = reddit;
      case "ycombinator":
        myTemplate = ycombinator;
      // default:
      //   console.log("Error choosing template");
      //   break;

      // await myTemplate.setURL(myList.links[i].main);
    }

    for (var j = 0; j < myList.links[i].subs.length; j++) {
      //console.log(myList.links[i].subs[j]);

      const subSite = myList.links[i].subs[j];

      console.log("\n" + subSite + "\n");

      await myTemplate.initialize(subSite);

      let result = await myTemplate.getResults(5);

      console.log(result);
    }
  }
})();

function getList() {
  var json = require("./textFiles/links.json");

  return json;
}
