import '../styles/ArticlePreview.css';

function ArticlePreview({ article, position, onMouseEnter, onMouseLeave }) {
  if (!article) return null;

  const {
    title = 'No Title',
    body = '',
    images = [],
    url = '#',
    author = 'Unknown',
    score = 0,
    source = 'Unknown',
    subreddit = '',
  } = article;

  return (
    <div 
      className="article-preview" 
      style={position}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">{title}</h3>
          <div className="preview-meta">
            <span className="preview-source">{source}{subreddit ? ` / r/${subreddit}` : ''}</span>
            <span className="preview-author">By {author}</span>
            {score > 0 && <span className="preview-score">↑ {score}</span>}
          </div>
        </div>

        {images.length > 0 && (
          <div className="preview-images">
            {images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt="preview" 
                className="preview-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        )}

        {body && (
          <div className="preview-body">
            <p>{body}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticlePreview;
