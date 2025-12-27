const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const config = require('../config');

class BaseScraper {
  constructor(name) {
    this.name = name;
    this.browser = null;
    this.page = null;
  }

  async initialize(url) {
    try {
      logger.debug(`Launching browser for ${this.name}`);
      this.browser = await puppeteer.launch(config.scraper.puppeteer);
      this.page = await this.browser.newPage();
      
      logger.debug(`Navigating to ${url}`);
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.scraper.timeout,
      });
      logger.debug(`Initialized ${this.name} scraper`);
    } catch (error) {
      logger.error(`Failed to initialize ${this.name} scraper`, error.message);
      await this.cleanup();
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      logger.debug(`Cleaned up ${this.name} scraper`);
    } catch (error) {
      logger.warn(`Error during cleanup for ${this.name}`, error.message);
    }
  }

  async getResults(numResults) {
    throw new Error('getResults must be implemented by subclass');
  }

  normalizeResult(article) {
    return {
      title: article.title?.trim() || 'No title',
      author: article.author || article.user || 'Unknown',
      score: article.score || 0,
      url: article.url || article.link || '#',
      source: this.name,
      fetchedAt: new Date().toISOString(),
    };
  }
}

module.exports = BaseScraper;
