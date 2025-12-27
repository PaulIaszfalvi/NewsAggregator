# Frontend

React-based news aggregation UI using Create React App.

## Setup

Install dependencies from root project directory:

```bash
npm install
npm run frontend-install
```

## Development

From root directory, run:

```bash
npm run frontend
```

This starts the React dev server on `http://localhost:3000`.

## Features

- **Multi-source aggregation**: View articles from Reddit and Hacker News
- **Draggable columns**: Reorder sources by dragging (order persisted to localStorage)
- **Score-based sorting**: Articles sorted by score within each column
- **Hover previews**: See article preview on desktop when hovering over article
- **Loading skeletons**: Smooth skeleton animations during data fetch
- **Responsive design**: Works on desktop, tablet, and mobile
- **Error handling**: Error boundary catches component errors gracefully

## Build

```bash
npm run build
```

Creates optimized production build in `build/` directory.

## Testing

```bash
npm test
```

Runs React Testing Library tests in watch mode.
