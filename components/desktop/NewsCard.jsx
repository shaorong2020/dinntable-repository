"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
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

export function DesktopNewsCard({ article, index, isActive, onClick }) {
  const getCategoryColor = (category) => {
    const lowerCategory = category?.toLowerCase() || "";
    return categoryColors[lowerCategory] || categoryColors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-300 overflow-hidden group",
          isActive
            ? "bg-white border-ivy/40 shadow-card-active ring-2 ring-ivy/10"
            : "bg-white/80 border-parchment-400 hover:bg-white hover:border-ivy/30 hover:shadow-card-hover"
        )}
        onClick={onClick}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                getCategoryColor(article.category)
              )}
            >
              {article.category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                {article.source}
              </span>
              <ChevronRight
                className={cn(
                  "w-5 h-5 text-ivy transition-all duration-300 flex-shrink-0",
                  isActive ? "rotate-90" : "group-hover:translate-x-1"
                )}
              />
            </div>
          </div>

          <h3 className="font-serif text-xl font-bold text-ivy leading-snug group-hover:text-ivy-600 transition-colors">
            {article.headline}
          </h3>
        </div>
      </Card>
    </motion.div>
  );
}
