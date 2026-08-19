'use client';

import React, { useState } from 'react';
import { X, User, Settings, Shield, Bell, Check } from 'lucide-react';
import { api } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [bio, setBio] = useState('Professional AI User');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', { bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Error updating profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-spidy-border p-6 relative space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Hero Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="/images.jpg"
              alt="User Avatar"
              className="w-16 h-16 rounded-full border-2 border-spidy-red object-cover shadow-spidy-glow"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-spidy-dark rounded-full"></span>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-white">Spidy Pro User</h2>
            <p className="text-xs text-spidy-crimson font-mono">user@spidy.ai</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40 font-bold">
              PRO SUITE ACTIVE
            </span>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Professional Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full glass-input p-3 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-spidy-surface border border-spidy-border space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-200 font-semibold">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-spidy-crimson" />
                JWT Security & Encryption
              </span>
              <span className="text-green-400 text-[10px]">ACTIVE</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Your sessions and memory embeddings are secured with AES-256 and JWT tokens.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl spidy-btn-primary text-xs font-semibold flex items-center gap-1.5"
          >
            {saved ? <Check className="w-4 h-4 text-green-400" /> : null}
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
