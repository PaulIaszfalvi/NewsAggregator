import '../styles/ArticlePreview.css';

function ArticlePreview({ article, position, onMouseEnter, onMouseLeave }) {
  if (!article) return null;

  const {
    title = 'No Title',
    body = '',
    images = [],
    url = '#',
  } = article;

  return (
    <div 
      className="article-preview" 
      style={position}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="preview-content">
        <h3 className="preview-title">{title}</h3>

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
            <p>{body.substring(0, 300)}{body.length > 300 ? '...' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticlePreview;
