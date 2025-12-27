import { useState, useEffect } from 'react';
import '../styles/NewsList.css';
import ArticleCard from './ArticleCard';

const STORAGE_KEY = 'newsAggregator_columnOrder';
const MINIMIZED_KEY = 'newsAggregator_minimizedColumns';

const getColumnKey = (column) => `${column.source}-${column.subreddit || 'main'}`;

function NewsList({ articles, loading }) {
  const [columns, setColumns] = useState([]);
  const [minimizedColumns, setMinimizedColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(MINIMIZED_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const loadSavedOrder = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load column order from localStorage', error);
      return null;
    }
  };

  const loadAndApplySavedOrder = (newColumns) => {
    const savedOrder = loadSavedOrder();
    if (!savedOrder || savedOrder.length === 0) {
      return newColumns;
    }

    const columnsByKey = {};
    newColumns.forEach((col) => {
      columnsByKey[getColumnKey(col)] = col;
    });

    const ordered = savedOrder
      .map((key) => columnsByKey[key])
      .filter(Boolean);

    const unorderedKeys = new Set(Object.keys(columnsByKey));
    savedOrder.forEach((key) => unorderedKeys.delete(key));
    const newColumnsNotInOrder = Array.from(unorderedKeys).map((key) => columnsByKey[key]);

    return [...ordered, ...newColumnsNotInOrder];
  };

  useEffect(() => {
    if (!articles || articles.length === 0) {
      setColumns([]);
      return;
    }

    const groupedBySubreddit = {};
    articles.forEach((section) => {
      const key = `${section.source}/${section.subreddit}`;
      if (!groupedBySubreddit[key]) {
        groupedBySubreddit[key] = {
          source: section.source,
          subreddit: section.subreddit,
          articles: [],
        };
      }
      if (Array.isArray(section.articles)) {
        groupedBySubreddit[key].articles.push(...section.articles);
      }
    });

    const columnsWithSortedArticles = Object.values(groupedBySubreddit).map((column) => ({
      ...column,
      articles: column.articles.sort((a, b) => (b.score || 0) - (a.score || 0)),
    }));

    const orderedColumns = loadAndApplySavedOrder(columnsWithSortedArticles);
    setColumns(orderedColumns);
  }, [articles]);

  useEffect(() => {
    if (columns.length > 0) {
      try {
        const order = columns.map((col) => getColumnKey(col));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      } catch (error) {
        console.warn('Failed to save column order to localStorage', error);
      }
    }
  }, [columns]);

  useEffect(() => {
    try {
      localStorage.setItem(MINIMIZED_KEY, JSON.stringify(Array.from(minimizedColumns)));
    } catch (error) {
      console.warn('Failed to save minimized columns to localStorage', error);
    }
  }, [minimizedColumns]);

  const toggleMinimized = (columnKey) => {
    setMinimizedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newColumns = [...columns];
    const draggedColumn = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(dropIndex, 0, draggedColumn);

    setColumns(newColumns);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!loading && (!articles || articles.length === 0)) {
    return (
      <div className="news-list-empty">
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <h3>No articles found</h3>
          <p>Try adjusting your filters or refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (loading && columns.length === 0) {
    return (
      <div className="news-list">
        <div className="article-count">Preparing articles...</div>
        <div className="minimized-columns-section">
          <div className="minimized-columns-placeholder">No minimized columns</div>
        </div>
        <div className="articles-columns"></div>
      </div>
    );
  }

  const totalArticles = columns.reduce((sum, col) => sum + col.articles.length, 0);

  const minimizedColumnsList = columns.filter((col) => minimizedColumns.has(getColumnKey(col)));
  const activeColumnsList = columns.filter((col) => !minimizedColumns.has(getColumnKey(col)));

  return (
    <div className="news-list">
      <div className="article-count">
        Showing {totalArticles} article{totalArticles !== 1 ? 's' : ''} across {columns.length} source{columns.length !== 1 ? 's' : ''} (drag to reorder)
      </div>

      <div className="minimized-columns-section">
        {minimizedColumnsList.length > 0 ? (
          <div className="minimized-columns-list">
            {minimizedColumnsList.map((column) => {
              const columnKey = getColumnKey(column);
              return (
                <button
                  key={columnKey}
                  className="minimized-column-btn"
                  onClick={() => toggleMinimized(columnKey)}
                  title={`Expand ${column.source}${column.subreddit ? ` / ${column.subreddit}` : ''}`}
                >
                  <strong>{column.source}</strong>
                  {column.subreddit && <span className="minimized-column-subreddit">{column.subreddit}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="minimized-columns-placeholder">No minimized columns</div>
        )}
      </div>

      <div className="articles-columns">
        {activeColumnsList.map((column, colIdx) => {
          const columnKey = getColumnKey(column);
          const actualIdx = columns.findIndex((col) => getColumnKey(col) === columnKey);
          return (
            <div
              key={columnKey}
              className={`article-column ${draggedIndex === actualIdx ? 'dragging' : ''} ${dragOverIndex === actualIdx ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, actualIdx)}
              onDragOver={(e) => handleDragOver(e, actualIdx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, actualIdx)}
              onDragEnd={handleDragEnd}
            >
              <div className="column-header drag-handle">
                <button
                  className="minimize-btn"
                  onClick={() => toggleMinimized(columnKey)}
                  title="Collapse"
                >
                  ▼
                </button>
                <div>
                  <strong>{column.source}</strong>
                  {column.subreddit && <span className="column-subheader">{column.subreddit}</span>}
                </div>
              </div>
              <div className="column-articles">
                {loading && column.articles.length === 0 && (
                  <div className="skeleton-loader">
                    {[...Array(3)].map((_, idx) => (
                      <div key={`skeleton-${idx}`} className="skeleton-item">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-footer"></div>
                      </div>
                    ))}
                  </div>
                )}
                {column.articles.map((article, idx) => (
                  <ArticleCard
                    key={`${article.url || 'article'}-${idx}`}
                    article={article}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NewsList;
