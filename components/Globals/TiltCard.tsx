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
}) => {
  // motion values centered at 0 (0 = center)
  const mouseX = useMotionValue(0); // -0.5 .. 0.5
  const mouseY = useMotionValue(0); // -0.5 .. 0.5

  // map centered mouse values to rotation degrees
  const rotateYRaw = useTransform(mouseX, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateXRaw = useTransform(mouseY, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // smooth with spring for nicer motion
  const rotateY = useSpring(rotateYRaw, { stiffness: 150, damping: 18 });
  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // normalize to -0.5 .. 0.5 with (center = 0)
    const normX = offsetX / rect.width - 0.5;
    const normY = offsetY / rect.height - 0.5;

    // set values
    mouseX.set(normX);
    mouseY.set(normY);
  };

  const handleMouseLeave = () => {
    // animate back to center (0)
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    // outer wrapper provides perspective
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective }}
      className={`will-change-transform`} // keep classes customizable
    >
      <motion.div
        // apply 3D rotations on the inner element
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileTap={{ scale: 0.98 }}
        className="relative transform-gpu overflow-hidden rounded-[20px]" // ensures GPU-accelerated transforms
      >
        {children}
      </motion.div>
    </div>
  );
};

export default TiltCard;
