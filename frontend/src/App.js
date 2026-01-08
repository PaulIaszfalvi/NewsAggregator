import './App.css';
import { useState, useEffect, useRef } from 'react';
import NewsList from './components/NewsList';
import NewsFilter from './components/NewsFilter';
import ErrorBoundary from './components/ErrorBoundary';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSources, setSelectedSources] = useState(['all']);
  const [limit, setLimit] = useState(50);
  const [abortController, setAbortController] = useState(null);
  const [showNSFWPopup, setShowNSFWPopup] = useState(false);
  const [nsfwSubreddit, setNsfwSubreddit] = useState('');
  const nsfwTimeoutRef = useRef(null);

  const fetchNews = async (sources = ['all'], itemLimit = 50) => {
    if (abortController) {
      abortController.abort();
    }

    const newController = new AbortController();
    setAbortController(newController);
    const signal = newController.signal;

    setLoading(true);
    setError(null);
    
    try {
      const sourceParam = sources.join(',');
      const url = sources.includes('all')
        ? `${API_BASE}/api/news?limit=${itemLimit}`
        : `${API_BASE}/api/news/${sourceParam}?limit=${itemLimit}`;

      const response = await fetch(url, { signal });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setArticles([]);

      while (true) {
        if (signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          if (signal.aborted) break;
          if (lines[i].trim()) {
            try {
              const section = JSON.parse(lines[i]);
              setArticles(prev => [...prev, section]);
            } catch (e) {
              console.warn('Failed to parse line:', lines[i]);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        setError(err.message);
        console.error('Error fetching news:', err);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNews(selectedSources, limit);
  }, [selectedSources, limit]);

  const handleSourceChange = (source) => {
    setSelectedSources(prev => {
      if (source === 'all') {
        return ['all'];
      }
      
      const newSources = prev.filter(s => s !== 'all');
      
      if (newSources.includes(source)) {
        const filtered = newSources.filter(s => s !== source);
        return filtered.length === 0 ? ['all'] : filtered;
      } else {
        return [...newSources, source];
      }
    });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
  };

  const handleRefresh = () => {
    fetchNews(selectedSources, limit);
  };

  const triggerNSFWPopup = (subreddit) => {
    setNsfwSubreddit(subreddit);
    setShowNSFWPopup(true);
    
    if (nsfwTimeoutRef.current) {
      clearTimeout(nsfwTimeoutRef.current);
    }
    
    nsfwTimeoutRef.current = setTimeout(() => {
      setShowNSFWPopup(false);
      nsfwTimeoutRef.current = null;
    }, 3000);
  };

  return (
    <ErrorBoundary>
      <div className="App">
        <header className="App-header">
          <h1>News Aggregator</h1>
          <p>Aggregating news from Reddit and Hacker News</p>
        </header>
        
        <main className="App-main">
          {showNSFWPopup && (
            <div className="nsfw-popup">
              NSFW subs are not allowed {nsfwSubreddit && `(r/${nsfwSubreddit})`}
            </div>
          )}
          <NewsFilter
            selectedSources={selectedSources}
            limit={limit}
            onSourceChange={handleSourceChange}
            onLimitChange={handleLimitChange}
            onRefresh={handleRefresh}
            onNSFWDetected={triggerNSFWPopup}
            loading={loading}
          />

          {error && (
            <div className="error-message" role="alert">
              <strong>Error:</strong> {error}
              <button onClick={handleRefresh}>Retry</button>
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <span>Loading articles...</span>
            </div>
          )}

          <NewsList articles={articles} loading={loading} onRefresh={handleRefresh} />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
