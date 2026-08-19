'use client';

import React, { useState } from 'react';
import {
  Wrench,
  FileCheck,
  GraduationCap,
  Code,
  Database,
  BookOpen,
  DollarSign,
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { processToolApi } from '../lib/api';

export const ToolsArea: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('ats');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tools = [
    { id: 'ats', name: 'ATS Resume Reviewer', icon: FileCheck, desc: 'Score your resume against ATS tracking algorithms' },
    { id: 'interview', name: 'Interview Simulator', icon: GraduationCap, desc: 'Interview preparation and model STAR answers' },
    { id: 'python_debug', name: 'Python Debugger', icon: Code, desc: 'Analyze, refactor, and fix python async code & memory leaks' },
    { id: 'sql_gen', name: 'SQL Query Generator', icon: Database, desc: 'Generate PostgreSQL & MySQL queries with indexing' },
    { id: 'study_planner', name: 'Study Planner', icon: BookOpen, desc: 'Create 4-week structured learning roadmaps' },
    { id: 'investment', name: 'Investment Edu Assistant', icon: DollarSign, desc: 'Educational asset class, ETF, and risk diversification analysis' },
  ];

  const handleRunTool = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    try {
      const res = await processToolApi(selectedTool, inputText);
      setResult(res.result);
    } catch (e: any) {
      setResult(`🕷️ Processing notice: ${e.message || 'Please verify backend status.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-spidy-dark overflow-y-auto max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            Spidy AI Special Tools
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Enterprise productivity assistants powered by specialized superhero AI models.
          </p>
        </div>
      </div>

      {/* Tool Cards Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {tools.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTool(t.id);
                setResult('');
              }}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-spidy-red/20 border-spidy-red text-white shadow-spidy-glow'
                  : 'glass-card text-gray-400 border-spidy-border hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-spidy-crimson' : 'text-gray-400'}`} />
              <span className="font-semibold text-xs leading-tight">{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Form & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-spidy-border space-y-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-spidy-crimson" />
            Input Workspace ({tools.find(t => t.id === selectedTool)?.name})
          </h2>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            placeholder={`Enter details for ${tools.find(t => t.id === selectedTool)?.name}...`}
            className="w-full glass-input p-3 rounded-xl text-xs sm:text-sm focus:outline-none placeholder-gray-500 font-mono"
          />

          <button
            onClick={handleRunTool}
            disabled={!inputText.trim() || loading}
            className="w-full py-3 px-4 rounded-xl spidy-btn-primary text-sm font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing with Spidy Intelligence...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Run {tools.find(t => t.id === selectedTool)?.name}</span>
              </>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-spidy-border space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-spidy-crimson" />
              Spidy AI Output Analysis
            </h2>
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 glass-card p-4 rounded-xl text-xs sm:text-sm overflow-y-auto max-h-[350px]">
            {result ? (
              <div className="whitespace-pre-wrap leading-relaxed font-sans">
                {result}
              </div>
            ) : (
              <div className="text-gray-500 italic text-center py-16">
                Enter your text and click run to view Spidy's output analysis!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
