'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Wrench,
  FileText,
  Image as ImageIcon,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit3,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  conversations: any[];
  currentChatId: string | null;
  setCurrentChatId: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conversations = [],
  currentChatId,
  setCurrentChatId,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  isOpen,
  setIsOpen,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const navItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'tools', label: 'AI Tools Studio', icon: Wrench },
    { id: 'docs', label: 'Document QA', icon: FileText },
    { id: 'images', label: 'Image Studio', icon: ImageIcon },
    { id: 'news', label: 'Tech Intel Feed', icon: Newspaper },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden fixed top-20 left-3 z-30 p-2 rounded-lg bg-spidy-surface text-spidy-crimson border border-spidy-border shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </AnimatePresence>

      {/* Main Sidebar View */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-spidy-dark/95 border-r border-spidy-border flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation Tabs Header */}
        <div className="p-4 border-b border-spidy-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-spidy-red text-white shadow-spidy-glow'
                      : 'text-gray-400 hover:text-white hover:bg-spidy-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* New Chat Button */}
          {activeTab === 'chat' && (
            <button
              onClick={onNewChat}
              className="w-full py-2.5 px-3 rounded-xl border border-spidy-red/40 bg-spidy-red/10 hover:bg-spidy-red hover:text-white text-spidy-crimson font-semibold text-xs flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          )}
        </div>

        {/* Saved Conversation History Thread */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Recent Missions ({conversations.length})
            </span>
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-gray-500 italic">
              No saved conversations yet.
            </div>
          ) : (
            conversations.map((chat) => {
              const isSelected = currentChatId === chat.id;
              const isRenaming = renamingId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-spidy-surface text-white border border-spidy-border'
                      : 'text-gray-400 hover:text-white hover:bg-spidy-surface/50'
                  }`}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setActiveTab('chat');
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-spidy-crimson' : 'text-gray-500'}`} />
                    
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && onRenameChat) {
                            onRenameChat(chat.id, renameValue);
                            setRenamingId(null);
                          }
                        }}
                        onBlur={() => setRenamingId(null)}
                        autoFocus
                        className="bg-black/60 px-1 py-0.5 rounded text-xs text-white border border-spidy-border outline-none w-full"
                      />
                    ) : (
                      <span className="truncate font-medium">{chat.title || 'Untitled Mission'}</span>
                    )}
                  </div>

                  {/* Actions (Pin, Rename, Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onRenameChat && !isRenaming && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(chat.id);
                          setRenameValue(chat.title || '');
                        }}
                        className="hover:text-white text-gray-500 p-1"
                        title="Rename Conversation"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(chat.id);
                      }}
                      className="hover:text-spidy-crimson text-gray-500 p-1"
                      title={chat.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      {chat.is_pinned ? <PinOff className="w-3 h-3 text-spidy-crimson" /> : <Pin className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="hover:text-red-400 text-gray-500 p-1"
                      title="Delete Mission"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-spidy-border text-[10px] text-gray-500 text-center font-mono">
          Spidy AI Pro • v1.0.0
        </div>
      </aside>
    </>
  );
};
