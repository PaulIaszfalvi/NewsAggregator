const generateMockArticles = (baseTitle, startScore = 100) => {
  const articles = [];
  for (let i = 1; i <= 50; i++) {
    articles.push({
      title: `${baseTitle} - Part ${i}: Deep dive into implementation details`,
      author: `user_${Math.floor(Math.random() * 1000)}`,
      score: startScore - (i * 2),
      url: `https://example.com/article-${i}`,
    });
  }
  return articles;
};

const mockData = {
  reddit: {
    learnprogramming: generateMockArticles('Learning programming fundamentals', 245),
    programminghumor: generateMockArticles('Programming jokes and memes', 189),
    cscareerquestions: generateMockArticles('Career advice for CS professionals', 156),
    programming: generateMockArticles('Advanced programming concepts', 892),
    Fitness: generateMockArticles('Fitness tips and tricks', 145),
    weightroom: generateMockArticles('Weightlifting discussions', 123),
    powerlifting: generateMockArticles('Powerlifting techniques', 98),
  },
  ycombinator: generateMockArticles('Startup and technology news', 1250),
};

const getMockData = (source, subreddit) => {
  if (source === 'reddit' && subreddit) {
    return mockData.reddit[subreddit] || mockData.reddit.learnprogramming;
  }
  if (source === 'ycombinator') {
    return mockData.ycombinator;
  }
  return [];
};

module.exports = { getMockData, mockData };
