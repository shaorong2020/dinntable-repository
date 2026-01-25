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
            className="bg-ind
