"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
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

export function MobileNewsCard({ article, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryColor = (category) => {
    const lowerCategory = category?.toLowerCase() || "";
    return categoryColors[lowerCategory] || categoryColors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
    >
      <Card className="overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                getCategoryColor(article.category)
              )}
            >
              {article.category}
            </span>
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
              {article.source}
            </span>
          </div>
          <CardTitle className="text-xl leading-snug font-bold">
            {article.headline}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 mb-5">
                  <div className="border-t-2 border-dashed border-parchment-400 pt-4">
                    <h4 className="font-bold text-sm text-ivy mb-3 uppercase tracking-wide">
                      Summary
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                  {article.discussionPrompts && article.discussionPrompts.length > 0 && (
                    <div className="border-t-2 border-dashed border-parchment-400 pt-4">
                      <h4 className="font-bold text-sm text-ivy mb-3 uppercase tracking-wide">
                        Discussion Prompts
                      </h4>
                      <ol className="space-y-3">
                        {article.discussionPrompts.map((prompt, idx) => (
                          <li
                            key={idx}
                            className="flex gap-3"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta/10 text-terracotta font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
                              {prompt}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {article.sourceUrl && (
                    <div className="border-t-2 border-dashed border-parchment-400 pt-4">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full group hover:bg-ivy hover:text-white hover:border-ivy transition-all"
                      >
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <span className="font-semibold text-xs">Read Full Article</span>
                          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-center gap-2 hover:bg-ivy-50"
          >
            <span className="text-sm font-semibold">
              {isExpanded ? "Show less" : "Read more"}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
