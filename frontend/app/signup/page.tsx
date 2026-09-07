'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { registerApi } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  
  // CRITICAL REQUIREMENT: Initial form inputs MUST be empty string ""
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Live password strength criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const triggerErrorShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      triggerErrorShake('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      triggerErrorShake('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      triggerErrorShake('Password does not meet the security requirements below.');
      return;
    }

    if (password !== confirmPassword) {
      triggerErrorShake('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerApi({
        email: cleanEmail,
        password: password,
        full_name: cleanName,
      });

      if (res.status === 'success' || res.detail) {
        // Store email for OTP verification step
        localStorage.setItem('spidy_pending_verify_email', cleanEmail);
        router.push('/verify-email');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      triggerErrorShake(typeof detail === 'string' ? detail : 'Failed to create account. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex items-center justify-center p-4 relative overflow-hidden bg-spider-grid py-12">
      {/* Soft Ambient Red Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-spidy-red/15 rounded-full blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-8 rounded-3xl border border-spidy-border max-w-md w-full space-y-6 shadow-2xl relative z-10 backdrop-blur-xl bg-black/60 my-auto"
      >
        {/* Header Branding */}
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create your account</h1>
          <p className="text-xs text-gray-400">Join Spidy AI Assistant.</p>
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

        <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="off"
              placeholder="Enter your full name"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-spidy-red focus:ring-2 focus:ring-spidy-red/40 transition-all"
            />
          </div>

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
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                autoComplete="new-password"
                placeholder="Create a strong password"
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

          {/* Live Password Criteria Breakdown */}
          {(isPasswordFocused || password.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-xl bg-black/40 border border-spidy-border space-y-1.5 overflow-hidden"
            >
              {isPasswordValid ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Strong password criteria met!</span>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-gray-300">Password requirements</p>
                  <div className="space-y-1 text-[11px]">
                    <div className={hasMinLength ? 'text-green-400 flex items-center gap-1.5' : 'text-gray-500 flex items-center gap-1.5'}>
                      <span>{hasMinLength ? '✓' : '•'}</span> 8+ characters
                    </div>
                    <div className={hasUpper ? 'text-green-400 flex items-center gap-1.5' : 'text-gray-500 flex items-center gap-1.5'}>
                      <span>{hasUpper ? '✓' : '•'}</span> Uppercase letter
                    </div>
                    <div className={hasLower ? 'text-green-400 flex items-center gap-1.5' : 'text-gray-500 flex items-center gap-1.5'}>
                      <span>{hasLower ? '✓' : '•'}</span> Lowercase letter
                    </div>
                    <div className={hasNumber ? 'text-green-400 flex items-center gap-1.5' : 'text-gray-500 flex items-center gap-1.5'}>
                      <span>{hasNumber ? '✓' : '•'}</span> Number
                    </div>
                    <div className={hasSpecial ? 'text-green-400 flex items-center gap-1.5' : 'text-gray-500 flex items-center gap-1.5'}>
                      <span>{hasSpecial ? '✓' : '•'}</span> Special character
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="w-full glass-input pl-3.5 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:border-spidy-red focus:ring-2 focus:ring-spidy-red/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
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
                <span>Creating account...</span>
              </span>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-spidy-border/60 w-full" />
          <span className="bg-[#0b0c10] px-3 text-[10px] uppercase font-mono text-gray-500 shrink-0">OR</span>
          <div className="border-t border-spidy-border/60 w-full" />
        </div>

        {/* Continue with Google */}
        <button
          type="button"
          className="w-full py-2.5 rounded-xl bg-spidy-surface border border-spidy-border hover:border-gray-500 text-xs text-gray-200 font-semibold flex items-center justify-center gap-2 transition-all"
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
          Already have an account?{' '}
          <Link href="/login" className="text-spidy-crimson hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
