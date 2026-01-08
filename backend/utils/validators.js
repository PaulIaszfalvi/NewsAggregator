const validators = {
  isValidSite: (site) => {
    return ['reddit', 'hacker news'].includes(site?.toLowerCase());
  },

  isValidNumber: (num, min = 1, max = 50) => {
    const parsed = parseInt(num, 10);
    return !isNaN(parsed) && parsed >= min && parsed <= max;
  },

  sanitizeSiteName: (name) => {
    return name?.trim().toLowerCase() || '';
  },

  sanitizeSubreddit: (name) => {
    return name?.trim().replace(/[^a-zA-Z0-9_]/g, '') || '';
  },

  isValidSubreddit: (name) => {
    return /^[a-zA-Z0-9_]+$/.test(name) && name.length > 0;
  }
};

module.exports = validators;
