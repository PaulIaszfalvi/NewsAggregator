const express = require('express');
const cors = require('cors');
const favicon = require('serve-favicon');
const fs = require('fs');

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
    const numResults = parseInt(req.query.limit, 10) || config.scraper.defaultResultsPerSource;
    logger.debug(`Fetching ${source} articles`, { limit: numResults });
    
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const results = await scraper.scrapeBySource(source, numResults);
    
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
