import { useState } from 'react';
import '../styles/ArticleCard.css';
import ArticlePreview from './ArticlePreview';

function ArticleCard({ article, compact = false }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [cardRef, setCardRef] = useState(null);

  const {
    title = 'No Title',
    author = 'Unknown',
    score = 0,
    url = '#',
    source = 'Unknown',
    subreddit = '',
  } = article;

  const safeUrl = typeof url === 'string' && url.startsWith('http')
    ? url
    : '#';

  const calculatePreviewPosition = (e) => {
    if (!cardRef) return { top: 0, left: 0 };

    const rect = cardRef.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const previewWidth = 420;
    const previewHeight = 400;
    const gap = 15;

    let top = rect.top + window.scrollY;
    let left = rect.right + gap;

    if (left + previewWidth > windowWidth) {
      left = rect.left - previewWidth - gap;
    }

    const centerY = windowHeight / 2;
    if (rect.top > centerY) {
      top = rect.top + window.scrollY - previewHeight + 50;
    } else {
      top = rect.bottom + window.scrollY - 50;
    }

    top = Math.max(10, Math.min(top, window.scrollY + windowHeight - previewHeight - 10));
    left = Math.max(10, Math.min(left, windowWidth - previewWidth - 10));

    return { top: `${top}px`, left: `${left}px` };
  };

  const handleMouseEnter = (e) => {
    setPreviewPosition(calculatePreviewPosition(e));
    setShowPreview(true);
  };

  const handleMouseMove = (e) => {
    if (showPreview) {
      setPreviewPosition(calculatePreviewPosition(e));
    }
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  if (compact) {
    return (
      <div
        className="article-card compact"
        ref={setCardRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <h4 className="article-title-compact">
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" title={title}>
            {title}
          </a>
        </h4>
        <div className="article-footer-compact">
          <span className="article-author-compact">{author}</span>
          {score > 0 && <span className="article-score-compact">↑ {score}</span>}
        </div>
        {showPreview && <ArticlePreview article={article} position={previewPosition} />}
      </div>
    );
  }

  return (
    <div
      className="article-card"
      ref={setCardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="article-header">
        <div className="article-meta">
          <span className="source-badge">{source}</span>
          {subreddit && <span className="subreddit-badge">{subreddit}</span>}
        </div>
      </div>

      <h3 className="article-title">
        <a href={safeUrl} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h3>

      <div className="article-footer">
        <div className="article-author">By {author}</div>
        {score > 0 && <div className="article-score">Score: {score}</div>}
      </div>
      {showPreview && <ArticlePreview article={article} position={previewPosition} />}
    </div>
  );
}

export default ArticleCard;
