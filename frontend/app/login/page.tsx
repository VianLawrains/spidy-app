'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { loginApi } from '../../lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // CRITICAL REQUIREMENT: Initial email input MUST be empty string ""
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // Default: Remember me = OFF
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Check for Google OAuth query parameters on redirect
  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');
    const oauthError = searchParams.get('error');

    if (token) {
      localStorage.setItem('spidy_token', token);
      if (refreshToken) {
        localStorage.setItem('spidy_refresh_token', refreshToken);
      }
      router.push('/');
    } else if (oauthError) {
      setError(`Google Login Error: ${oauthError.replace(/\+/g, ' ')}`);
    }
  }, [searchParams, router]);

  const triggerErrorShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await loginApi({
        email: cleanEmail,
        password: password,
      });

      if (res.access_token) {
        localStorage.setItem('spidy_token', res.access_token);
        if (res.refresh_token) {
          localStorage.setItem('spidy_refresh_token', res.refresh_token);
        }
        router.push('/');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      triggerErrorShake(typeof detail === 'string' ? detail : 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://spidy-app.onrender.com';
    window.location.href = `${apiBase}/api/v1/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex items-center justify-center p-4 relative overflow-hidden bg-spider-grid">
      {/* Soft Ambient Red Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-spidy-red/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-8 rounded-3xl border border-spidy-border max-w-md w-full space-y-6 shadow-2xl relative z-10 backdrop-blur-xl bg-black/60"
      >
        {/* Animated 3D Floating Spidy Avatar */}
        <div className="text-center space-y-2">
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="relative inline-block"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-spidy-red via-spidy-crimson to-red-600 rounded-full blur opacity-75 animate-pulse" />
            <img
              src="/images.jpg"
              alt="Spidy AI Avatar"
              className="relative w-16 h-16 rounded-full border-2 border-spidy-red object-cover mx-auto shadow-2xl"
            />
          </motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Welcome back</h1>
          <p className="text-xs text-gray-400">Your AI assistant is waiting.</p>
        </div>

        {/* Error Notification */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              placeholder="Enter your email"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-spidy-red focus:ring-2 focus:ring-spidy-red/40 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-spidy-crimson hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full glass-input pl-3.5 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:border-spidy-red focus:ring-2 focus:ring-spidy-red/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Remember Me (Default: OFF) */}
          <div className="flex items-center text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-700 bg-black text-spidy-red focus:ring-spidy-red"
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Continue Submit Button */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl spidy-btn-primary text-xs font-semibold tracking-wide transition-all mt-2 flex items-center justify-center gap-2 shadow-spidy-glow"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Social Login Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-spidy-border/60 w-full" />
          <span className="bg-[#0b0c10] px-3 text-[10px] uppercase font-mono text-gray-500 shrink-0">OR</span>
          <div className="border-t border-spidy-border/60 w-full" />
        </div>

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-xl bg-spidy-surface border border-spidy-border hover:border-gray-500 text-xs text-gray-200 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Link */}
        <div className="text-center text-xs text-gray-400 pt-2">
          Don't have an account?{' '}
          <Link href="/signup" className="text-spidy-crimson hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080b]" />}>
      <LoginContent />
    </Suspense>
  );
}
