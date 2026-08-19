'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { verifyOtpApi, resendOtpApi } from '../../lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const phoneParam = searchParams.get('phone') || '';
  const channelParam = searchParams.get('channel') || 'email';
  const targetRecipient = channelParam === 'email' ? emailParam : phoneParam;

  // Initial OTP state: 6 empty strings
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerErrorShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6 || loading) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await verifyOtpApi(emailParam || targetRecipient, fullOtp);
      if (res.access_token) {
        localStorage.setItem('spidy_token', res.access_token);
        if (res.refresh_token) {
          localStorage.setItem('spidy_refresh_token', res.refresh_token);
        }
        setSuccessMsg('Account verified successfully! Redirecting...');
        setTimeout(() => router.push('/'), 1200);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      triggerErrorShake(typeof detail === 'string' ? detail : 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setSuccessMsg(null);

    try {
      await resendOtpApi(emailParam || targetRecipient);
      setCooldown(60);
      setSuccessMsg('A new verification code has been sent.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      triggerErrorShake(typeof detail === 'string' ? detail : 'Failed to resend verification code.');
    }
  };

  const formatObfuscatedRecipient = (str: string) => {
    if (!str) return 'your registered account';
    if (str.includes('@')) {
      const [user, domain] = str.split('@');
      if (user.length <= 2) return `${user}***@${domain}`;
      return `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
    }
    if (str.length >= 6) {
      return `${str.slice(0, 3)}****${str.slice(-3)}`;
    }
    return str;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        x: shake ? [-8, 8, -6, 6, -3, 3, 0] : 0,
      }}
      transition={{ duration: 0.4 }}
      className="glass-panel p-8 rounded-3xl border border-spidy-border max-w-md w-full space-y-6 shadow-2xl relative z-10"
    >
      <div className="text-center space-y-2">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="p-3 rounded-2xl bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40 inline-block shadow-spidy-glow"
        >
          <ShieldCheck className="w-8 h-8" />
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Verify your email
        </h1>
        <p className="text-xs text-gray-400">
          Enter the 6-digit code sent to <br />
          <span className="text-white font-mono">{formatObfuscatedRecipient(targetRecipient)}</span>
        </p>
      </div>

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

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-green-950/80 border border-green-800 text-xs text-green-300 flex items-center gap-2 overflow-hidden"
          >
            <Check className="w-4 h-4 text-green-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 text-center font-mono text-xl font-bold bg-black/60 border border-spidy-border rounded-xl text-white focus:border-spidy-red focus:outline-none focus:ring-2 focus:ring-spidy-red/40 transition-all"
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={otp.join('').length !== 6 || loading}
          className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            otp.join('').length === 6 && !loading
              ? 'spidy-btn-primary text-white'
              : 'bg-spidy-surface text-gray-600 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying code...</span>
            </span>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <div className="text-center space-y-2 pt-2 border-t border-spidy-border/50">
        <p className="text-xs text-gray-400">Didn't receive the code?</p>
        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className={`flex items-center justify-center gap-1.5 text-xs mx-auto font-semibold transition-colors ${
            cooldown > 0
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-spidy-crimson hover:underline'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cooldown > 0 ? '' : 'animate-spin'}`} />
          <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Verification Code'}</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-white flex items-center justify-center p-4 relative overflow-hidden bg-spider-grid">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spidy-red/15 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={
        <div className="glass-panel p-8 rounded-3xl border border-spidy-border max-w-md w-full text-center text-white text-xs">
          Loading verification interface...
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
