import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

//const anthropic = new Anthropic({
//  apiKey: process.env.ANTHROPIC_API_KEY,
//});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN,
  baseURL: process.env.ANTHROPIC_BASE_URL,
  timeout: process.env.API_TIMEOUT_MS || 600000,
});

// Mark this route as dynamic to prevent static generation at build time
export const dynamic = 'force-dynamic';

export async function GET() {
  // Check for required environment variables
  if (!process.env.ANTHROPIC_AUTH_TOKEN || !process.env.NEWS_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Missing required environment variables'
    }, { status: 500 });
  }
  try {
    // Fetch news from NewsAPI
    const categories = ['technology', 'science', 'business', 'general'];
    const newsPromises = categories.map(category =>
      fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`)
        .then(res => res.json())
    );

    const newsResults = await Promise.all(newsPromises);
    // Debug: Log what NewsAPI returned 
    console.log('NewsAPI results:', JSON.stringify(newsResults, null, 2)); 
    
    const allArticles = newsResults.flatMap(result => result.articles || []);
    // Debug: Log article count
    console.log(`Total articles fetched: ${allArticles.length}`); 

    // Prepare articles for AI curation
    const articlesText = allArticles.map((article, idx) => 
      `${idx + 1}. ${article.title}\n   Source: ${article.source.name}\n   Description: ${article.description}\n   URL: ${article.url}\n`
    ).join('\n');

    // Ask Claude to curate the best 5 stories
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a senior college counselor with more than 10 years of experience in international high schools. Your job now is to curate news for dinner discussions with the school's teenagers (age 12-17) and their parents.
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

Respond ONLY with valid JSON in this exact format:
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

Remember: Make it conversational and relatable for teenagers. Focus on questions that make them think, not just recall facts.`
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('Claude response text:', responseText);
      throw new Error(`No JSON found in response. Response was: ${responseText.substring(0, 200)}...`);
    }

    const curatedNews = JSON.parse(jsonMatch[0]);

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

    return NextResponse.json({
      success: true,
      stories: enrichedStories,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error curating news:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
