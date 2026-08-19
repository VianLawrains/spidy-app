'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, Layers, ShieldAlert, Check } from 'lucide-react';
import { generateImageApi } from '../lib/api';

export const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await generateImageApi(prompt, aspectRatio);
      setImageUrl(res.image_url);
    } catch (e: any) {
      const errStr = e.response?.data?.detail 
        ? (typeof e.response.data.detail === 'string' ? e.response.data.detail : JSON.stringify(e.response.data.detail))
        : e.message || 'Image generation failed.';
      setErrorMessage(`Image Generation Error: ${errStr}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-spidy-dark overflow-y-auto max-w-5xl mx-auto space-y-6">
      {/* Studio Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            Spidy Image Generation Studio
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Generate high-resolution visual assets using Google GenAI / Pillow image synthesis.
          </p>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prompt Input Form */}
        <div className="glass-panel p-5 rounded-2xl border border-spidy-border space-y-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-spidy-crimson" />
            Prompt & Configuration
          </h2>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Describe the image asset you want Spidy AI to generate in detail..."
            className="w-full glass-input p-3 rounded-xl text-xs sm:text-sm focus:outline-none"
          />

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full glass-input p-2.5 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="1:1">1:1 Square (512x512)</option>
              <option value="16:9">16:9 Widescreen (1024x576)</option>
              <option value="4:3">4:3 Standard (800x600)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="w-full py-3 rounded-xl spidy-btn-primary text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Synthesizing Asset...' : 'Generate Image Asset'}</span>
          </button>

          {/* Image Editing Notice */}
          <div className="p-3 rounded-xl bg-spidy-surface/50 border border-spidy-border text-[11px] text-gray-400 flex items-start gap-2">
            <Layers className="w-4 h-4 text-spidy-crimson shrink-0 mt-0.5" />
            <span>
              <strong>Image Editing Notice:</strong> Multi-layer canvas image editing is currently unavailable. Single-prompt asset synthesis is active.
            </span>
          </div>
        </div>

        {/* Generated Image Preview Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-spidy-border flex flex-col justify-between items-center text-center">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2 self-start w-full">
            <Check className="w-4 h-4 text-spidy-crimson" />
            Generated Preview
          </h2>

          {errorMessage && (
            <div className="w-full p-3 my-4 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 text-left flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="w-full flex-1 flex items-center justify-center my-4">
            {imageUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-spidy-border shadow-2xl max-h-80">
                <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />
                <a
                  href={imageUrl}
                  download="spidy_generated_asset.png"
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-spidy-red text-white text-xs rounded-lg shadow-lg flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" /> Save Asset
                </a>
              </div>
            ) : (
              <div className="text-gray-500 text-xs italic py-20">
                Enter a prompt and click Generate to view your synthesized visual asset!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
