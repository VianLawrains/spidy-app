'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CreatedByVian: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Show for 4.2 seconds on app startup, then smoothly fade out
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 right-4 z-50 pointer-events-none select-none flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 border border-spidy-red/40 backdrop-blur-md shadow-2xl"
        >
          <div className="w-2 h-2 rounded-full bg-spidy-red animate-ping" />
          <span className="text-xs font-semibold text-gray-200 tracking-wide">
            Created by <span className="text-spidy-crimson font-bold">Vian</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
