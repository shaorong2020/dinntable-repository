"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categoryColors = {
  technology: "bg-ivy-100 text-ivy-800 border-ivy-300",
  science: "bg-emerald-100 text-emerald-800 border-emerald-300",
  business: "bg-amber-100 text-amber-800 border-amber-300",
  politics: "bg-rose-100 text-rose-800 border-rose-300",
  world: "bg-rose-100 text-rose-800 border-rose-300",
  social: "bg-pink-100 text-pink-800 border-pink-300",
  culture: "bg-pink-100 text-pink-800 border-pink-300",
  default: "bg-gray-100 text-gray-800 border-gray-300",
};

export function DetailPanel({ article }) {
  const getCategoryColor = (category) => {
    const lowerCategory = category?.toLowerCase() || "";
    return categoryColors[lowerCategory] || categoryColors.default;
  };

  if (!article) {
    return (
      <div className="sticky top-32 self-start">
        <Card className="p-16 bg-gradient-to-br from-white to-parchment-100">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-ivy-50 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-ivy-400" />
            </div>
            <p className="font-serif text-2xl text-ivy-600 mb-2">
              Select a story
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Choose an article from the list to read the full details and discussion prompts
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="sticky top-32 self-start">
      <AnimatePresence mode="wait">
        <motion.div
          key={article.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden shadow-card-hover">
            <CardHeader className="pb-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                    getCategoryColor(article.category)
                  )}
                >
                  {article.category}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full">
                  <Newspaper className="w-4 h-4" />
                  <span className="font-medium">{article.source}</span>
                </div>
              </div>
              <CardTitle className="text-3xl leading-tight font-bold">
                {article.headline}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="border-t-2 border-dashed border-parchment-400 pt-6">
                <h4 className="font-bold text-base text-ivy mb-4 uppercase tracking-wide">
                  Summary
                </h4>
                <p className="text-base text-gray-700 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              {article.discussionPrompts && article.discussionPrompts.length > 0 && (
                <div className="border-t-2 border-dashed border-parchment-400 pt-6">
                  <h4 className="font-bold text-base text-ivy mb-4 uppercase tracking-wide">
                    Discussion Prompts
                  </h4>
                  <ol className="space-y-4">
                    {article.discussionPrompts.map((prompt, idx) => (
                      <li
                        key={idx}
                        className="flex gap-4 group"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-terracotta/10 text-terracotta font-bold text-sm flex items-center justify-center group-hover:bg-terracotta group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <p className="text-base text-gray-700 leading-relaxed pt-0.5">
                          {prompt}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {article.sourceUrl && (
                <div className="border-t-2 border-dashed border-parchment-400 pt-6">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group hover:bg-ivy hover:text-white hover:border-ivy transition-all"
                  >
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="font-semibold">Read Full Article</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
