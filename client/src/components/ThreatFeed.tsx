import { useEffect, useState, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Shield, 
  Bug, 
  Network, 
  Skull, 
  Target,
  ExternalLink,
  RefreshCw,
  Clock,
  Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface ThreatItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'cve' | 'malware' | 'phishing' | 'botnet' | 'ransomware' | 'apt';
  source: string;
  timestamp: string;
  description?: string;
  cveId?: string;
}

const severityStyles = {
  critical: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    glow: 'shadow-red-500/20',
    icon: Skull,
  },
  high: {
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    glow: 'shadow-orange-500/20',
    icon: AlertTriangle,
  },
  medium: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
    icon: Shield,
  },
  low: {
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    glow: 'shadow-green-500/20',
    icon: Shield,
  }
};

const typeStyles = {
  cve: { icon: Bug, color: 'text-blue-400' },
  malware: { icon: Skull, color: 'text-red-400' },
  phishing: { icon: Target, color: 'text-yellow-400' },
  botnet: { icon: Network, color: 'text-purple-400' },
  ransomware: { icon: Flame, color: 'text-orange-400' },
  apt: { icon: Shield, color: 'text-cyan-400' }
};

const typeTranslationKeys: Record<string, string> = {
  cve: 'threatFeed.typeCve',
  malware: 'threatFeed.typeMalware',
  phishing: 'threatFeed.typePhishing',
  botnet: 'threatFeed.typeBotnet',
  ransomware: 'threatFeed.typeRansomware',
  apt: 'threatFeed.typeApt',
};

const severityTranslationKeys: Record<string, string> = {
  critical: 'dashboard.riskLevels.critical',
  high: 'dashboard.riskLevels.high',
  medium: 'dashboard.riskLevels.medium',
  low: 'dashboard.riskLevels.low',
};

interface ThreatCardProps {
  threat: ThreatItem;
  index: number;
}

const ThreatCard = forwardRef<HTMLDivElement, ThreatCardProps>(
  function ThreatCardInner({ threat, index }, ref) {
    const { t } = useTranslation();
    const severity = severityStyles[threat.severity];
    const typeInfo = typeStyles[threat.type];
    const TypeIcon = typeInfo.icon;

    const formatTimeAgo = (timestamp: string): string => {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) return `${diffMins} ${t('time.minutesAgo')}`;
      if (diffHours < 24) return `${diffHours} ${t('time.hoursAgo')}`;
      return `${diffDays} ${t('time.daysAgo')}`;
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        
        <div className="relative flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-white/5 hover:border-primary/20 transition-all duration-300">
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${severity.color} border`}>
            <TypeIcon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {threat.title}
                </h4>
                {threat.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {threat.description}
                  </p>
                )}
              </div>
              <Badge 
                variant="outline" 
                className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 ${severity.color} border`}
              >
                {t(severityTranslationKeys[threat.severity]).toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className={`flex items-center gap-1 ${typeInfo.color}`}>
                <TypeIcon className="w-3 h-3" />
                {t(typeTranslationKeys[threat.type])}
              </span>
              <span className="opacity-40">|</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(threat.timestamp)}
              </span>
              <span className="opacity-40">|</span>
              <span className="font-mono">{threat.source}</span>
            </div>
          </div>

          {threat.cveId && (
            <a
              href={`https://nvd.nist.gov/vuln/detail/${threat.cveId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
              data-testid={`link-cve-${threat.cveId}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </motion.div>
    );
  }
);

ThreatCard.displayName = "ThreatCard";

export function ThreatFeed() {
  const { t } = useTranslation();
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: threats, isLoading, refetch, isFetching } = useQuery<ThreatItem[]>({
    queryKey: ['/api/threat-feed'],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAutoScrolling || !scrollContainerRef.current || !threats?.length) return;

    const container = scrollContainerRef.current;
    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.3;

    const scroll = () => {
      if (!container) return;
      
      scrollPosition += scrollSpeed;
      
      if (scrollPosition >= container.scrollHeight - container.clientHeight) {
        scrollPosition = 0;
      }
      
      container.scrollTop = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(scroll);
    }, 2000);

    const handleMouseEnter = () => {
      cancelAnimationFrame(animationId);
    };

    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(scroll);
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationId);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isAutoScrolling, threats]);

  return (
    <Card className="relative overflow-hidden bg-card/50 border-white/5">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{t('threatFeed.title')}</h3>
              <p className="text-xs text-muted-foreground">{t('threatFeed.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all disabled:opacity-50"
            data-testid="button-refresh-threats"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div 
          ref={scrollContainerRef}
          className="relative h-[320px] sm:h-[380px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 pr-1">
              <AnimatePresence mode="popLayout">
                {threats?.map((threat, index) => (
                  <ThreatCard key={threat.id} threat={threat} index={index} />
                ))}
              </AnimatePresence>

              {threats && threats.length > 4 && (
                <div className="pt-2">
                  <AnimatePresence mode="popLayout">
                    {threats?.slice(0, 4).map((threat, index) => (
                      <ThreatCard 
                        key={`repeat-${threat.id}`} 
                        threat={threat} 
                        index={index + threats.length} 
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>

        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>{t('threatFeed.autoRefresh')}</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>{threats?.length || 0} {t('threatFeed.threatsCount')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
