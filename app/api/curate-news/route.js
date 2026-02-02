import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Parser from 'rss-parser';
import { Redis } from '@upstash/redis';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN,
  baseURL: process.env.ANTHROPIC_BASE_URL,
  timeout: parseInt(process.env.API_TIMEOUT_MS) || 600000,
});

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
  },
});

// Initialize Redis client (will be null if env vars not set, falling back to no cache)
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Mark this route as dynamic to prevent static generation at build time
export const dynamic = 'force-dynamic';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds (for Redis TTL)

/**
 * Generate cache key for news
 * Format: news:{language}:{ageGroup}:{categories}:{date}
 * For now: news:{language}:default:all:{YYYY-MM-DD}
 * Future: news:en:teen:tech,science:2026-01-28
 */
function getCacheKey(language, ageGroup = 'default', categories = 'all') {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `news:${language}:${ageGroup}:${categories}:${today}`;
}

async function getCachedNews(language, ageGroup = 'default', categories = 'all') {
  if (!redis) {
    console.log('Redis not configured, skipping cache');
    return null;
  }

  try {
    const cacheKey = getCacheKey(language, ageGroup, categories);
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log(`Cache HIT for key: ${cacheKey}`);
      return cachedData;
    }

    console.log(`Cache MISS for key: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('Error reading from Redis cache:', error);
    return null;
  }
}

async function setCachedNews(language, data, ageGroup = 'default', categories = 'all') {
  if (!redis) {
    console.log('Redis not configured, skipping cache write');
    return;
  }

  try {
    const cacheKey = getCacheKey(language, ageGroup, categories);
    const cacheData = {
      ...data,
      cachedAt: new Date().toISOString(),
    };

    // Set with TTL (expires after 24 hours)
    await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(cacheData));
    console.log(`Cached news with key: ${cacheKey} (TTL: ${CACHE_DURATION}s)`);
  } catch (error) {
    console.error('Error writing to Redis cache:', error);
  }
}

// High-quality RSS feeds organized by category
// Using "top stories" and headline feeds where available for better curation
// Future: Allow users to customize categories via login/preferences
const RSS_FEEDS = {
  general: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', name: 'NYT Top Stories' },
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World' },
    { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian World' },
  ],
  technology: [
    { url: 'https://www.technologyreview.com/feed/', name: 'MIT Technology Review' },
    { url: 'https://www.wired.com/feed/rss', name: 'Wired' },
    { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
  ],
  science: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml', name: 'NYT Science' },
    { url: 'https://www.sciencedaily.com/rss/top/science.xml', name: 'Science Daily Top' },
  ],
  business: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', name: 'NYT Business' },
    { url: 'https://www.economist.com/business/rss.xml', name: 'The Economist Business' },
  ],
  socialCulture: [
    { url: 'https://www.theatlantic.com/feed/all/', name: 'The Atlantic' },
    { url: 'https://www.npr.org/rss/rss.php?id=1008', name: 'NPR Opinion' },
  ],
};

async function fetchRSSFeed(feed, timeoutMs = 5000) {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    );

    // Race between the actual fetch and the timeout
    const result = await Promise.race([
      parser.parseURL(feed.url),
      timeoutPromise
    ]);

    // Only take the 5 most recent items from each feed (RSS feeds are pre-sorted by date)
    // Since we filter for today's news only, we don't need more than this
    return result.items.slice(0, 5).map(item => ({
      title: item.title,
      description: item.contentSnippet || item.description || '',
      url: item.link,
      source: { name: feed.name },
      pubDate: item.pubDate,
    }));
  } catch (error) {
    console.error(`Error fetching RSS from ${feed.name}:`, error.message);
    return [];
  }
}

export async function GET(request) {
  // Get language from query parameter (default to 'en')
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('lang') || 'en';
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Future: Get user preferences from query params or session
  // const ageGroup = searchParams.get('ageGroup') || 'default';
  // const categories = searchParams.get('categories') || 'all';

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedNews = await getCachedNews(language);
    if (cachedNews) {
      const parsedCache = typeof cachedNews === 'string' ? JSON.parse(cachedNews) : cachedNews;
      return NextResponse.json({
        ...parsedCache,
        cached: true,
      });
    }
  } else {
    console.log('Force refresh requested, bypassing cache');
  }

  // Check for required environment variables
  if (!process.env.ANTHROPIC_AUTH_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'Missing required environment variables'
    }, { status: 500 });
  }

  try {
    // Fetch from all RSS feeds in parallel
    const allFeeds = [
      ...RSS_FEEDS.general,
      ...RSS_FEEDS.technology,
      ...RSS_FEEDS.science,
      ...RSS_FEEDS.business,
      ...RSS_FEEDS.socialCulture,
    ];

    console.log(`Fetching from ${allFeeds.length} RSS feeds...`);
    const fetchStartTime = Date.now();

    const feedPromises = allFeeds.map(feed => fetchRSSFeed(feed));
    const feedResults = await Promise.all(feedPromises);

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`RSS fetch completed in ${fetchDuration}ms`);

    // Flatten and filter for today's articles only
    const allArticles = feedResults.flat();

    // Get today's date range (00:00:00 to 23:59:59)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Filter for today's articles
    const todaysArticles = allArticles.filter(article => {
      if (!article.pubDate) return false;
      const pubDate = new Date(article.pubDate);
      return pubDate >= todayStart && pubDate <= todayEnd;
    });

    console.log(`Total articles fetched: ${allArticles.length}, Today's articles: ${todaysArticles.length}`);

    // Check if we got any articles from today
    if (todaysArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles from today available',
        hint: 'No news articles published today were found. This might happen early in the morning. Please try again later.'
      }, { status: 500 });
    }

    // Sort by publication date (most recent first) and take top 25 for Claude
    const sortedArticles = todaysArticles
      .filter(article => article.title && article.description)
      .sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate) : new Date(0);
        const dateB = b.pubDate ? new Date(b.pubDate) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 25);  // Reduced from 50 to 25 - more focused curation

    console.log(`Sending ${sortedArticles.length} of today's articles to Claude for curation`);

    // Prepare articles for AI curation with sanitization
    const articlesText = sortedArticles.map((article, idx) => {
      // Sanitize text to prevent encoding issues
      const sanitize = (text) => text ? text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') : '';

      return `${idx + 1}. ${sanitize(article.title)}\n   Source: ${sanitize(article.source.name)}\n   Description: ${sanitize(article.description.substring(0, 300))}...\n   URL: ${article.url}\n`;
    }).join('\n');

    console.log(`Articles text prepared: ${articlesText.length} characters from ${sortedArticles.length} articles`);

    // Ask Claude to curate the best 5 stories
    const languageInstruction = language === 'zh'
      ? 'Respond in Chinese (Simplified Chinese). All content including headlines, summaries, and discussion prompts should be in Chinese. IMPORTANT: Use only ASCII double quotes (") in the JSON, never use Chinese quotation marks ("").'
      : 'Respond in English.';

    // Log prompt size for debugging
    const promptContent = `You are a senior college counselor with more than 10 years of experience in international high schools. Your job now is to curate news for dinner discussions with the school's teenagers (age 12-17) and their parents.

${languageInstruction}

From these news articles, select the BEST 5 stories that:
1. Are appropriate and interesting for teenagers
2. Spark meaningful discussion
3. Connect to US college application essays and critical thinking
4. Cover diverse topics across Technology, Science, Business, Politics & World, and Social & Culture

Here are today's articles:
${articlesText}

For each of the 5 stories you select, provide:
1. Category (Technology, Science, Business, Politics & World, or Social & Culture)
2. Headline (make it engaging and teen-friendly)
3. Summary (2-3 sentences explaining what happened)
4. Source name and URL
5. Why it matters (1 sentence)
6. Three discussion prompts (conversational, thought-provoking questions)
7. US College essay connection (how this relates to college applications)
8. Three thinking skills developed

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON. Ensure all strings are properly escaped and quoted.

JSON format:
{
  "stories": [
    {
      "category": "Technology",
      "headline": "...",
      "summary": "...",
      "source": "...",
      "sourceUrl": "...",
      "whyItMatters": "...",
      "discussionPrompts": ["...", "...", "..."],
      "collegeConnection": "...",
      "thinkingSkills": ["...", "...", "..."]
    }
  ]
}

Remember: Make it conversational and relatable for teenagers. Focus on questions that make them think, not just recall facts. Ensure all JSON strings are properly escaped.`;

    console.log(`Prompt size: ${promptContent.length} characters, ${allArticles.length} articles`);

    const claudeStartTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',  // Haiku 4.5 - faster and cheaper than Sonnet
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: promptContent
      }]
    });
    const claudeDuration = Date.now() - claudeStartTime;
    console.log(`Claude API call completed in ${claudeDuration}ms`);

    // Parse Claude's response with detailed logging
    console.log('Claude API response metadata:', {
      id: message.id,
      model: message.model,
      stop_reason: message.stop_reason,
      usage: message.usage,
      content_length: message.content?.length,
      content_types: message.content?.map(c => c.type)
    });

    if (!message.content || message.content.length === 0) {
      console.error('Unexpected Claude API response structure:', JSON.stringify(message, null, 2));
      throw new Error(`Claude API returned unexpected response structure. Stop reason: ${message.stop_reason}, Content array length: ${message.content?.length || 0}`);
    }

    // Find the text content block (might not be first if there are multiple blocks)
    const textBlock = message.content.find(block => block.type === 'text');

    if (!textBlock || !textBlock.text) {
      console.error('No text block found in content array:', JSON.stringify(message.content, null, 2));
      throw new Error(`Claude API response has no text content. Content types: ${message.content.map(c => c.type).join(', ')}`);
    }

    const responseText = textBlock.text;
    console.log(`Response text length: ${responseText.length} characters`);

    // Replace ALL types of quotation marks with ASCII quotes for valid JSON
    // Claude sometimes uses Chinese quotes (""), curly quotes (""), or other variants
    const sanitizedText = responseText
      .replace(/[""]/g, '"')  // Chinese quotation marks
      .replace(/['']/g, "'")  // Chinese single quotes
      .replace(/[""]/g, '"')  // Curly double quotes
      .replace(/['']/g, "'"); // Curly single quotes

    console.log(`Sanitized ${responseText.length - sanitizedText.length} non-ASCII quote characters`);

    // Try to extract JSON more carefully
    let jsonString;

    // First, try to remove code block markers if present
    let cleanedText = sanitizedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Now extract the JSON object (greedy match to get the complete JSON)
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('Claude response text:', sanitizedText);
      throw new Error(`No JSON found in response. Response was: ${sanitizedText.substring(0, 200)}...`);
    }

    jsonString = jsonMatch[0];

    let curatedNews;
    try {
      curatedNews = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed JSON string (first 1000 chars):', jsonString.substring(0, 1000));
      console.error('Characters around error position:', jsonString.substring(Math.max(0, 214 - 50), 214 + 50));
      console.error('Char codes around position 214:',
        Array.from(jsonString.substring(210, 220)).map((c, i) => `${210 + i}: '${c}' (${c.charCodeAt(0)})`).join(', ')
      );
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }

    // Add icons and colors based on category
    const categoryConfig = {
      'Technology': { icon: 'Cpu', color: 'from-blue-500 to-cyan-500' },
      'Science': { icon: 'Microscope', color: 'from-green-500 to-emerald-500' },
      'Business': { icon: 'Briefcase', color: 'from-purple-500 to-indigo-500' },
      'Politics & World': { icon: 'Globe', color: 'from-orange-500 to-red-500' },
      'Social & Culture': { icon: 'Heart', color: 'from-pink-500 to-rose-500' }
    };

    const enrichedStories = curatedNews.stories.map((story, idx) => ({
      id: idx + 1,
      ...story,
      icon: categoryConfig[story.category]?.icon || 'Lightbulb',
      color: categoryConfig[story.category]?.color || 'from-gray-500 to-gray-600',
      sourceDisplay: story.source
    }));

    const responseData = {
      success: true,
      stories: enrichedStories,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the results
    await setCachedNews(language, responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error curating news:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
