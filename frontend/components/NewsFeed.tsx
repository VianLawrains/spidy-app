'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, Flame, Cpu, Code, Clock, ExternalLink } from 'lucide-react';
import { fetchNewsFeedApi } from '../lib/api';

export const NewsFeed: React.FC = () => {
  const [category, setCategory] = useState('all');
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetchNewsFeedApi(category).then(setNews).catch(console.error);
  }, [category]);

  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'ai', label: 'AI & ML' },
    { id: 'programming', label: 'Programming' },
    { id: 'crypto', label: 'Crypto & Finance' },
    { id: 'weather', label: 'Science & Weather' },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 bg-spidy-dark overflow-y-auto max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40">
          <Newspaper className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Spidy Daily Intelligence & News Feed
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Real-time updates on AI breakthroughs, Programming updates, Crypto trends & Science.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              category === c.id
                ? 'bg-spidy-red text-white border-spidy-crimson shadow-spidy-glow'
                : 'bg-spidy-surface text-gray-400 border-spidy-border hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="glass-card p-5 rounded-2xl border border-spidy-border hover:border-spidy-red transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-spidy-red/20 text-spidy-crimson border border-spidy-red/30 font-bold uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.timestamp}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white hover:text-spidy-crimson transition-colors">
                {item.title}
              </h3>

              <p className="text-xs text-gray-300 line-clamp-2">
                {item.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-spidy-border/40 text-[11px] text-gray-400">
              <span>Source: <strong className="text-white">{item.source}</strong></span>
              <span className="text-spidy-crimson font-medium flex items-center gap-1">
                {item.read_time} <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
