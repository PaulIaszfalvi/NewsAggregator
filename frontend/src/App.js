import './App.css';
import { useState, useEffect } from 'react';
import NewsList from './components/NewsList';
import NewsFilter from './components/NewsFilter';
import ErrorBoundary from './components/ErrorBoundary';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all');
  const [limit, setLimit] = useState(50);

  const fetchNews = async (source = 'all', itemLimit = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = source === 'all'
        ? `${API_BASE}/api/news?limit=${itemLimit}`
        : `${API_BASE}/api/news/${source}?limit=${itemLimit}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setArticles([]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
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
      setError(err.message);
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedSource, limit);
  }, [selectedSource, limit]);

  const handleSourceChange = (source) => {
    setSelectedSource(source);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
  };

  const handleRefresh = () => {
    fetchNews(selectedSource, limit);
  };

  return (
    <ErrorBoundary>
      <div className="App">
        <header className="App-header">
          <h1>News Aggregator</h1>
          <p>Aggregating news from Reddit and Hacker News</p>
        </header>
        
        <main className="App-main">
          <NewsFilter
            selectedSource={selectedSource}
            limit={limit}
            onSourceChange={handleSourceChange}
            onLimitChange={handleLimitChange}
            onRefresh={handleRefresh}
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
