# NewsAggregator

A full-stack news aggregation application that scrapes articles from multiple sources (Reddit, Hacker News) and displays them in an interactive, draggable column interface.

## Quick Start

### Prerequisites

- **Node.js** 14+ (node-fetch requires Node 12+, but 14+ recommended)
- **npm** 6+

### Installation

```bash
npm install
npm run frontend-install
```

## Running the Application

### Development with Mock Data (Recommended for Testing)

Mock data mode allows you to develop without making real scraping requests:

```bash
npm run dev
```

This starts:
- **Backend**: Express server on `http://localhost:3001` with mock data
- **Frontend**: React dev server on `http://localhost:3000`

The backend uses mock data defined in `backend/utils/mockData.js`.

### Development with Real Data

To scrape real data from Reddit and Hacker News:

```bash
npm run dev:real
```

**Note**: Real data mode uses Puppeteer for Hacker News and Reddit's JSON API. This is slower and may trigger rate limiting.

### Individual Server Commands

**Backend only (mock data)**:
```bash
npm run backend
```

**Backend only (real data)**:
```bash
npm run backend:real
```

**Frontend only**:
```bash
npm run frontend
```

## Project Structure

```
NewsAggregator/
├── backend/
│   ├── templates/          # Scraper implementations
│   │   ├── reddit.js       # Reddit scraper (fetch API)
│   │   └── ycombinator.js  # Hacker News scraper (Puppeteer)
│   ├── utils/              # Helper modules
│   │   ├── logger.js       # Logging utility
│   │   ├── mockData.js     # Mock article data
│   │   └── validators.js   # Data validation
│   ├── textFiles/
│   │   └── links.json      # Scraper configuration (subreddits, sites)
│   ├── config.js           # Backend configuration
│   ├── scraper.js          # Main scraper orchestrator
│   └── server.js           # Express server entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── styles/         # Component stylesheets
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── public/             # Static assets
└── package.json            # Root scripts and dependencies
```

## Features

### Backend
- **Multi-source scraping**: Reddit (API) and Hacker News (Puppeteer browser automation)
- **Mock data mode**: Develop without live scraping
- **Configuration-driven**: Easy to add new sources in `links.json`
- **Error handling**: Graceful fallback to mock data on scrape failure
- **Timeout protection**: Scrapes time out after 30 seconds max

### Frontend
- **Multi-column layout**: Each subreddit/source in its own draggable column
- **Score-based sorting**: Articles sorted by score descending
- **Drag & drop**: Reorder columns with persistent localStorage
- **Loading skeletons**: Animated loaders during fetch
- **Hover previews**: Desktop article preview on hover
- **Responsive design**: Mobile-optimized UI
- **Error boundary**: Catches and displays component errors

## Dependencies

### Backend
- **express** - Web framework
- **puppeteer** - Headless browser for Hacker News scraping
- **node-fetch** - HTTP client for Node.js (required for Node < 18; provides `fetch()` API)
- **cors** - Cross-origin request middleware
- **body-parser** - Request body parsing
- **serve-favicon** - Favicon middleware
- **concurrently** - Run multiple commands concurrently
- **nodemon** (dev) - Auto-restart on file changes

### Frontend
- **react** - UI framework
- **react-scripts** - Create React App build tools
- React Testing Library - Component testing

## Configuration

### Backend Config (`backend/config.js`)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `mockData`: Enable mock data mode
- `scraper.timeout`: Request timeout in ms (default: 15000)
- `scraper.puppeteer`: Puppeteer options (headless, sandbox disabled)

### Scraper Sources (`backend/textFiles/links.json`)
Add or modify sources:
```json
{
  "links": [
    {
      "title": "reddit",
      "main": "https://www.reddit.com/r/",
      "subs": ["learnprogramming", "programming", ...]
    },
    {
      "title": "ycombinator",
      "main": "https://news.ycombinator.com",
      "subs": []
    }
  ]
}
```

## API Endpoints

- `GET /api/news` - Fetch articles from all configured sources
  - Query: `?limit=50` (default: 50, max: 50)
- `GET /api/news/:source` - Fetch articles from specific source
  - Example: `/api/news/reddit?limit=30`
- `GET /health` - Health check

**Response format**:
```json
{
  "success": true,
  "data": [
    {
      "source": "reddit",
      "subreddit": "learnprogramming",
      "articles": [...],
      "count": 10,
      "fetchedAt": "2025-12-27T...",
      "isMock": false
    }
  ],
  "timestamp": "2025-12-27T..."
}
```

## Development

### Adding a New Source

1. Create scraper in `backend/templates/yoursite.js`
2. Implement `initialize(param)` and `getResults(numResults)` methods
3. Export singleton: `module.exports = new YourScraper()`
4. Add to `backend/scraper.js` templates object
5. Add configuration to `backend/textFiles/links.json`

### Debugging

Enable debug logging by running in development:
```bash
NODE_ENV=development npm run backend
```

Debug messages will appear in console (prefixed with `[DEBUG]`).

## Troubleshooting

### "node-fetch is not defined"
Ensure `node-fetch` is installed: `npm install`. This provides the `fetch()` API for Node < 18.

### Puppeteer sandbox error
This is expected on some systems. The config disables the sandbox:
```js
args: ['--no-sandbox', '--disable-setuid-sandbox']
```

### Rate limiting on Reddit
Reddit may rate limit scraping. Use mock data mode (`npm run dev`) for development.

### Articles not loading
- Check backend is running: `http://localhost:3001/health`
- Check browser console for CORS errors
- Verify `links.json` is configured
- Try mock data mode (`npm run dev`)

## License

ISC
