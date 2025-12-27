const path = require('path');

const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  
  scraper: {
    defaultResultsPerSource: 50,
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    timeout: 15000,
    useMockData: process.env.USE_MOCK_DATA === 'true',
  },

  paths: {
    favicon: path.join(__dirname, '../frontend/public/favicon.png'),
    linksConfig: path.join(__dirname, './textFiles/links.json'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }
};

module.exports = config;
