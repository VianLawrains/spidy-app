'use client';

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export interface SunflowerMusicPlayerRef {
  startOpeningAudio: () => void;
}

interface SunflowerMusicPlayerProps {
  onInteraction?: () => void;
}

export const SunflowerMusicPlayer = forwardRef<SunflowerMusicPlayerRef, SunflowerMusicPlayerProps>(
  ({ onInteraction }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [duration, setDuration] = useState<number>(0);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [audioStatusMsg, setAudioStatusMsg] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Expose startOpeningAudio via Ref to trigger playback synchronized with opening animation
    useImperativeHandle(ref, () => ({
      startOpeningAudio: () => {
        attemptAudioPlayback(true);
      },
    }));

    const attemptAudioPlayback = (isOpeningAttempt: boolean = false) => {
      if (!audioRef.current) return;

      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;

      if (isOpeningAttempt) {
        console.log("🔊 [Spidy Music] Opening audio play attempt");
      } else {
        console.log("🔊 [Spidy Music] User interaction play attempt");
      }

      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("✅ [Spidy Music] Autoplay allowed / Playback started");
            setIsPlaying(true);
            setAutoplayBlocked(false);
            setAudioError(null);
            setAudioStatusMsg(`Playing Sunflower (${Math.round(audioRef.current?.duration || 0)}s)`);
            setTimeout(() => setAudioStatusMsg(null), 3000);
          })
          .catch((error) => {
            console.warn("⚠️ [Spidy Music] Autoplay blocked — user interaction required:", error);
            setIsPlaying(false);
            if (error.name === 'NotAllowedError' || error.name === 'AutoplayError') {
              setAutoplayBlocked(true);
            } else {
              console.error("❌ [Spidy Music] Playback error:", error);
              setAudioError(`Play Error: ${error.message || 'Playback failed'}`);
            }
          });
      }
    };

    const handleCanPlay = () => {
      if (audioRef.current) {
        console.log("🔊 [Spidy Music] Audio ready. Duration:", audioRef.current.duration);
        setDuration(audioRef.current.duration || 0);
        setAudioError(null);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || 0);
      }
    };

    const handleError = (e: any) => {
      const err = audioRef.current?.error;
      const errMsg = err ? `Audio Error Code ${err.code}: ${err.message}` : "Could not load /audio/sunflower.mp3";
      console.error("❌ [Spidy Music] Playback error:", errMsg, e);
      setAudioError("Could not load /audio/sunflower.mp3");
      setIsPlaying(false);
    };

    const handlePlay = () => {
      console.log("🔊 [Spidy Music] Playback started");
      setIsPlaying(true);
      setAutoplayBlocked(false);
      setAudioError(null);
    };

    const handlePause = () => {
      console.log("🔊 [Spidy Music] Playback paused");
      setIsPlaying(false);
    };

    const togglePlay = () => {
      if (onInteraction) onInteraction();

      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        attemptAudioPlayback(false);
      }
    };

    const toggleMute = () => {
      const nextMute = !isMuted;
      if (audioRef.current) {
        audioRef.current.muted = nextMute;
      }
      setIsMuted(nextMute);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (audioRef.current) {
        audioRef.current.volume = val;
        if (val > 0 && isMuted) {
          audioRef.current.muted = false;
          setIsMuted(false);
        }
      }
    };

    if (!isMounted) {
      return (
        <div className="flex items-center gap-2 bg-spidy-surface/90 border border-spidy-border px-3 py-1.5 rounded-xl text-xs text-gray-200 glass-panel">
          <div className="font-semibold text-[11px] text-white">Sunflower</div>
        </div>
      );
    }

    return (
      <div className="relative flex items-center gap-2 bg-spidy-surface/90 border border-spidy-border px-3 py-1.5 rounded-xl text-xs text-gray-200 glass-panel">
        {/* Single Audio Element pointing to /audio/sunflower.mp3 */}
        <audio
          ref={audioRef}
          src="/audio/sunflower.mp3"
          preload="auto"
          onCanPlay={handleCanPlay}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          loop
        />

        <div className="flex items-center gap-2 mr-1">
          <div className="p-1.5 rounded-lg bg-spidy-red/20 text-spidy-crimson">
            <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
          <div className="hidden lg:block text-left">
            <div className="font-semibold text-[11px] text-white leading-none">Sunflower</div>
            <div className="text-[9px] text-gray-400 font-medium">Post Malone & Swae Lee</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded-lg text-white transition-all border flex items-center gap-1 font-semibold text-[10px] ${
              autoplayBlocked
                ? 'bg-spidy-red border-spidy-crimson shadow-spidy-glow animate-pulse'
                : 'bg-spidy-surface hover:bg-spidy-red border-spidy-border hover:border-spidy-red'
            }`}
            title={isPlaying ? 'PAUSE' : autoplayBlocked ? 'Enable Music' : 'PLAY'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">
              {isPlaying ? 'PAUSE' : autoplayBlocked ? '🔊 Enable Music' : 'PLAY'}
            </span>
          </button>

          <button
            onClick={toggleMute}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'UNMUTE' : 'MUTE'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-12 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-spidy-red hidden sm:block"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>

        {/* Status / Error Badges */}
        {audioError && (
          <div className="absolute top-10 right-0 bg-red-950 border border-red-700 text-[10px] text-red-300 px-2.5 py-1 rounded-lg shadow-2xl z-50 whitespace-nowrap">
            {audioError}
          </div>
        )}
        {audioStatusMsg && !audioError && (
          <div className="absolute top-10 right-0 bg-spidy-dark border border-spidy-red text-[10px] text-spidy-crimson px-2.5 py-1 rounded-lg shadow-2xl z-50 whitespace-nowrap">
            {audioStatusMsg}
          </div>
        )}
      </div>
    );
  }
);

SunflowerMusicPlayer.displayName = 'SunflowerMusicPlayer';
