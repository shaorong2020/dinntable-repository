"use client";

import React, { useState, useEffect } from "react";
import { MobileFeedPage } from "@/components/mobile/FeedPage";
import { DesktopFeedPage } from "@/components/desktop/FeedPage";

const MOBILE_BREAKPOINT = 768;

export default function DinnerTableApp() {
  const [todaysNews, setTodaysNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(null);
  const [language, setLanguage] = useState("en");
  const hasFetchedRef = React.useRef(false); // Prevent duplicate initial fetch

  // Detect viewport size
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on mount
    checkViewport();

    // Check on resize
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const fetchNews = async (lang = language) => {
    console.log(`[Frontend] Starting fetchNews for language: ${lang}`);
    const startTime = Date.now();
    setLoading(true);
    setError(null);
    try {
      console.log(`[Frontend] Calling API: /api/curate-news?lang=${lang}`);
      const fetchStartTime = Date.now();
      const response = await fetch(`/api/curate-news?lang=${lang}`);
      const fetchDuration = Date.now() - fetchStartTime;
      console.log(`[Frontend] API response received in ${fetchDuration}ms`);

      const parseStartTime = Date.now();
      const data = await response.json();
      const parseDuration = Date.now() - parseStartTime;
      console.log(`[Frontend] JSON parsed in ${parseDuration}ms`);

      if (data.success) {
        setTodaysNews(data.stories);
        setLastUpdated(new Date(data.lastUpdated));
        console.log(`[Frontend] State updated with ${data.stories.length} stories`);
      } else {
        setError(data.error || "Failed to fetch news");
        console.error(`[Frontend] API returned error:`, data.error);
      }
    } catch (err) {
      setError("Unable to load news. Please try again.");
      console.error("[Frontend] Error fetching news:", err);
    } finally {
      setLoading(false);
      const totalDuration = Date.now() - startTime;
      console.log(`[Frontend] Total fetchNews duration: ${totalDuration}ms`);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchNews();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when language changes (but not on initial mount)
  useEffect(() => {
    if (todaysNews.length > 0) {
      fetchNews(language);
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
  };

  // Show loading state while detecting viewport
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-ivy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  // Render appropriate layout based on viewport
  if (isMobile) {
    return (
      <MobileFeedPage
        todaysNews={todaysNews}
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
        onRefresh={() => fetchNews(language)}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  return (
    <DesktopFeedPage
      todaysNews={todaysNews}
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={() => fetchNews(language)}
      language={language}
      onLanguageChange={handleLanguageChange}
    />
  );
}
