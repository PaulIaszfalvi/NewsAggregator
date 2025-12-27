const reddit = require('./templates/reddit');
const ycombinator = require('./templates/ycombinator');
const logger = require('./utils/logger');
const config = require('./config');
const { getMockData } = require('./utils/mockData');

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
      return require(config.paths.linksConfig);
    } catch (error) {
      logger.error('Failed to load links configuration', error.message);
      return { links: [] };
    }
  }

  async scrapeAll(numResults = config.scraper.defaultResultsPerSource) {
    const results = [];
    const { links } = this.linksConfig;
    
    if (process.env.USE_MOCK_DATA === 'true') {
      logger.info('Using mock data mode');
      for (const linkConfig of links) {
        for (const subreddit of linkConfig.subs) {
          const validSub = subreddit?.trim();
          if (!validSub) continue;
          
          const mockArticles = getMockData(
            linkConfig.title.toLowerCase(),
            validSub
          ).slice(0, numResults);
          
          results.push({
            source: linkConfig.title,
            subreddit: validSub,
            articles: mockArticles,
            count: mockArticles.length,
            fetchedAt: new Date().toISOString(),
            isMock: true,
          });
        }
      }
      return results;
    }

    for (const linkConfig of links) {
      const siteName = linkConfig.title?.toLowerCase();
      const template = this.templates[siteName];

      if (!template) {
        logger.warn(`No template found for site: ${linkConfig.title}`);
        continue;
      }

      for (const subreddit of linkConfig.subs) {
        let validSub = subreddit?.trim();
        
        if (!validSub) {
          logger.warn(`Skipping empty subreddit for ${linkConfig.title}`);
          continue;
        }

        try {
          logger.debug(`Scraping ${linkConfig.title}/${validSub}`);
          
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
          
          results.push({
            source: linkConfig.title,
            subreddit: validSub,
            articles,
            count: articles.length,
            fetchedAt: new Date().toISOString(),
          });

          logger.info(`Successfully scraped ${articles.length} articles from ${linkConfig.title}/${validSub}`);
        } catch (error) {
          logger.error(`Error scraping ${linkConfig.title}/${validSub}`, error.message);
          
          const mockArticles = getMockData(
            linkConfig.title.toLowerCase(),
            validSub
          ).slice(0, numResults);
          
          results.push({
            source: linkConfig.title,
            subreddit: validSub,
            articles: mockArticles,
            count: mockArticles.length,
            fetchedAt: new Date().toISOString(),
            isMock: true,
            error: error.message,
          });
          
          logger.info(`Using mock data for ${linkConfig.title}/${validSub}`);
        }
      }
    }

    return results;
  }

  async scrapeBySource(source, numResults = config.scraper.defaultResultsPerSource) {
    const sourceLower = source?.toLowerCase();
    const linkConfig = this.linksConfig.links.find(
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

    if (process.env.USE_MOCK_DATA === 'true') {
      logger.info(`Using mock data mode for ${source}`);
      for (const sub of linkConfig.subs) {
        const validSub = sub?.trim();
        if (!validSub) continue;

        const mockArticles = getMockData(sourceLower, validSub).slice(0, numResults);

        results.push({
          source: linkConfig.title,
          subreddit: validSub,
          articles: mockArticles,
          count: mockArticles.length,
          fetchedAt: new Date().toISOString(),
          isMock: true,
        });
      }
      return results;
    }

    for (const sub of linkConfig.subs) {
      let validSub = sub?.trim();

      if (!validSub) {
        logger.warn(`Skipping empty subreddit for ${linkConfig.title}`);
        continue;
      }

      try {
        logger.debug(`Scraping ${linkConfig.title}/${validSub}`);

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

        results.push({
          source: linkConfig.title,
          subreddit: validSub,
          articles,
          count: articles.length,
          fetchedAt: new Date().toISOString(),
        });

        logger.info(`Successfully scraped ${articles.length} articles from ${linkConfig.title}/${validSub}`);
      } catch (error) {
        logger.error(`Error scraping ${linkConfig.title}/${validSub}`, error.message);

        const mockArticles = getMockData(sourceLower, validSub).slice(0, numResults);

        results.push({
          source: linkConfig.title,
          subreddit: validSub,
          articles: mockArticles,
          count: mockArticles.length,
          fetchedAt: new Date().toISOString(),
          isMock: true,
          error: error.message,
        });

        logger.info(`Using mock data for ${linkConfig.title}/${validSub}`);
      }
    }

    return results;
  }
}

module.exports = new Scraper();
