'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, MessageCircle, CheckCircle, Clock, TrendingUp, Cpu, Briefcase, Globe, Microscope, Heart, ChevronRight, Star, BookOpen, RefreshCw } from 'lucide-react';

export default function DinnerTableApp() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [discussedArticles, setDiscussedArticles] = useState(new Set());
  const [todaysNews, setTodaysNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const iconMap = {
    'Cpu': Cpu,
    'Microscope': Microscope,
    'Briefcase': Briefcase,
    'Globe': Globe,
    'Heart': Heart
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/curate-news');
      const data = await response.json();
      
      if (data.success) {
        setTodaysNews(data.stories);
        setLastUpdated(new Date(data.lastUpdated));
      } else {
        setError(data.error || 'Failed to fetch news');
      }
    } catch (err) {
      setError('Unable to load news. Please try again.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const markAsDiscussed = (id) => {
    setDiscussedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const categories = [...new Set(todaysNews.map(n => n.category))];
  const discussedCount = discussedArticles.size;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Curating today's stories...</p>
          <p className="text-gray-400 text-sm mt-2">Finding the best conversations for your family</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <h1 className="text-3xl font-bold">DinnerTable</h1>
            </div>
            <button
              onClick={fetchNews}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all"
              title="Refresh news"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <p className="text-indigo-100">Today's 5 Stories Worth Talking About</p>
          <div className="mt-4 flex gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{discussedCount}/5 discussed</span>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated {lastUpdated.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <span key={cat} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
              {cat}
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {todaysNews.map(article => {
            const Icon = iconMap[article.icon] || Lightbulb;
            const isDiscussed = discussedArticles.has(article.id);
            
            return (
              <div 
                key={article.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-xl ${
                  isDiscussed ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setSelectedArticle(selectedArticle === article.id ? null : article.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${article.color} text-white flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-xs font-semibold text-gray-500">{article.category}</div>
                            <span className="text-xs text-gray-400">•</span>
                            <div className="text-xs text-gray-500">{article.sourceDisplay}</div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{article.headline}</h3>
                          <p className="text-gray-600 text-sm">{article.summary}</p>
                        </div>
                        <ChevronRight 
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                            selectedArticle === article.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedArticle === article.id && (
                  <div className="border-t border-gray-100 bg-gradient-to-br from-slate-50 to-blue-50 p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Why This Matters
                      </h4>
                      <p className="text-gray-700 text-sm mb-3">{article.whyItMatters}</p>
                      <a 
                        href={article.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Read full article on {article.sourceDisplay}
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        Questions to Discuss
                      </h4>
                      <div className="space-y-2">
                        {article.discussionPrompts.map((prompt, idx) => (
                          <div key={idx} className="flex gap-3 text-sm">
                            <span className="text-indigo-600 font-bold">{idx + 1}.</span>
                            <p className="text-gray-700">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-purple-500" />
                          College Essay Angle
                        </h4>
                        <p className="text-gray-600 text-xs">{article.collegeConnection}</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Skills You're Building
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {article.thinkingSkills.map((skill, idx) => (
                            <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsDiscussed(article.id);
                      }}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        isDiscussed
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'
                      }`}
                    >
                      {isDiscussed ? '✓ Discussed' : 'Mark as Discussed'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {discussedCount === 5 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl text-center shadow-lg">
            <Star className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">Awesome! 🎉</h3>
            <p>You've tackled all 5 stories. Check back tomorrow for fresh conversations!</p>
          </div>
        )}
      </div>
    </div>
  );
}
