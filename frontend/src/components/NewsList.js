import { useState, useEffect } from 'react';
import '../styles/NewsList.css';
import ArticleCard from './ArticleCard';

const STORAGE_KEY = 'newsAggregator_columnOrder';

const getColumnKey = (column) => `${column.source}-${column.subreddit || 'main'}`;

function NewsList({ articles, loading }) {
  const [columns, setColumns] = useState([]);

  const loadSavedOrder = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load column order from localStorage', error);
      return null;
    }
  };

  const applySavedOrder = (newColumns) => {
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

    const orderedColumns = applySavedOrder(columnsWithSortedArticles);
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

  if (!articles || articles.length === 0) {
    return (
      <div className="news-list-empty">
        {!loading && <p>No articles found. Try adjusting your filters.</p>}
      </div>
    );
  }

  const totalArticles = columns.reduce((sum, col) => sum + col.articles.length, 0);

  return (
    <div className="news-list">
      <div className="article-count">
        Showing {totalArticles} article{totalArticles !== 1 ? 's' : ''} across {columns.length} source{columns.length !== 1 ? 's' : ''} (drag to reorder)
      </div>
      <div className="articles-columns">
        {columns.map((column, colIdx) => (
          <div
            key={`${column.source}-${column.subreddit || 'main'}`}
            className={`article-column ${draggedIndex === colIdx ? 'dragging' : ''} ${dragOverIndex === colIdx ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, colIdx)}
            onDragOver={(e) => handleDragOver(e, colIdx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, colIdx)}
            onDragEnd={handleDragEnd}
          >
            <div className="column-header drag-handle">
              <strong>{column.source}</strong>
              {column.subreddit && <span className="column-subheader">{column.subreddit}</span>}
            </div>
            <div className="column-articles">
              {column.articles.map((article, idx) => (
                <ArticleCard
                  key={`${article.url || 'article'}-${idx}`}
                  article={article}
                  compact={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewsList;
