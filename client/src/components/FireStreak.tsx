import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface FireStreakProps {
  streakDays: number;
  size?: "sm" | "md" | "lg";
}

export function FireStreak({ streakDays, size = "md" }: FireStreakProps) {
  const sizeConfig = {
    sm: { container: "w-12 h-12", icon: "w-5 h-5", text: "text-xs", particles: 4 },
    md: { container: "w-16 h-16", icon: "w-7 h-7", text: "text-sm", particles: 6 },
    lg: { container: "w-20 h-20", icon: "w-9 h-9", text: "text-base", particles: 8 },
  };

  const config = sizeConfig[size];
  const isActive = streakDays > 0;

  const particles = Array.from({ length: config.particles }, (_, i) => ({
    id: i,
    delay: i * 0.15,
    x: (Math.random() - 0.5) * 30,
    duration: 0.8 + Math.random() * 0.5,
  }));

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className={`${config.container} rounded-2xl flex items-center justify-center relative overflow-visible`}
        style={{
          background: isActive
            ? "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #dc2626 100%)"
            : "linear-gradient(135deg, #3f3f46 0%, #27272a 100%)",
        }}
        animate={isActive ? {
          boxShadow: [
            "0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)",
            "0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)",
            "0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)",
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isActive && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: "linear-gradient(to top, #f97316, #fbbf24)",
              bottom: "50%",
            }}
            animate={{
              y: [-10, -40],
              x: [0, particle.x],
              opacity: [1, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeOut",
            }}
          />
        ))}

        <motion.div
          animate={isActive ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Flame className={`${config.icon} ${isActive ? "text-white" : "text-zinc-500"}`} />
        </motion.div>
      </motion.div>

      <motion.div 
        className={`mt-2 font-bold ${config.text} ${isActive ? "text-orange-400" : "text-zinc-500"}`}
        animate={isActive && streakDays >= 7 ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {streakDays} {streakDays === 1 ? "день" : streakDays < 5 ? "дні" : "днів"}
      </motion.div>

      {streakDays >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-orange-500/80 font-medium"
        >
          На вогні!
        </motion.div>
      )}
    </div>
  );
}
