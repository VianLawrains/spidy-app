'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { ToolsArea } from '../components/ToolsArea';
import { DocStudio } from '../components/DocStudio';
import { ImageStudio } from '../components/ImageStudio';
import { NewsFeed } from '../components/NewsFeed';
import { ProfileModal } from '../components/ProfileModal';
import { OpeningWebAnimation } from '../components/OpeningWebAnimation';
import StartupScreen from '../components/StartupScreen';
import { CreatedByVian } from '../components/CreatedByVian';
import { SunflowerMusicPlayerRef } from '../components/SunflowerMusicPlayer';
import {
  sendMessageApi,
  fetchConversationsApi,
  createConversationApi,
  deleteConversationApi,
  togglePinConversationApi
} from '../lib/api';

export default function Dashboard() {
  // Always show StartupScreen on load/refresh for testing as requested
  const [showStartupScreen, setShowStartupScreen] = useState(true);
  const [showOpeningAnimation, setShowOpeningAnimation] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [conversations, setConversations] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Single Audio Music Player Ref
  const musicPlayerRef = useRef<SunflowerMusicPlayerRef | null>(null);

  useEffect(() => {
    loadConversations();

    const audioTimer = setTimeout(() => {
      if (musicPlayerRef.current) {
        musicPlayerRef.current.startOpeningAudio();
      }
    }, 150);

    return () => clearTimeout(audioTimer);
  }, []);

  const handleUserInteraction = () => {
    if (musicPlayerRef.current) {
      musicPlayerRef.current.startOpeningAudio();
    }
  };

  const loadConversations = async () => {
    try {
      const data = await fetchConversationsApi();
      setConversations(data);
      if (data.length > 0 && !currentChatId) {
        setCurrentChatId(data[0].id);
        setMessages(data[0].messages || []);
      }
    } catch (e) {
      console.log('Backend conversation fetch');
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createConversationApi('New Spidy Mission');
      setConversations([newChat, ...conversations]);
      setCurrentChatId(newChat.id);
      setMessages([]);
      setActiveTab('chat');
    } catch (e) {
      const tempId = `temp_${Date.now()}`;
      const tempChat = { id: tempId, title: 'New Mission', messages: [] };
      setConversations([tempChat, ...conversations]);
      setCurrentChatId(tempId);
      setMessages([]);
      setActiveTab('chat');
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await deleteConversationApi(id);
    } catch (e) {}
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (currentChatId === id) {
      setCurrentChatId(updated[0]?.id || null);
      setMessages(updated[0]?.messages || []);
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePinConversationApi(id);
    } catch (e) {}
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, is_pinned: !c.is_pinned } : c))
    );
  };

  const handleSendMessage = async (userText: string) => {
    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendMessageApi(userText, currentChatId || undefined, selectedModel);
      if (res.chat_id && res.chat_id !== currentChatId) {
        setCurrentChatId(res.chat_id);
      }
      setMessages((prev) => [...prev, res.assistant_message]);
    } catch (e: any) {
      const errorDetail = e.response?.data?.detail 
        ? (typeof e.response.data.detail === 'string' ? e.response.data.detail : JSON.stringify(e.response.data.detail))
        : e.message || 'Failed to connect to backend server.';
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **API Error Notification**: ${errorDetail}`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (id: string, newText: string) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index !== -1) {
      const trimmed = messages.slice(0, index);
      setMessages(trimmed);
      handleSendMessage(newText);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id));
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-spidy-dark text-white relative">
      {/* Startup Brand Badge: Created by Vian */}
      <CreatedByVian />

      {/* Spidy AI Startup Screen Overlay - Shows on every load/refresh */}
      {showStartupScreen && (
        <StartupScreen onComplete={() => setShowStartupScreen(false)} />
      )}

      {/* Opening Web Animation Overlay */}
      {!showStartupScreen && showOpeningAnimation && (
        <OpeningWebAnimation
          onComplete={() => setShowOpeningAnimation(false)}
          onUserInteraction={handleUserInteraction}
        />
      )}

      {/* Top Navigation */}
      <Navbar
        ref={musicPlayerRef}
        activeTab={activeTab}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onOpenProfile={() => setIsProfileOpen(true)}
        isVoiceActive={isVoiceActive}
        setIsVoiceActive={setIsVoiceActive}
        onUserInteraction={handleUserInteraction}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          conversations={conversations}
          currentChatId={currentChatId}
          setCurrentChatId={(id) => {
            setCurrentChatId(id);
            const found = conversations.find((c) => c.id === id);
            if (found) setMessages(found.messages || []);
          }}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onTogglePin={handleTogglePin}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Tab Content Viewport */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatArea
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              selectedModel={selectedModel}
            />
          )}

          {activeTab === 'tools' && <ToolsArea />}
          {activeTab === 'docs' && <DocStudio />}
          {activeTab === 'images' && <ImageStudio />}
          {activeTab === 'news' && <NewsFeed />}
        </main>
      </div>

      {/* Profile & Settings Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
