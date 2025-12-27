const BaseScraper = require('../scrapers/BaseScraper');
const logger = require('../utils/logger');

class YCombinatorScraper extends BaseScraper {
  constructor() {
    super('YCombinator');
    this.baseUrl = 'https://news.ycombinator.com';
  }

  async initialize() {
    await super.initialize(this.baseUrl);
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

          articles.push(this.normalizeResult({
            title,
            author: this._parseAuthorFromSubtext(user),
            score: this._parseScoreFromSubtext(user),
            url: link,
          }));
        } catch (error) {
          logger.warn(`Error parsing HN item at index ${i}`, error.message);
        }
      }

      return articles;
    } catch (error) {
      logger.error('Failed to get YCombinator results', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async _getPropertyValue(element, property) {
    try {
      const propHandle = await element.getProperty(property);
      return await propHandle.jsonValue();
    } catch (error) {
      logger.debug(`Could not get property ${property}`, error.message);
      return '';
    }
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
