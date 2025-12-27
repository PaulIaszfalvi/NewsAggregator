import '../styles/NewsFilter.css';

function NewsFilter({
  selectedSource,
  limit,
  onSourceChange,
  onLimitChange,
  onRefresh,
  loading,
}) {
  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'ycombinator', label: 'Hacker News' },
  ];

  const limits = [10, 20, 30, 50, 100];

  return (
    <div className="news-filter">
      <div className="filter-group">
        <label htmlFor="source-select">Source:</label>
        <select
          id="source-select"
          value={selectedSource}
          onChange={(e) => onSourceChange(e.target.value)}
          disabled={loading}
          className="filter-select"
        >
          {sources.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="limit-select">Results per source:</label>
        <select
          id="limit-select"
          value={limit}
          onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          disabled={loading}
          className="filter-select"
        >
          {limits.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="refresh-button"
      >
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  );
}

export default NewsFilter;
