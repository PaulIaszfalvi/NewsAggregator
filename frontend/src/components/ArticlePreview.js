import '../styles/ArticlePreview.css';

function ArticlePreview({ article, position }) {
  if (!article) return null;

  const {
    title = 'No Title',
    author = 'Unknown',
    score = 0,
    url = '#',
    source = 'Unknown',
  } = article;

  return (
    <div className="article-preview" style={position}>
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">{title}</h3>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="preview-link"
          >
            View Full Post →
          </a>
        </div>

        <div className="preview-meta">
          <span className="preview-source">{source}</span>
          <span className="preview-author">By {author}</span>
          {score > 0 && <span className="preview-score">↑ {score}</span>}
        </div>

        <div className="preview-body">
          <p>Click "View Full Post" to read the complete article on {source}.</p>
        </div>
      </div>
    </div>
  );
}

export default ArticlePreview;
