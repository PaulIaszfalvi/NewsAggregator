const path = require('path');

const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  mockData: process.env.USE_MOCK_DATA === 'true',
  apiKey: process.env.API_KEY,
  
  scraper: {
    defaultResultsPerSource: 50,
    puppeteer: {
      headless: true,
      args: [
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    },
    timeout: 30000,
  },

  paths: {
    favicon: path.join(__dirname, '../frontend/public/favicon.png'),
    linksConfig: path.join(__dirname, './textFiles/links.json'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
      : 'http://localhost:3000',
    credentials: true,
  },

  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after a minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }
};

module.exports = config;
