import { motion } from "framer-motion";
import { useMemo } from "react";

interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
}

export function FloatingParticles({ 
  count = 20, 
  colors = ["#22c55e", "#14b8a6", "#06b6d4", "#8b5cf6"] 
}: FloatingParticlesProps) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      duration: 20 + Math.random() * 25,
      delay: Math.random() * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.05 + Math.random() * 0.15,
    })),
    [count, colors]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            filter: `blur(${particle.size / 2}px)`,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.sin(particle.id) * 40, 0],
            scale: [1, 1.3, 1],
            opacity: [particle.opacity, particle.opacity * 1.4, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
