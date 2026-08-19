'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldAlert, Check, KeyRound, Eye, EyeOff } from 'lucide-react';
import { forgotPasswordApi, resetPasswordApi } from '../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await forgotPasswordApi(email.trim().toLowerCase());
      setSuccessMsg(res.message || 'If an account exists, a 6-digit reset code has been sent.');
      setStep(2);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword || !confirmPassword || loading) return;
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordApi(email.trim().toLowerCase(), otpCode.trim(), newPassword, confirmPassword);
      setSuccessMsg(res.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-spidy-dark flex items-center justify-center p-4 relative overflow-hidden bg-spider-grid">
      <div className="web-line" />

      <div className="glass-panel p-8 rounded-3xl border border-spidy-border max-w-md w-full space-y-6 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="p-3 rounded-2xl bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40 inline-block">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Reset Password</h1>
          <p className="text-xs text-gray-400">
            {step === 1
              ? 'Enter your email address to receive a 6-digit verification code.'
              : 'Enter your 6-digit code and create a new password.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-green-950/80 border border-green-800 text-xs text-green-300 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="developer@spidy.ai"
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl spidy-btn-primary text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required
                placeholder="123456"
                className="w-full glass-input text-center font-mono text-lg py-2 rounded-xl text-white tracking-widest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full glass-input pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl spidy-btn-primary text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Resetting Password...' : 'Confirm Reset Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-spidy-border/50">
          Remembered your password?{' '}
          <Link href="/login" className="text-spidy-crimson hover:underline font-semibold">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
