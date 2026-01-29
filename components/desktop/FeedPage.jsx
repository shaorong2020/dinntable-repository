"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, RefreshCw, Sparkles } from "lucide-react";
import { DesktopNewsCard } from "@/components/desktop/NewsCard";
import { DetailPanel } from "@/components/desktop/DetailPanel";
import { Button } from "@/components/ui/button";
import { NewsCardSkeleton, DetailPanelSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DesktopFeedPage({ todaysNews, loading, error, lastUpdated, onRefresh, language, onLanguageChange }) {
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  const formatDate = (date) => {
    if (language === 'zh') {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const translations = {
    en: {
      title: "Evening Almanac",
      subtitle: "Today's curated stories for your dinner conversation. Select a story from the list to explore the full summary and discussion prompts.",
      footer1: "Curated with care for meaningful family discussions.",
      footer2: "Fresh stories arrive tomorrow morning.",
    },
    zh: {
      title: "晚间文摘",
      subtitle: "今日精选新闻，助力晚餐时光的深度对话。选择左侧文章查看摘要和讨论话题。",
      footer1: "精心策划，助力家庭深度对话",
      footer2: "明日清晨更新新一期",
    },
  };

  const t = translations[language];

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
                {t.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-ivy-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(new Date())}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <div className="flex items-center gap-1 bg-parchment-200 p-1 rounded-lg">
                <button
                  onClick={() => onLanguageChange("en")}
                  className={cn(
                    "py-1.5 px-4 text-sm font-medium rounded-md transition-all",
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
                    "py-1.5 px-4 text-sm font-medium rounded-md transition-all",
                    language === "zh"
                      ? "bg-white text-ivy shadow-sm"
                      : "text-gray-600 hover:text-ivy"
                  )}
                >
                  中文
                </button>
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
            {t.subtitle}
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

        {/* Footer text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-ivy-600 font-serif italic">
            {t.footer1}
          </p>
          <p className="text-sm text-ivy-600 font-serif italic">
            {t.footer2}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
