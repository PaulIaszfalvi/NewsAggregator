const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const config = require('../config');

class YCombinatorScraper {
  constructor() {
    this.name = 'YCombinator';
    this.baseUrl = 'https://news.ycombinator.com';
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      logger.debug('Launching browser for YCombinator', { action: 'launch' });
      this.browser = await puppeteer.launch(config.scraper.puppeteer);
      this.page = await this.browser.newPage();

      logger.debug('Navigating to YCombinator', { url: this.baseUrl });
      await this.page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: config.scraper.timeout,
      });
      logger.debug('Initialized YCombinator scraper', { status: 'ready' });
    } catch (error) {
      logger.error('Failed to initialize YCombinator scraper', { error: error.message });
      await this._cleanup();
      throw error;
    }
  }

  async _cleanup() {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      logger.debug('Cleaned up YCombinator scraper', { status: 'closed' });
    } catch (error) {
      logger.warn('Error during cleanup for YCombinator', { error: error.message });
    }
  }

  async getResults(numResults) {
    try {
      const validNum = Math.min(Math.max(numResults, 1), 50);
      const titles = await this.page.$$('.titlelink');
      const users = await this.page.$$('.subtext');
      const articles = [];

      for (let i = 0; i < Math.min(validNum, titles.length); i++) {
        try {
          const title = await this._getPropertyValue(titles[i], 'innerText');
          const link = await this._getPropertyValue(titles[i], 'href');
          const user = await this._getPropertyValue(users[i], 'innerText');

          articles.push(this._normalizeResult({
            title,
            author: this._parseAuthorFromSubtext(user),
            score: this._parseScoreFromSubtext(user),
            url: link,
          }));
        } catch (error) {
          logger.warn(`Error parsing HN item at index ${i}`, { error: error.message });
        }
      }

      return articles;
    } catch (error) {
      logger.error('Failed to get YCombinator results', { error: error.message });
      throw error;
    } finally {
      await this._cleanup();
    }
  }

  async _getPropertyValue(element, property) {
    try {
      const propHandle = await element.getProperty(property);
      return await propHandle.jsonValue();
    } catch (error) {
      logger.debug(`Could not get property ${property}`, { error: error.message });
      return '';
    }
  }

  _normalizeResult(article) {
    return {
      title: article.title?.trim() || 'No title',
      author: article.author || 'Unknown',
      score: article.score || 0,
      url: article.url || '#',
      source: this.name,
      fetchedAt: new Date().toISOString(),
    };
  }

  _parseAuthorFromSubtext(subtext) {
    if (!subtext) return 'Unknown';
    const match = subtext.match(/by\s+([^\s]+)/);
    return match ? match[1] : 'Unknown';
  }

  _parseScoreFromSubtext(subtext) {
    if (!subtext) return 0;
    const match = subtext.match(/(\d+)\s+points?/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

module.exports = new YCombinatorScraper();
