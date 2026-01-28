"use client";

import { motion } from "framer-motion";
import { Calendar, RefreshCw, Sparkles } from "lucide-react";
import { MobileNewsCard } from "@/components/mobile/NewsCard";
import { Button } from "@/components/ui/button";
import { NewsCardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MobileFeedPage({ todaysNews, loading, error, lastUpdated, onRefresh, language, onLanguageChange }) {
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-parchment-400 shadow-header">
          <div className="max-w-lg mx-auto px-5 py-4">
            <h1 className="text-xl font-serif font-bold text-ivy mb-2">
              Evening Almanac
            </h1>
            <div className="flex items-center gap-2 text-xs text-ivy-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(new Date())}</span>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-5 py-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-ivy mb-3">
            Unable to Load News
          </h2>
          <p className="text-ivy-700 mb-6 leading-relaxed">{error}</p>
          <Button onClick={onRefresh} size="lg" className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-parchment-400 shadow-header">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-serif font-bold text-ivy">
              Evening Almanac
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              title="Refresh news"
              className="hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-parchment-200 p-1 rounded-lg mb-3">
            <button
              onClick={() => onLanguageChange("en")}
              className={cn(
                "flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all",
                language === "en"
                  ? "bg-white text-ivy shadow-sm"
                  : "text-gray-600 hover:text-ivy"
              )}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange("zh")}
              className={cn(
                "flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all",
                language === "zh"
                  ? "bg-white text-ivy shadow-sm"
                  : "text-gray-600 hover:text-ivy"
              )}
            >
              中文
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-ivy-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(lastUpdated || new Date())}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-ivy-700 text-base font-serif text-center leading-relaxed">
            Today's stories worth discussing at the dinner table
          </p>
        </motion.div>

        <div className="space-y-5">
          {todaysNews.map((article, index) => (
            <MobileNewsCard key={article.id} article={article} index={index} />
          ))}
        </div>
      </main>
    </div>
  );
}
