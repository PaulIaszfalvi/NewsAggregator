import { useState, useEffect } from 'react';
import '../styles/NewsList.css';
import ArticleCard from './ArticleCard';

function NewsList({ articles, loading }) {
  const [columns, setColumns] = useState([]);

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

    setColumns(Object.values(groupedBySubreddit));
  }, [articles]);

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
            key={`${column.source}-${column.subreddit}`}
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
                <ArticleCard key={idx} article={article} compact={true} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewsList;
