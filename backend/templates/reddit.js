const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const validators = require('../utils/validators');
const config = require('../config');

class RedditScraper {
  constructor() {
    this.name = 'Reddit';
    this.baseUrl = 'https://old.reddit.com/r';
    this.browser = null;
    this.page = null;
  }

  async initialize(subreddit) {
    const sanitized = validators.sanitizeSubreddit(subreddit);
    if (!validators.isValidSubreddit(sanitized)) {
      throw new Error(`Invalid subreddit name: ${subreddit}`);
    }
    this.subreddit = sanitized;

    try {
      logger.debug('Launching browser for Reddit', { action: 'launch' });
      this.browser = await puppeteer.launch(config.scraper.puppeteer);
      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(config.scraper.timeout);
      
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1280, height: 1024 });

      const url = `${this.baseUrl}/${this.subreddit}/`;
      logger.debug('Navigating to Reddit', { url });
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.scraper.timeout,
      });
      
      try {
        await this.page.waitForSelector('div.thing', { timeout: 5000 });
      } catch (e) {
        logger.warn('Timeout waiting for Reddit posts', { subreddit });
      }
      
      logger.debug('Initialized Reddit scraper', { subreddit, status: 'ready' });
    } catch (error) {
      logger.error('Failed to initialize Reddit scraper', { error: error.message });
      await this._cleanup();
      throw error;
    }
  }

  async _cleanup() {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      logger.debug('Cleaned up Reddit scraper', { status: 'closed' });
    } catch (error) {
      logger.warn('Error during cleanup for Reddit', { error: error.message });
    }
  }

  async getResults(numResults) {
    try {
      const validNum = Math.min(Math.max(numResults, 1), 50);
      
      const debugInfo = await this.page.evaluate(() => {
        return {
          postsFound: document.querySelectorAll('div.thing').length,
          bodyText: document.body.innerText.substring(0, 200),
        };
      });
      logger.debug('Reddit page debug info', { subreddit: this.subreddit, debug: debugInfo });
      
      const articles = await this.page.evaluate((limit) => {
        const results = [];
        const posts = Array.from(document.querySelectorAll('div.thing'));

        for (let i = 0; i < Math.min(limit, posts.length); i++) {
          try {
            const post = posts[i];
            
            const titleEl = post.querySelector('a.title');
            const title = titleEl?.innerText?.trim() || '';
            const link = titleEl?.href || '';
            
            const authorEl = post.querySelector('a.author');
            const author = authorEl?.innerText?.trim() || 'Unknown';
            
            const scoreEl = post.querySelector('div.score');
            let score = 0;
            if (scoreEl?.title) {
              const match = scoreEl.title.match(/(\d+)/);
              score = match ? parseInt(match[1]) : 0;
            } else if (scoreEl?.innerText) {
              const match = scoreEl.innerText.match(/(\d+)/);
              score = match ? parseInt(match[1]) : 0;
            }

            if (!title) continue;

            results.push({
              title,
              author,
              score,
              url: link,
              source: 'Reddit',
              fetchedAt: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Error parsing post', error);
          }
        }

        return results;
      }, validNum);

      logger.debug(`Extracted ${articles.length} articles from ${this.subreddit}`);
      return articles;
    } catch (error) {
      logger.error('Failed to get Reddit results', { error: error.message });
      throw error;
    } finally {
      await this._cleanup();
    }
  }

  _parseScore(scoreText) {
    if (!scoreText) return 0;
    const match = scoreText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

module.exports = new RedditScraper();
