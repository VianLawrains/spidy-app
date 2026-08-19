'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import { Zap, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';
import { SunflowerMusicPlayer, SunflowerMusicPlayerRef } from './SunflowerMusicPlayer';

interface NavbarProps {
  activeTab: string;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  onOpenProfile: () => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (v: boolean) => void;
  onUserInteraction?: () => void;
}

export const Navbar = forwardRef<SunflowerMusicPlayerRef, NavbarProps>(
  (
    {
      activeTab,
      selectedModel,
      setSelectedModel,
      onOpenProfile,
      isVoiceActive,
      setIsVoiceActive,
      onUserInteraction,
    },
    ref
  ) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      setIsMounted(true);
      if (typeof window !== 'undefined') {
        setIsAuthenticated(!!localStorage.getItem('spidy_token'));
      }
    }, []);

    const handleLogout = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('spidy_token');
        window.location.reload();
      }
    };

    return (
      <header className="h-16 border-b border-spidy-border glass-panel sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Brand & Spidy Poster Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-spidy-red to-spidy-crimson rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img
              src="/images.jpg"
              alt="Spidy AI Logo"
              className="relative w-10 h-10 rounded-full border-2 border-spidy-red object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
                SPIDY <span className="text-spidy-red text-xs px-1.5 py-0.5 rounded bg-spidy-red/20 border border-spidy-red/40 font-mono">PRO AI</span>
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
              Professional AI Suite • Software Architecture • Document Analysis
            </p>
          </div>
        </div>

        {/* Center/Right Actions & Sunflower Music Player */}
        <div className="flex items-center gap-3">
          {/* Sunflower Music Player with forwarded Ref */}
          <SunflowerMusicPlayer ref={ref} onInteraction={onUserInteraction} />

          {/* Model Selector Dropdown */}
          <div className="relative hidden xl:flex items-center bg-spidy-surface/80 border border-spidy-border rounded-lg px-2.5 py-1.5 text-xs text-gray-200">
            <Zap className="w-3.5 h-3.5 text-spidy-crimson mr-2" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer pr-2 font-medium"
            >
              <option value="gemini-3.6-flash" className="bg-spidy-dark text-white">Gemini 3.6 Flash (High Speed)</option>
              <option value="gpt-4o" className="bg-spidy-dark text-white">GPT-4o (Reasoning)</option>
              <option value="claude-3-5" className="bg-spidy-dark text-white">Claude 3.5 Sonnet</option>
              <option value="ollama-local" className="bg-spidy-dark text-white">Ollama Local (Offline)</option>
            </select>
          </div>

          {/* Hydration-safe Auth Action Buttons */}
          {isMounted && isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-spidy-surface text-gray-300 border border-spidy-border hover:border-spidy-red hover:text-white transition-all"
              title="Logout of session"
            >
              <LogOut className="w-3.5 h-3.5 text-spidy-crimson" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold spidy-btn-primary text-white"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Signup</span>
            </Link>
          )}

          {/* User Profile Trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 rounded-full bg-spidy-surface border border-spidy-border hover:border-spidy-red transition-all"
          >
            <img
              src="/images.jpg"
              alt="User Profile"
              className="w-7 h-7 rounded-full object-cover border border-spidy-red"
            />
          </button>
        </div>
      </header>
    );
  }
);

Navbar.displayName = 'Navbar';
