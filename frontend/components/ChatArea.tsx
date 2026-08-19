'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Mic,
  MicOff,
  User,
  Zap,
  Code,
  ShieldAlert,
  GraduationCap,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FileText,
  Download,
  Loader2,
  Quote,
  X
} from 'lucide-react';
import { generateImageApi, uploadDocApi } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  image_url?: string;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onRegenerate: () => void;
  onEditMessage?: (id: string, newText: string) => void;
  onDeleteMessage?: (id: string) => void;
  selectedModel: string;
}

const MOTIVATIONAL_QUOTES = [
  "Small progress is still progress.",
  "Consistency creates results.",
  "Every expert was once a beginner.",
  "Focus on continuous improvement.",
  "Great achievements take time and dedication."
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  onRegenerate,
  onEditMessage,
  onDeleteMessage,
  selectedModel = 'gemini-3.6-flash',
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image Generation modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImgResult, setGeneratedImgResult] = useState<string | null>(null);

  // Document Upload state
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rotate motivational quotes every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Speech Recognition Handling
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
    }
  };

  // Handle Document Upload
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const res = await uploadDocApi(file);
      onSendMessage(`I have uploaded the document "${file.name}". Please analyze its contents: ${res.summary || res.text || 'Document uploaded successfully.'}`);
    } catch (err: any) {
      alert(`Document upload error: ${err.message || 'Failed to upload document.'}`);
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImgResult(null);

    try {
      const res = await generateImageApi(imagePrompt);
      setGeneratedImgResult(res.image_url);
    } catch (err: any) {
      alert(`Image Generation Notice: ${err.message || 'Failed to generate image.'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const samplePrompts = [
    { title: 'Python Code Optimization', prompt: 'Analyze my Python async codebase and suggest architectural latency improvements.', icon: Code },
    { title: 'Career Development Strategy', prompt: 'Provide a structured 4-week roadmap to master System Design, Data Structures, and SQL.', icon: GraduationCap },
    { title: 'ATS Resume Review', prompt: 'Evaluate my technical resume bullet points against modern enterprise engineering requirements.', icon: Zap },
    { title: 'Financial Risk Assessment', prompt: 'Explain the principles of ETF portfolio diversification and risk mitigation strategies.', icon: ShieldAlert },
  ];

  const renderContent = (content: string, msgId: string) => {
    if (!content) return null;
    
    // Parse code blocks vs standard text cleanly
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].trim() || 'code';
        const codeText = lines.slice(language ? 1 : 0).join('\n') || part.slice(3, -3).trim();
        
        return (
          <div key={index} className="relative my-3 rounded-lg overflow-hidden bg-black/80 border border-spidy-border font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-spidy-surface text-[11px] text-gray-400 border-b border-spidy-border">
              <span className="uppercase">{language}</span>
              <button
                onClick={() => copyToClipboard(codeText, `${msgId}_${index}`)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copiedId === `${msgId}_${index}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === `${msgId}_${index}` ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-red-200">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-spidy-dark relative overflow-hidden bg-spider-grid">
      <div className="web-line" />

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {(!messages || messages.length === 0) ? (
          /* Empty State Hero View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center py-10 space-y-8"
          >
            {/* Branding Logo */}
            <div className="relative inline-block">
              <div className="absolute -inset-3 bg-gradient-to-r from-spidy-red to-spidy-crimson rounded-full blur-lg opacity-60"></div>
              <img
                src="/images.jpg"
                alt="Spidy AI Avatar"
                className="relative w-24 h-24 rounded-full border-4 border-spidy-red object-cover mx-auto shadow-2xl"
              />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Spidy AI Assistant
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
                An enterprise-grade, high-performance intelligence suite designed to streamline software architecture, analysis, document processing, and strategic decision-making.
              </p>
            </div>

            {/* Rotating Motivational Quote */}
            <div className="glass-card p-4 rounded-xl max-w-lg mx-auto border border-spidy-border flex items-center justify-center gap-3">
              <Quote className="w-5 h-5 text-spidy-crimson shrink-0 opacity-80" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                  className="text-xs sm:text-sm text-gray-300 italic font-medium"
                >
                  "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Quick Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              {samplePrompts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSendMessage(item.prompt)}
                    className="glass-card p-4 rounded-xl text-left border border-spidy-border hover:border-spidy-red transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-spidy-red/20 text-spidy-crimson group-hover:bg-spidy-red group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-white group-hover:text-spidy-crimson transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 line-clamp-1">
                          {item.prompt}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Active Message Thread */
          messages.map((msg, index) => {
            const isAssistant = msg.role === 'assistant';
            const isEditingThis = editingId === msg.id;

            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${
                  isAssistant ? 'justify-start' : 'justify-end'
                }`}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <img
                    src="/images.jpg"
                    alt="Spidy AI Avatar"
                    className="w-8 h-8 rounded-full border border-spidy-red object-cover shrink-0 mt-1"
                  />
                )}

                {/* Message Content Bubble */}
                <div
                  className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] ${
                    isAssistant
                      ? 'glass-card border border-spidy-border text-gray-100 rounded-tl-none shadow-md'
                      : 'bg-spidy-red text-white rounded-tr-none shadow-spidy-glow font-medium'
                  }`}
                >
                  {isEditingThis ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-black/50 p-2 rounded text-xs text-white border border-spidy-border focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (onEditMessage && msg.id) {
                              onEditMessage(msg.id, editText);
                              setEditingId(null);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-spidy-red text-white hover:bg-spidy-crimson"
                        >
                          Save & Resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isAssistant ? (
                        <div className="text-xs sm:text-sm space-y-2">
                          {renderContent(msg.content, msg.id || String(index))}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Display attached image if present */}
                      {msg.image_url && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-spidy-border">
                          <img src={msg.image_url} alt="Generated Asset" className="w-full max-h-64 object-cover" />
                        </div>
                      )}
                    </>
                  )}

                  {/* Message Action Toolbar */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-spidy-border/40 text-[11px] text-gray-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id || String(index))}
                        className="hover:text-spidy-crimson transition-colors p-1"
                        title="Copy Message"
                      >
                        {copiedId === (msg.id || String(index)) ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {!isAssistant && onEditMessage && (
                        <button
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditText(msg.content);
                          }}
                          className="hover:text-white transition-colors p-1"
                          title="Edit Message"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onDeleteMessage && (
                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          className="hover:text-red-400 transition-colors p-1"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">
                      {isAssistant ? 'Spidy AI' : 'User'}
                    </span>
                  </div>
                </div>

                {/* User Avatar */}
                {!isAssistant && (
                  <div className="w-8 h-8 rounded-full bg-spidy-surface border border-spidy-border flex items-center justify-center text-white shrink-0 mt-1">
                    <User className="w-4 h-4 text-spidy-crimson" />
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-4xl mx-auto items-center">
            <img
              src="/images.jpg"
              alt="Spidy Processing"
              className="w-8 h-8 rounded-full border border-spidy-red object-cover animate-pulse"
            />
            <div className="glass-card px-4 py-2.5 rounded-2xl rounded-tl-none text-xs text-spidy-crimson flex items-center gap-2 border border-spidy-border">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="font-medium">Spidy AI is processing prompt...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Input for Documents */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDocUpload}
        accept=".pdf,.docx,.txt,.csv,.xlsx"
        className="hidden"
      />

      {/* Image Generation Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-spidy-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-spidy-crimson" />
                  Image Generation Studio
                </h3>
                <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you would like Spidy AI to generate..."
                className="w-full glass-input p-3 rounded-xl text-xs focus:outline-none"
                rows={4}
              />

              {generatedImgResult && (
                <div className="rounded-lg overflow-hidden border border-spidy-border relative">
                  <img src={generatedImgResult} alt="Generated" className="w-full max-h-48 object-cover" />
                  <a
                    href={generatedImgResult}
                    download="spidy_generated_image.png"
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 p-2 bg-spidy-red rounded-lg text-white shadow-lg flex items-center gap-1 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Save Asset
                  </a>
                </div>
              )}

              <button
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim() || isGeneratingImage}
                className="w-full py-2.5 rounded-xl spidy-btn-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGeneratingImage ? 'Generating Image...' : 'Generate Image'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar & Composer Footer */}
      <div className="p-4 border-t border-spidy-border glass-panel">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Spidy AI anything... (e.g. Code optimization, architecture, documents)"
              className="w-full glass-input rounded-2xl pl-4 pr-32 py-3.5 text-sm focus:outline-none placeholder-gray-500"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {/* Document Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="p-2 rounded-xl text-gray-400 hover:text-spidy-crimson hover:bg-spidy-surface transition-all"
                title="Upload Document"
              >
                {isUploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>

              {/* Image Generation Studio Trigger */}
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="p-2 rounded-xl text-gray-400 hover:text-spidy-crimson hover:bg-spidy-surface transition-all"
                title="Generate Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Speech-to-Text Microphone Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-gray-400 hover:text-spidy-crimson hover:bg-spidy-surface'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Microphone Speech Input'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-spidy-red text-white shadow-spidy-glow hover:bg-spidy-crimson'
                    : 'bg-spidy-surface text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
