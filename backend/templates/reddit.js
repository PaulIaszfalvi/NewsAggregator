const logger = require('../utils/logger');
const validators = require('../utils/validators');

class RedditScraper {
  constructor() {
    this.name = 'Reddit';
    this.baseUrl = 'https://www.reddit.com/r';
  }

  async initialize(subreddit) {
    const sanitized = validators.sanitizeSubreddit(subreddit);
    if (!validators.isValidSubreddit(sanitized)) {
      throw new Error(`Invalid subreddit name: ${subreddit}`);
    }
    this.subreddit = sanitized;
    this.url = `${this.baseUrl}/${this.subreddit}/.json?limit=100`;
  }

  async getResults(numResults) {
    if (!this.url) {
      throw new Error('Scraper not initialized');
    }

    try {
      const validNum = Math.min(Math.max(numResults, 1), 50);

      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'NewsAggregator/1.0 (Educational)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const children = json.data?.children || [];

      const articles = [];

      for (const item of children) {
        const post = item.data;

        if (post.stickied) continue;

        if (articles.length >= validNum) break;

        articles.push({
          title: post.title?.trim() || 'No title',
          author: post.author || 'Unknown',
          score: post.score || 0,
          url: post.url?.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
          source: this.name,
          fetchedAt: new Date().toISOString(),
        });
      }

      logger.info(`Fetched ${articles.length} articles from r/${this.subreddit}`);
      return articles;

    } catch (error) {
      logger.error('Failed to fetch Reddit JSON', error.message);
      throw error;
    }
  }
}

module.exports = new RedditScraper();
