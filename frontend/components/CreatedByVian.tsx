'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CreatedByVian: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Show for 6.5 seconds on initial load so it remains elegantly visible for 3.5s after startup overlays clear
    const timer = setTimeout(() => {
      setVisible(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 14, x: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, x: 4, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-[100000] pointer-events-none select-none flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#07080b]/95 border border-spidy-red/50 backdrop-blur-xl shadow-[0_0_25px_rgba(220,38,38,0.35)]"
        >
          {/* Subtle Crimson Glow Pulse Indicator */}
          <div className="relative flex items-center justify-center w-2 h-2">
            <div className="absolute w-3 h-3 rounded-full bg-spidy-red/60 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-spidy-red shadow-[0_0_8px_#ff0033]" />
          </div>

          {/* Premium Minimalist Typography */}
          <span className="text-xs font-medium text-gray-300 tracking-wider font-mono">
            Created by <span className="text-white font-extrabold tracking-normal drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">Vian</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
