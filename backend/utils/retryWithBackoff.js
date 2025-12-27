const logger = require('./logger');

async function retryWithBackoff(
  fetchFn,
  maxRetries = 5,
  initialDelayMs = 1000,
  maxDelayMs = 30000
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchFn();

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

        logger.warn(`Rate limited (429). Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        lastError = new Error(`HTTP 429: Rate Limited`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delayMs = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        logger.warn(
          `Attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms: ${error.message}`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

module.exports = { retryWithBackoff };
