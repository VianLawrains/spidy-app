'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OpeningWebAnimationProps {
  onComplete: () => void;
  onUserInteraction?: () => void;
}

export const OpeningWebAnimation: React.FC<OpeningWebAnimationProps> = ({ onComplete, onUserInteraction }) => {
  const [stage, setStage] = useState<'black' | 'logo' | 'leftWeb' | 'rightWeb' | 'cornerWebs' | 'webForm' | 'glow' | 'fade'>('black');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('logo'), 200);
    const t2 = setTimeout(() => setStage('leftWeb'), 400);
    const t3 = setTimeout(() => setStage('rightWeb'), 600);
    const t4 = setTimeout(() => setStage('cornerWebs'), 800);
    const t5 = setTimeout(() => setStage('webForm'), 1000);
    const t6 = setTimeout(() => setStage('glow'), 2000);
    const t7 = setTimeout(() => setStage('fade'), 2500);
    const t8 = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
    };
  }, [onComplete]);

  const handleScreenClick = () => {
    if (onUserInteraction) onUserInteraction();
    setStage('fade');
    setTimeout(() => onComplete(), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: stage === 'fade' ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      onClick={handleScreenClick}
      className="fixed inset-0 z-50 bg-[#0b0c10] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
    >
      {/* SVG Canvas for Cinematic Web Animations */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="webBrightGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="webGradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e63946" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d62828" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 0.4s: LEFT Web Shoot */}
        {(stage !== 'black' && stage !== 'logo') && (
          <motion.path
            d="M 0,300 C 300,450 600,480 960,540"
            fill="none"
            stroke="url(#webGradientRed)"
            strokeWidth="4"
            filter="url(#webBrightGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}

        {/* 0.6s: RIGHT Web Shoot */}
        {(stage === 'rightWeb' || stage === 'cornerWebs' || stage === 'webForm' || stage === 'glow' || stage === 'fade') && (
          <motion.path
            d="M 1920,300 C 1620,450 1320,480 960,540"
            fill="none"
            stroke="url(#webGradientRed)"
            strokeWidth="4"
            filter="url(#webBrightGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}

        {/* 0.8s: Corner Strands */}
        {(stage === 'cornerWebs' || stage === 'webForm' || stage === 'glow' || stage === 'fade') && (
          <g filter="url(#webBrightGlow)">
            <motion.path
              d="M 0,0 L 960,540"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M 1920,0 L 960,540"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M 0,1080 L 960,540"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M 1920,1080 L 960,540"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </g>
        )}

        {/* 1.0s - 2.5s: Web Form & Glow */}
        {(stage === 'webForm' || stage === 'glow' || stage === 'fade') && (
          <g filter="url(#webBrightGlow)">
            {[120, 220, 340, 480].map((r, i) => (
              <motion.circle
                key={i}
                cx="960"
                cy="540"
                r={r}
                fill="none"
                stroke="rgba(230, 57, 70, 0.7)"
                strokeWidth="2"
                strokeDasharray="10 6"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: stage === 'glow' ? 1 : 0.7 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              />
            ))}
          </g>
        )}
      </svg>

      {/* Spidy AI Logo & Text Branding */}
      {stage !== 'black' && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: stage === 'glow' ? 1.08 : 1,
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center space-y-4"
        >
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-spidy-red to-spidy-crimson rounded-full blur-xl opacity-90 animate-pulse"></div>
            <img
              src="/images.jpg"
              alt="Spidy AI Logo"
              className="relative w-28 h-28 rounded-full border-4 border-spidy-red object-cover shadow-2xl mx-auto"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              SPIDY AI
            </h1>
            <p className="text-xs md:text-sm text-spidy-crimson font-medium italic">
              "Small progress is still progress."
            </p>
            <p className="text-[11px] text-gray-400 font-mono tracking-widest uppercase">
              Your professional AI assistant
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
