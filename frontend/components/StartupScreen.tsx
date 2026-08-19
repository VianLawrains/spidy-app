'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomQuote } from '../lib/quotes';

interface StartupScreenProps {
  onComplete?: () => void;
}

export default function StartupScreen({ onComplete }: StartupScreenProps) {
  const [quote, setQuote] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setQuote(getRandomQuote());

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // Allow fade-out animation to complete
    }, 2400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#07080b] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle Ambient Red Glow Orbs */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1], opacity: [0.3, 0.6, 0.4] }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute w-[500px] h-[500px] bg-spidy-red/20 rounded-full blur-[120px] pointer-events-none"
          />

          {/* Web Lines Background Pattern */}
          <div className="absolute inset-0 bg-spider-grid opacity-30 pointer-events-none" />

          {/* Centered Spidy Brand Content */}
          <div className="relative z-10 flex flex-col items-center space-y-6 max-w-lg text-center">
            {/* 3D Scale-in Spidy Logo */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotateY: -30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                className="relative inline-block"
              >
                {/* Red Pulse Aura */}
                <div className="absolute -inset-2 bg-gradient-to-r from-spidy-red via-spidy-crimson to-red-600 rounded-full blur-md opacity-80 animate-pulse" />
                <img
                  src="/images.jpg"
                  alt="Spidy AI Logo"
                  className="relative w-20 h-20 rounded-full border-2 border-spidy-red object-cover shadow-2xl"
                />
              </motion.div>
            </motion.div>

            {/* SPIDY AI Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-1"
            >
              <h1 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-spidy-red">
                SPIDY AI
              </h1>
              <p className="text-[11px] font-mono tracking-wider text-spidy-crimson uppercase">
                Intelligence Suite
              </p>
            </motion.div>

            {/* Random Quote with Blur -> Sharp Transition */}
            <motion.div
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="px-6 py-3 rounded-2xl glass-panel border border-spidy-border/70 max-w-sm shadow-xl"
            >
              <p className="text-xs italic font-medium text-gray-300">
                "{quote}"
              </p>
            </motion.div>

            {/* Loading Indicator Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-36 h-1 bg-spidy-surface rounded-full overflow-hidden relative"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-full h-full bg-gradient-to-r from-spidy-red to-spidy-crimson rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
