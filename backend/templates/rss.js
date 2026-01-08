const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retryWithBackoff');

class RSSTemplate {
  constructor(name) {
    this.name = name;
    this.url = null;
  }

  async initialize(url) {
    this.url = url;
  }

  async getResults(numResults) {
    if (!this.url) {
      throw new Error('RSS template not initialized with a URL');
    }

    try {
      const response = await retryWithBackoff(() =>
        fetch(this.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS: ${response.statusText}`);
      }

      const xml = await response.text();
      return this._parseRSS(xml, numResults);
    } catch (error) {
      logger.error(`Error fetching RSS from ${this.url}`, { error: error.message });
      throw error;
    }
  }

  _parseRSS(xml, numResults) {
    const articles = [];
    // Basic regex to find items. RSS uses <item>, Atom uses <entry>
    const itemRegex = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < numResults) {
      const itemContent = match[2];
      
      const title = this._extractTag(itemContent, 'title');
      const link = this._extractTag(itemContent, 'link') || this._extractAttr(itemContent, 'link', 'href');
      const description = this._extractTag(itemContent, 'description') || this._extractTag(itemContent, 'summary') || this._extractTag(itemContent, 'content:encoded');
      const author = this._extractTag(itemContent, 'dc:creator') || this._extractTag(itemContent, 'author') || 'Unknown';
      const pubDate = this._extractTag(itemContent, 'pubDate') || this._extractTag(itemContent, 'published') || new Date().toISOString();
      
      // Try to find an image
      const images = [];
      const mediaMatch = itemContent.match(/<media:content[^>]*url="([^"]+)"/i) || 
                         itemContent.match(/<enclosure[^>]*url="([^"]+)"/i) ||
                         itemContent.match(/<img[^>]*src="([^"]+)"/i);
      if (mediaMatch) {
        images.push(mediaMatch[1]);
      }

      articles.push({
        title: this._cleanText(title),
        url: link,
        body: this._cleanText(description),
        author: this._cleanText(author),
        source: this.name,
        fetchedAt: new Date().toISOString(),
        publishedAt: pubDate,
        images: images,
      });
      count++;
    }

    return articles;
  }

  _extractTag(content, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = content.match(regex);
    return match ? match[1] : '';
  }

  _extractAttr(content, tag, attr) {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, 'i');
    const match = content.match(regex);
    return match ? match[1] : '';
  }

  _cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Remove CDATA
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}

module.exports = RSSTemplate;
