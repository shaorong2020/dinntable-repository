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
const RSS_FEEDS = {
  general: [
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News' },
    { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR News' },
    { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
  ],
  technology: [
    { url: 'https://www.wired.com/feed/rss', name: 'Wired' },
    { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
  ],
  science: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml', name: 'NYT Science' },
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily' },
  ],
  business: [
    { url: 'http://feeds.feedburner.com/time/business', name: 'Time Business' },
    { url: 'https://www.economist.com/business/rss.xml', name: 'The Economist Business' },
  ],
};

async function fetchRSSFeed(feed) {
  try {
    const result = await parser.parseURL(feed.url);
    return result.items.map(item => ({
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

  // Future: Get user preferences from query params or session
  // const ageGroup = searchParams.get('ageGroup') || 'default';
  // const categories = searchParams.get('categories') || 'all';

  // Check cache first
  const cachedNews = await getCachedNews(language);
  if (cachedNews) {
    const parsedCache = typeof cachedNews === 'string' ? JSON.parse(cachedNews) : cachedNews;
    return NextResponse.json({
      ...parsedCache,
      cached: true,
    });
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
    ];

    console.log(`Fetching from ${allFeeds.length} RSS feeds...`);

    const feedPromises = allFeeds.map(feed => fetchRSSFeed(feed));
    const feedResults = await Promise.all(feedPromises);

    // Flatten and get recent articles (last 24-48 hours preferred)
    const allArticles = feedResults.flat();

    console.log(`Total articles fetched: ${allArticles.length}`);

    // Check if we got any articles
    if (allArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles returned from RSS feeds',
        hint: 'Unable to fetch news from RSS sources. Please try again later.'
      }, { status: 500 });
    }

    // Sort by publication date (most recent first) and take top 50
    const sortedArticles = allArticles
      .filter(article => article.title && article.description)
      .sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate) : new Date(0);
        const dateB = b.pubDate ? new Date(b.pubDate) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 50);

    // Prepare articles for AI curation with sanitization
    const articlesText = sortedArticles.map((article, idx) => {
      // Sanitize text to prevent encoding issues
      const sanitize = (text) => text ? text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') : '';

      return `${idx + 1}. ${sanitize(article.title)}\n   Source: ${sanitize(article.source.name)}\n   Description: ${sanitize(article.description.substring(0, 300))}...\n   URL: ${article.url}\n`;
    }).join('\n');

    console.log(`Articles text prepared: ${articlesText.length} characters from ${sortedArticles.length} articles`);

    // Ask Claude to curate the best 5 stories
    const languageInstruction = language === 'zh'
      ? 'Respond in Chinese (Simplified Chinese). All content including headlines, summaries, and discussion prompts should be in Chinese.'
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: promptContent
      }]
    });

    // Parse Claude's response with detailed logging
    console.log('Claude API response metadata:', {
      id: message.id,
      model: message.model,
      stop_reason: message.stop_reason,
      usage: message.usage,
      content_length: message.content?.length
    });

    if (!message.content || !message.content[0] || !message.content[0].text) {
      console.error('Unexpected Claude API response structure:', JSON.stringify(message, null, 2));
      throw new Error(`Claude API returned unexpected response structure. Stop reason: ${message.stop_reason}, Content array length: ${message.content?.length || 0}`);
    }

    const responseText = message.content[0].text;
    console.log(`Response text length: ${responseText.length} characters`);

    // Try to extract JSON more carefully
    let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      // Try without code blocks
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      console.error('Claude response text:', responseText);
      throw new Error(`No JSON found in response. Response was: ${responseText.substring(0, 200)}...`);
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];

    let curatedNews;
    try {
      curatedNews = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed JSON string:', jsonString.substring(0, 500));
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
