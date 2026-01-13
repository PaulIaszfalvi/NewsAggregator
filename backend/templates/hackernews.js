const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const config = require('../config');

class HackerNewsScraper {
  constructor() {
    this.name = 'Hacker News';
    this.baseUrl = 'https://news.ycombinator.com';
    this.browser = null;
    this.page = null;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    ];
  }

  async initialize() {
    try {
      logger.debug('Launching browser for Hacker News', { action: 'launch' });
      
      try {
        // Try launching with sandbox enabled first (secure default)
        this.browser = await puppeteer.launch(config.scraper.puppeteer);
      } catch (launchError) {
        logger.warn('Failed to launch Puppeteer with secure defaults, retrying with --no-sandbox', { 
          error: launchError.message 
        });
        
        // Fallback to --no-sandbox if the environment requires it (e.g. some CI/Docker setups)
        const fallbackOptions = {
          ...config.scraper.puppeteer,
          args: [...config.scraper.puppeteer.args, '--no-sandbox']
        };
        this.browser = await puppeteer.launch(fallbackOptions);
      }

      this.page = await this.browser.newPage();
      
      // Rotate User-Agent
      const randomUA = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await this.page.setUserAgent(randomUA);

      logger.debug('Navigating to Hacker News', { url: this.baseUrl, ua: randomUA });
      await this.page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: config.scraper.timeout,
      });
      logger.debug('Initialized Hacker News scraper', { status: 'ready' });
    } catch (error) {
      logger.error('Failed to initialize Hacker News scraper', { error: error.message });
      await this._cleanup();
      throw error;
    }
  }

  async _cleanup() {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      logger.debug('Cleaned up Hacker News scraper', { status: 'closed' });
    } catch (error) {
      logger.warn('Error during cleanup for Hacker News', { error: error.message });
    }
  }

  async getResults(numResults) {
    try {
      const validNum = Math.min(Math.max(numResults, 1), 50);
      
      // Use evaluate to parse everything in one go for better performance and reliability
      const articles = await this.page.evaluate((limit) => {
        const results = [];
        const rows = document.querySelectorAll('.athing');
        
        for (let i = 0; i < Math.min(limit, rows.length); i++) {
          const row = rows[i];
          const titleEl = row.querySelector('.titleline > a');
          const subtextRow = row.nextElementSibling;
          const subtextEl = subtextRow ? subtextRow.querySelector('.subtext') : null;
          
          if (titleEl) {
            const subtext = subtextEl ? subtextEl.innerText : '';
            const itemId = row.id;
            
            // Basic author/score extraction in-page
            let author = 'Unknown';
            const authorMatch = subtext.match(/by\s+([^\s]+)/);
            if (authorMatch) author = authorMatch[1];
            
            let score = 0;
            const scoreMatch = subtext.match(/(\d+)\s+points?/);
            if (scoreMatch) score = parseInt(scoreMatch[1], 10);
            
            results.push({
              title: titleEl.innerText.trim() || 'No title',
              url: titleEl.href || '#',
              commentsUrl: itemId ? `https://news.ycombinator.com/item?id=${itemId}` : '#',
              author,
              score,
              fetchedAt: new Date().toISOString(),
            });
          }
        }
        return results;
      }, validNum);

      // Normalize source name for each article
      return articles.map(a => ({
        ...a,
        source: this.name
      }));
    } catch (error) {
      logger.error('Failed to get Hacker News results', { error: error.message });
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

module.exports = new HackerNewsScraper();
