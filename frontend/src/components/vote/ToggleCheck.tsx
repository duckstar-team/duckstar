'use client';

import { motion } from 'framer-motion';

interface ToggleCheckProps {
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export default function ToggleCheck({
  isSelected,
  onClick,
  className = ""
}: ToggleCheckProps) {
  return (
    <motion.button
      className={`w-[22px] h-[22px] ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
      aria-pressed={isSelected}
      aria-label={isSelected ? "Selected" : "Not selected"}
    >
      {isSelected ? (
        <div className="w-[22px] h-[22px] left-0 top-0 absolute">
          <div className="w-[22px] h-[22px] left-0 top-0 absolute bg-[#FFB310] rounded-full" />
          <motion.div
            className="w-4 h-4 left-[3px] top-[3px] absolute bg-[#FFB310] rounded-full border-[2.50px] border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
          />
        </div>
      ) : (
        <div className="w-[22px] h-[22px] left-0 top-0 absolute rounded-full border-[1.83px] border-black" />
      )}
    </motion.button>
  );
}
