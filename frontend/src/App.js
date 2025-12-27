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

      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch news');
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

          {loading && <div className="loading">Loading articles...</div>}

          <NewsList articles={articles} loading={loading} />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
