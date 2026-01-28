"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, RefreshCw, Sparkles } from "lucide-react";
import { DesktopNewsCard } from "@/components/desktop/NewsCard";
import { DetailPanel } from "@/components/desktop/DetailPanel";
import { Button } from "@/components/ui/button";
import { NewsCardSkeleton, DetailPanelSkeleton } from "@/components/ui/skeleton";

export function DesktopFeedPage({ todaysNews, loading, error, lastUpdated, onRefresh }) {
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const selectedArticle = todaysNews.find(article => article.id === selectedArticleId);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-parchment-400 shadow-header">
          <div className="max-w-7xl mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-ivy mb-1">
                  Evening Almanac
                </h1>
                <div className="flex items-center gap-2 text-sm text-ivy-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(new Date())}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-10">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
            <div className="col-span-8">
              <div className="sticky top-32">
                <DetailPanelSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-ivy mb-3">
            Unable to Load News
          </h2>
          <p className="text-ivy-700 mb-6 leading-relaxed">{error}</p>
          <Button onClick={onRefresh} size="lg" className="px-8">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-parchment-400 shadow-header">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-ivy mb-1">
                Evening Almanac
              </h1>
              <div className="flex items-center gap-2 text-sm text-ivy-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(lastUpdated || new Date())}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              title="Refresh news"
              className="hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-ivy-700 text-xl font-serif text-center leading-relaxed">
            Today's stories worth discussing at the dinner table
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Article List */}
          <div className="col-span-4 space-y-4">
            {todaysNews.map((article, index) => (
              <DesktopNewsCard
                key={article.id}
                article={article}
                index={index}
                isActive={selectedArticleId === article.id}
                onClick={() => setSelectedArticleId(article.id)}
              />
            ))}
          </div>

          {/* Right Column - Detail Panel */}
          <div className="col-span-8">
            <DetailPanel article={selectedArticle} />
          </div>
        </div>
      </main>
    </div>
  );
}
