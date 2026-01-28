"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Newspaper } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categoryColors = {
  technology: "bg-ivy-100 text-ivy-700 border-ivy-200",
  science: "bg-emerald-100 text-emerald-700 border-emerald-200",
  business: "bg-amber-100 text-amber-700 border-amber-200",
  politics: "bg-rose-100 text-rose-700 border-rose-200",
  world: "bg-rose-100 text-rose-700 border-rose-200",
  social: "bg-pink-100 text-pink-700 border-pink-200",
  culture: "bg-pink-100 text-pink-700 border-pink-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

export function NewsCard({ article, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryColor = (category) => {
    const lowerCategory = category?.toLowerCase() || "";
    return categoryColors[lowerCategory] || categoryColors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                getCategoryColor(article.category)
              )}
            >
              {article.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Newspaper className="w-4 h-4" />
              <span className="text-xs">{article.source}</span>
            </div>
          </div>
          <CardTitle className="text-xl leading-tight">
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
                <div className="space-y-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-sm text-ivy mb-2">
                      Summary
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                  {article.discussionPrompts && article.discussionPrompts.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-ivy mb-2">
                        Discussion Prompts
                      </h4>
                      <ul className="space-y-2">
                        {article.discussionPrompts.map((prompt, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-terracotta"
                          >
                            {prompt}
                          </li>
                        ))}
                      </ul>
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
            className="w-full justify-center gap-2"
          >
            <span className="text-sm font-medium">
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
