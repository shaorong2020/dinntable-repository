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

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/curate-news");
      const data = await response.json();

      if (data.success) {
        setTodaysNews(data.stories);
        setLastUpdated(new Date(data.lastUpdated));
      } else {
        setError(data.error || "Failed to fetch news");
      }
    } catch (err) {
      setError("Unable to load news. Please try again.");
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

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
        onRefresh={fetchNews}
      />
    );
  }

  return (
    <DesktopFeedPage
      todaysNews={todaysNews}
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchNews}
    />
  );
}
