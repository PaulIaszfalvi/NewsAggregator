const reddit = require('./templates/reddit');
const ycombinator = require('./templates/ycombinator');
const logger = require('./utils/logger');
const config = require('./config');
const fs = require('fs');

class Scraper {
  constructor() {
    this.templates = {
      reddit,
      ycombinator,
    };
    this.linksConfig = this._loadConfig();
  }

  _loadConfig() {
    try {
      const configContent = fs.readFileSync(config.paths.linksConfig, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      logger.error('Failed to load links configuration', { error: error.message });
      return { links: [] };
    }
  }

  async _scrapeSource(linkConfig, subreddit, template, numResults) {
    const siteName = linkConfig.title?.toLowerCase();
    const validSub = subreddit?.trim();

    if (!validSub) {
      logger.warn(`Skipping empty subreddit for ${linkConfig.title}`, { source: siteName });
      return null;
    }

    try {
      logger.debug(`Scraping ${linkConfig.title}/${validSub}`, { source: siteName, sub: validSub });

      const scrapePromise = (async () => {
        await template.initialize(validSub);
        return await template.getResults(numResults);
      })();

      const articles = await Promise.race([
        scrapePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scrape timeout')), config.scraper.timeout * 2)
        ),
      ]);

      logger.info(`Successfully scraped ${articles.length} articles from ${linkConfig.title}/${validSub}`, {
        source: siteName,
        sub: validSub,
        count: articles.length,
      });

      return {
        source: linkConfig.title,
        subreddit: validSub,
        articles,
        count: articles.length,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error scraping ${linkConfig.title}/${validSub}`, {
        source: siteName,
        sub: validSub,
        error: error.message,
      });
      throw error;
    }
  }

  async *scrapeAllStream(numResults = config.scraper.defaultResultsPerSource) {
    const linksConfig = this._loadConfig();
    const { links } = linksConfig;

    for (const linkConfig of links) {
      const siteName = linkConfig.title?.toLowerCase();
      const template = this.templates[siteName];

      if (!template) {
        logger.warn(`No template found for site: ${linkConfig.title}`, { source: siteName });
        continue;
      }

      for (const subreddit of linkConfig.subs) {
        const result = await this._scrapeSource(linkConfig, subreddit, template, numResults);
        if (result) {
          yield result;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async scrapeAll(numResults = config.scraper.defaultResultsPerSource) {
    const results = [];
    for await (const result of this.scrapeAllStream(numResults)) {
      results.push(result);
    }
    return results;
  }

  async scrapeBySource(source, numResults = config.scraper.defaultResultsPerSource) {
    const sourceLower = source?.toLowerCase();
    const linksConfig = this._loadConfig();
    const linkConfig = linksConfig.links.find(
      (l) => l.title?.toLowerCase() === sourceLower
    );

    if (!linkConfig) {
      throw new Error(`Unknown source: ${source}`);
    }

    const template = this.templates[sourceLower];
    if (!template) {
      throw new Error(`No scraper template for ${source}`);
    }

    const results = [];

    for (const sub of linkConfig.subs) {
      const result = await this._scrapeSource(linkConfig, sub, template, numResults);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }
}

module.exports = new Scraper();
