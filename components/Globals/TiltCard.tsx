"use client";

import { FC, ReactNode } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // degrees
  perspective?: number; // px
}

const TiltCard: FC<TiltCardProps> = ({
  children,
  maxTilt = 12,
  perspective = 1000,
  className = "",
}) => {
  // motion values centered at 0 (0 = center)
  const mouseX = useMotionValue(0); // -0.5 .. 0.5
  const mouseY = useMotionValue(0); // -0.5 .. 0.5

  // smooth spring for mouse position
  const mouseXSpring = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // map sprung mouse values to rotation degrees
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // map sprung mouseX/mouseY to gloss offsets (now smooth!)
  const glossX = useTransform(mouseXSpring, [-0.5, 0.5], ["-20%", "80%"]);
  const glossY = useTransform(mouseYSpring, [-0.5, 0.5], ["-20%", "20%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const normX = offsetX / rect.width - 0.5;
    const normY = offsetY / rect.height - 0.5;

    mouseX.set(normX);
    mouseY.set(normY);
  };

  const handleMouseLeave = () => {
    // animate back smoothly via spring
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective }}
      className={`will-change-transform ${className}`}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileTap={{ scale: 0.98 }}
        className="relative transform-gpu overflow-hidden rounded-[20px]"
      >
        {/* Dynamic Gloss Overlay */}
        <motion.div
          style={{
            x: glossX,
            y: glossY,
            transform: "skewX(-20deg)",
          }}
          className="absolute w-[60%] h-full bg-white/30 blur-xl opacity-40 pointer-events-none z-20"
        />

        {/* Card Content */}
        {children}
      </motion.div>
    </div>
  );
};

export default TiltCard;