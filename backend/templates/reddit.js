const fetch = require('node-fetch');
const logger = require('../utils/logger');
const validators = require('../utils/validators');

class RedditScraper {
  constructor() {
    this.name = 'Reddit';
    this.baseUrl = 'https://old.reddit.com/r';
  }

  async initialize(subreddit) {
    const sanitized = validators.sanitizeSubreddit(subreddit);
    if (!validators.isValidSubreddit(sanitized)) {
      throw new Error(`Invalid subreddit name: ${subreddit}`);
    }
    this.subreddit = sanitized;
  }

  async getResults(numResults) {
    try {
      const validNum = Math.min(Math.max(numResults, 1), 50);
      const url = `${this.baseUrl}/${this.subreddit}/.json`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      
      const articles = [];
      const children = jsonData?.data?.children || [];
      
      for (let i = 0; i < children.length && articles.length < validNum; i++) {
        try {
          const post = children[i]?.data;
          if (!post) continue;
          
          if (post.stickied) continue;

          articles.push({
            title: post.title?.trim() || 'No title',
            author: post.author || 'Unknown',
            score: post.score || 0,
            url: post.url || `https://reddit.com${post.permalink}` || '#',
            source: this.name,
            fetchedAt: new Date().toISOString(),
          });
        } catch (error) {
          logger.warn(`Error parsing Reddit post at index ${i}`, { error: error.message });
        }
      }

      return articles;
    } catch (error) {
      logger.error('Failed to get Reddit results', { error: error.message });
      throw error;
    }
  }
}

module.exports = new RedditScraper();
