import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Search,
  MousePointerClick,
  BarChart3,
  Layers,
  History,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "ds-onboarding-completed";

interface OnboardingStep {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tip?: string;
}

const steps: OnboardingStep[] = [
  {
    icon: Shield,
    iconColor: "text-cyan-400",
    iconBg: "from-cyan-500/20 to-green-500/10",
    title: "Welcome to DARKSHARE",
    description:
      "Your all-in-one OSINT security scanner. Check IPs, emails, wallets, domains, and more — all from a single dashboard.",
    tip: "Let's take a quick tour of the key features.",
  },
  {
    icon: MousePointerClick,
    iconColor: "text-blue-400",
    iconBg: "from-blue-500/20 to-cyan-500/10",
    title: "Select a Check Type",
    description:
      "Choose from 17 check types including IP, Email, Phone, Wallet, Domain, URL, Bot Token, CVE, Hash, Username, Card BIN, Password, DNS, SSL/TLS, MAC, EXIF, and GeoINT.",
    tip: "Each type runs specialized analysis engines for accurate results.",
  },
  {
    icon: Search,
    iconColor: "text-purple-400",
    iconBg: "from-purple-500/20 to-pink-500/10",
    title: "Enter a Target",
    description:
      "Type or paste the value you want to investigate into the input field, then hit the Scan button to start the analysis.",
    tip: "Press Enter or Ctrl+Enter to quickly submit your check.",
  },
  {
    icon: BarChart3,
    iconColor: "text-orange-400",
    iconBg: "from-orange-500/20 to-amber-500/10",
    title: "View Results",
    description:
      "After scanning, you'll see a detailed risk assessment with a score, findings, AI-powered insights, and actionable recommendations.",
    tip: "Results include sources, threat levels, and exportable reports.",
  },
  {
    icon: Layers,
    iconColor: "text-cyan-400",
    iconBg: "from-cyan-500/20 to-teal-500/10",
    title: "Bulk Mode",
    description:
      "Toggle Bulk Mode to check multiple targets at once. Enter one target per line — up to 20 at a time — and run them all in parallel.",
    tip: "Great for batch investigations and large-scale reconnaissance.",
  },
  {
    icon: History,
    iconColor: "text-green-400",
    iconBg: "from-green-500/20 to-cyan-500/10",
    title: "History & Monitoring",
    description:
      "Access your past scans from the History page and set up continuous monitoring from the sidebar navigation.",
    tip: "Use Quick Actions to instantly re-run previous checks.",
  },
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleFinish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }, [currentStep, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="onboarding-overlay"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleFinish}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.5)]"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2 mb-6">
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono">
                {currentStep + 1}/{steps.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFinish}
                className="text-xs text-muted-foreground"
                data-testid="button-skip-tour"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Skip tour
              </Button>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <motion.div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${step.iconBg} border border-white/10 flex items-center justify-center mb-5`}
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <StepIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${step.iconColor}`} />
              </motion.div>

              <motion.h2
                className="text-xl sm:text-2xl font-display font-bold text-white mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {step.title}
              </motion.h2>

              <motion.p
                className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {step.description}
              </motion.p>

              {step.tip && (
                <motion.div
                  className="mt-4 flex items-start gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-xs sm:text-sm text-cyan-300/80 text-left">
                    {step.tip}
                  </span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-1 rounded-full overflow-hidden bg-white/10"
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-400"
                    initial={false}
                    animate={{ width: idx <= currentStep ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={isFirst}
                className="text-zinc-400"
                data-testid="button-tour-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-cyan-600 to-green-500 border-cyan-400/30 text-white px-5"
                data-testid="button-tour-next"
              >
                {isLast ? "Get Started" : "Next"}
                {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== "true";
  });

  const completeTour = useCallback(() => {
    setShowTour(false);
  }, []);

  return { showTour, completeTour };
}
