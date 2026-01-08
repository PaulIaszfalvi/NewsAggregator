const express = require('express');
const cors = require('cors');
const favicon = require('serve-favicon');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const scraper = require('./scraper');

const app = express();

if (fs.existsSync(config.paths.favicon)) {
  app.use(favicon(config.paths.favicon));
}
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/news', async (req, res, next) => {
  try {
    const numResults = parseInt(req.query.limit, 10) || config.scraper.defaultResultsPerSource;
    logger.debug('Fetching news articles', { limit: numResults });
    
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    for await (const section of scraper.scrapeAllStream(numResults)) {
      const flattenedSection = {
        ...section,
        articles: section.articles.map(article => ({
          ...article,
          subreddit: section.subreddit,
        })),
      };
      res.write(JSON.stringify(flattenedSection) + '\n');
    }
    
    res.end();
  } catch (error) {
    logger.error('Failed to fetch news', error.message);
    next(error);
  }
});

app.get('/api/news/:source', async (req, res, next) => {
  try {
    const { source } = req.params;
    const sources = source.split(',').map(s => s.trim()).filter(Boolean);
    const numResults = parseInt(req.query.limit, 10) || config.scraper.defaultResultsPerSource;
    logger.debug(`Fetching articles for sources: ${sources.join(', ')}`, { limit: numResults });
    
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const results = await scraper.scrapeBySources(sources, numResults);
    
    for (const section of results) {
      const flattenedSection = {
        ...section,
        articles: section.articles.map(article => ({
          ...article,
          subreddit: section.subreddit,
        })),
      };
      res.write(JSON.stringify(flattenedSection) + '\n');
    }
    
    res.end();
  } catch (error) {
    logger.error(`Failed to fetch ${req.params.source} news`, error.message);
    next(error);
  }
});

app.post('/api/subreddits', async (req, res, next) => {
  try {
    const { source, subreddit } = req.body;

    if (!source || !subreddit) {
      return res.status(400).json({
        success: false,
        error: 'Missing source or subreddit',
      });
    }

    const sourceLower = source.toLowerCase().trim();
    const subredditTrim = subreddit.trim();

    const linksConfigPath = config.paths.linksConfig;
    let linksConfig = JSON.parse(fs.readFileSync(linksConfigPath, 'utf-8'));

    const linkConfig = linksConfig.links.find(
      (l) => l.title.toLowerCase() === sourceLower
    );

    if (!linkConfig) {
      return res.status(400).json({
        success: false,
        error: `Unknown source: ${source}`,
      });
    }

    if (linkConfig.subs.includes(subredditTrim)) {
      return res.status(400).json({
        success: false,
        error: `Subreddit already exists: ${subredditTrim}`,
      });
    }

    // Check for NSFW before adding
    if (sourceLower === 'reddit') {
      const redditTemplate = require('./templates/reddit');
      await redditTemplate.initialize(subredditTrim);
      const results = await redditTemplate.getResults(10);
      if (results && results.isNSFW) {
        return res.status(400).json({
          success: false,
          error: 'NSFW subs are not allowed',
          isNSFW: true
        });
      }
    }

    linkConfig.subs.push(subredditTrim);

    fs.writeFileSync(linksConfigPath, JSON.stringify(linksConfig, null, 2));

    logger.info(`Added subreddit ${subredditTrim} to ${source}`, {
      source: sourceLower,
      subreddit: subredditTrim,
    });

    res.json({
      success: true,
      message: `Added ${subredditTrim} to ${source}`,
      subreddit: subredditTrim,
    });
  } catch (error) {
    logger.error('Failed to add subreddit', error.message);
    next(error);
  }
});

app.delete('/api/subreddits', (req, res, next) => {
  try {
    const { source, subreddit } = req.body;

    if (!source || !subreddit) {
      return res.status(400).json({
        success: false,
        error: 'Missing source or subreddit',
      });
    }

    const sourceLower = source.toLowerCase().trim();
    const subredditTrim = subreddit.trim();

    const linksConfigPath = config.paths.linksConfig;
    let linksConfig = JSON.parse(fs.readFileSync(linksConfigPath, 'utf-8'));

    const linkConfig = linksConfig.links.find(
      (l) => l.title.toLowerCase() === sourceLower
    );

    if (!linkConfig) {
      return res.status(400).json({
        success: false,
        error: `Unknown source: ${source}`,
      });
    }

    const index = linkConfig.subs.indexOf(subredditTrim);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Subreddit not found: ${subredditTrim}`,
      });
    }

    linkConfig.subs.splice(index, 1);

    fs.writeFileSync(linksConfigPath, JSON.stringify(linksConfig, null, 2));

    logger.info(`Removed subreddit ${subredditTrim} from ${source}`, {
      source: sourceLower,
      subreddit: subredditTrim,
    });

    res.json({
      success: true,
      message: `Removed ${subredditTrim} from ${source}`,
      subreddit: subredditTrim,
    });
  } catch (error) {
    logger.error('Failed to remove subreddit', error.message);
    next(error);
  }
});

app.get('/api/subreddits', (req, res, next) => {
  try {
    const linksConfigPath = config.paths.linksConfig;
    const linksConfig = JSON.parse(fs.readFileSync(linksConfigPath, 'utf-8'));
    res.json(linksConfig.links);
  } catch (error) {
    logger.error('Failed to fetch subreddits', error.message);
    next(error);
  }
});

app.post('/api/cache/clear', (req, res) => {
  scraper.clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port} in ${config.env} mode`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
