const logger = require('../utils/logger');
const validators = require('../utils/validators');
const { retryWithBackoff } = require('../utils/retryWithBackoff');

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

      const response = await retryWithBackoff(() =>
        fetch(this.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
        })
      );

      const json = await response.json();
      const children = json.data?.children || [];

      const articles = [];

      for (const item of children) {
        const post = item.data;

        if (post.stickied) continue;

        if (articles.length >= validNum) break;

        const images = [];
        if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'spoiler' && post.thumbnail !== 'default') {
          images.push(post.thumbnail);
        }
        if (post.preview?.images?.[0]?.source?.url) {
          images.push(post.preview.images[0].source.url);
        }

        articles.push({
          title: post.title?.trim() || 'No title',
          author: post.author || 'Unknown',
          score: post.score || 0,
          url: post.url?.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
          source: this.name,
          fetchedAt: new Date().toISOString(),
          body: post.selftext || '',
          images,
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
