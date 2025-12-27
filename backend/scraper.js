const reddit = require('./templates/reddit');
const ycombinator = require('./templates/ycombinator');
const logger = require('./utils/logger');
const config = require('./config');
const cache = require('./utils/cache');
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
    const cacheKey = `${siteName}:${validSub}`;

    if (!validSub) {
      logger.warn(`Skipping empty subreddit for ${linkConfig.title}`, { source: siteName });
      return null;
    }

    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      logger.info(`Using cached data for ${linkConfig.title}/${validSub}`, { source: siteName, sub: validSub });
      return cachedResult;
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

      const seenUrls = new Set();
      const deduplicatedArticles = articles.filter(article => {
        const url = article.url || 'NO_URL';
        if (seenUrls.has(url)) {
          logger.debug(`Duplicate found: ${url}`);
          return false;
        }
        seenUrls.add(url);
        return true;
      });

      const duplicatesRemoved = articles.length - deduplicatedArticles.length;
      logger.info(`Successfully scraped ${deduplicatedArticles.length} articles from ${linkConfig.title}/${validSub}${duplicatesRemoved > 0 ? ` (${duplicatesRemoved} duplicates removed)` : ''}`, {
        source: siteName,
        sub: validSub,
        count: deduplicatedArticles.length,
        duplicatesRemoved,
      });

      const result = {
        source: linkConfig.title,
        subreddit: validSub,
        articles: deduplicatedArticles,
        count: deduplicatedArticles.length,
        fetchedAt: new Date().toISOString(),
      };

      logger.debug(`Cache key: "${cacheKey}" | Articles returned for: ${linkConfig.title}/${validSub}`, {
        cacheKey,
        source: linkConfig.title,
        subreddit: validSub,
        articleCount: deduplicatedArticles.length,
        firstArticleTitle: deduplicatedArticles[0]?.title,
      });

      cache.set(cacheKey, result, 600);
      return result;
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

  clearCache() {
    cache.clear();
    logger.info('Cache cleared');
  }

  clearCacheFor(source, subreddit) {
    const sourceLower = source?.toLowerCase();
    const key = `${sourceLower}:${subreddit}`;
    cache.delete(key);
    logger.info(`Cache cleared for ${source}/${subreddit}`);
  }
}

module.exports = new Scraper();
