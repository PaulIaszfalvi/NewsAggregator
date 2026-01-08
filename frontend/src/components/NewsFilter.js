import { useState } from 'react';
import '../styles/NewsFilter.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function NewsFilter({
  selectedSources = ['all'],
  limit,
  onSourceChange,
  onLimitChange,
  onRefresh,
  onNSFWDetected,
  loading,
}) {
  const [showAddSubredditModal, setShowAddSubredditModal] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState('');
  const [addingSubreddit, setAddingSubreddit] = useState(false);
  const [addError, setAddError] = useState(null);

  const sources = [
    { value: 'all', label: 'All' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'hacker news', label: 'Hacker News' },
    { value: 'techcrunch', label: 'TechCrunch' },
    { value: 'the verge', label: 'The Verge' },
    { value: 'ars technica', label: 'Ars Technica' },
    { value: 'wired', label: 'Wired' },
    { value: 'slashdot', label: 'Slashdot' },
    { value: 'lobsters', label: 'Lobsters' },
  ];

  const limits = [10, 20, 30, 50, 100];

  const handleAddSubreddit = async (e) => {
    e.preventDefault();
    setAddError(null);

    const subredditName = newSubreddit.trim();
    if (!subredditName) {
      setAddError('Please enter a subreddit name');
      return;
    }

    setAddingSubreddit(true);
    try {
      const response = await fetch(`${API_BASE}/api/subreddits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'reddit',
          subreddit: subredditName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.isNSFW) {
          setShowAddSubredditModal(false);
          setNewSubreddit('');
          if (onNSFWDetected) {
            onNSFWDetected(subredditName);
          }
          return;
        }
        throw new Error(errorData.error || 'Failed to add subreddit');
      }

      setNewSubreddit('');
      setShowAddSubredditModal(false);
      onRefresh();
    } catch (error) {
      setAddError(error.message);
    } finally {
      setAddingSubreddit(false);
    }
  };

  return (
    <div className="news-filter">
      <div className="source-tabs">
        {sources.map((source) => (
          <button
            key={source.value}
            className={`source-tab ${selectedSources.includes(source.value) ? 'active' : ''}`}
            onClick={() => onSourceChange(source.value)}
            disabled={loading}
          >
            {source.label}
          </button>
        ))}
      </div>

      <div className="filter-actions">
        <div className="filter-group">
          <label htmlFor="limit-select">Results:</label>
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

        <button
          onClick={() => setShowAddSubredditModal(true)}
          disabled={loading}
          className="add-subreddit-button"
        >
          + Add Subreddit
        </button>
      </div>
      {showAddSubredditModal && (
        <div className="modal-overlay" onClick={() => setShowAddSubredditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Subreddit</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddSubredditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubreddit}>
              <input
                type="text"
                placeholder="Enter subreddit name (e.g., python)"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                disabled={addingSubreddit}
                className="subreddit-input"
                autoFocus
              />
              {addError && <div className="error-message-modal">{addError}</div>}
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowAddSubredditModal(false)}
                  className="modal-cancel-btn"
                  disabled={addingSubreddit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={addingSubreddit}
                >
                  {addingSubreddit ? 'Adding...' : 'Add Subreddit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsFilter;
