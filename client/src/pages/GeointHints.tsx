import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronDown,
  Search,
  Globe,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";

const categoryNames: Record<string, string> = {
  road_signs: "Road Signs",
  road_markings: "Road Markings",
  license_plates: "License Plates",
  architecture: "Architecture & Buildings",
  fences_barriers: "Fences & Barriers",
  vegetation: "Vegetation & Nature",
  utility_poles: "Utility Poles & Wiring",
  ground_surface: "Ground & Sidewalks",
  language_scripts: "Language & Scripts",
  vehicles: "Vehicles & Transport",
};

export default function GeointHints() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ hints: Array<{ category: string; icon: string; items: Array<{ region: string; hint: string }> }> }>({
    queryKey: ["/api/geoint-hints"],
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredHints = data?.hints?.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hint.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <PageLayout title="GEOINT">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-display font-bold flex items-center justify-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            GEOINT Hints
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Reference guide for geolocation analysis. Identify countries and regions by visual clues — road signs, architecture, vegetation, license plates, and more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by region or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/30 border-white/10 backdrop-blur-xl"
              data-testid="input-geoint-search"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHints?.map((group, idx) => {
              const isExpanded = expandedCategories.has(group.category) || searchQuery.length > 0;
              return (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-black/30 border-white/10 backdrop-blur-xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(group.category)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                      data-testid={`button-category-${group.category}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{group.icon}</span>
                        <div className="text-left">
                          <span className="font-semibold">
                            {categoryNames[group.category] || group.category}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({group.items.length} regions)
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {group.items.map((item, i) => (
                              <div
                                key={i}
                                className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                              >
                                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                  <Badge variant="outline" className="text-xs mb-1 border-primary/30 text-primary">
                                    {item.region}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.hint}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}

            {filteredHints?.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
