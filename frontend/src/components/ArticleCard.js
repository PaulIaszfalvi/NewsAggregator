import { useState, useRef } from 'react';
import '../styles/ArticleCard.css';
import ArticlePreview from './ArticlePreview';

function ArticleCard({ article, compact = false }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [cardRef, setCardRef] = useState(null);
  const [isOverPreview, setIsOverPreview] = useState(false);
  const hideTimeoutRef = useRef(null);

  const {
    title = 'No Title',
    author = 'Unknown',
    score = 0,
    url = '#',
    commentsUrl = '#',
    source = 'Unknown',
    subreddit = '',
  } = article;

  const safeUrl = typeof url === 'string' && url.startsWith('http')
    ? url
    : '#';

  const safeCommentsUrl = typeof commentsUrl === 'string' && commentsUrl.startsWith('http')
    ? commentsUrl
    : safeUrl;

  const handleCardClick = (e) => {
    // If clicking a link (like the title), don't trigger card click
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    window.open(safeCommentsUrl, '_blank', 'noopener,noreferrer');
  };

  const calculatePreviewPosition = (e) => {
    if (!cardRef) return { top: 0, left: 0 };

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const previewWidth = 450;
    const previewHeight = 350;
    const gap = 12;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let left = mouseX + gap;
    let top = mouseY + gap;

    if (left + previewWidth > windowWidth) {
      left = mouseX - previewWidth - gap;
    }

    if (top + previewHeight > windowHeight) {
      top = windowHeight - previewHeight - 10;
    }

    top = Math.max(10, top);
    left = Math.max(10, Math.min(left, windowWidth - previewWidth - 10));

    return { top: `${top}px`, left: `${left}px` };
  };

  const handleMouseEnter = (e) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setPreviewPosition(calculatePreviewPosition(e));
    setShowPreview(true);
  };

  const handleMouseMove = (e) => {
    if (showPreview) {
      setPreviewPosition(calculatePreviewPosition(e));
    }
  };

  const handleMouseLeave = () => {
    setIsOverPreview(false);
    hideTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 100);
  };

  const handlePreviewEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsOverPreview(true);
  };

  const handlePreviewLeave = () => {
    setIsOverPreview(false);
    hideTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 100);
  };

  if (compact) {
    return (
      <div
        className="article-card compact clickable-card"
        ref={setCardRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
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
        {showPreview && (
          <ArticlePreview 
            article={article} 
            position={previewPosition} 
            onMouseEnter={handlePreviewEnter}
            onMouseLeave={handlePreviewLeave}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="article-card clickable-card"
      ref={setCardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
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
      {showPreview && (
        <ArticlePreview 
          article={article} 
          position={previewPosition} 
          onMouseEnter={handlePreviewEnter}
          onMouseLeave={handlePreviewLeave}
        />
      )}
    </div>
  );
}

export default ArticleCard;
