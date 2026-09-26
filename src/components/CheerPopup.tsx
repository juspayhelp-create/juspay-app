import React, { useEffect, useState, useRef } from 'react';
import { 
  Sparkles, 
  Gift, 
  ArrowDownCircle, 
  Layers, 
  CheckCircle2, 
  X, 
  Zap, 
  PartyPopper,
  Trophy,
  Coins,
  ShieldCheck,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CheerPopupData } from '../types';

interface CheerPopupProps {
  data: CheerPopupData | null;
  onClose: () => void;
}

export const CheerPopup: React.FC<CheerPopupProps> = ({ data, onClose }) => {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const duration = data?.durationMs || 3000;

  useEffect(() => {
    if (!data?.isOpen) return;

    // Palette per type
    const getPalette = () => {
      switch (data.type) {
        case 'deposit':
          return ['#10B981', '#059669', '#34D399', '#F59E0B', '#0D9488', '#6EE7B7'];
        case 'withdrawal':
          return ['#2563EB', '#3B82F6', '#06B6D4', '#10B981', '#38BDF8', '#93C5FD'];
        case 'task_reward':
          return ['#F59E0B', '#FBBF24', '#EF4444', '#10B981', '#8B5CF6', '#FCD34D'];
        case 'selling_card':
          return ['#8B5CF6', '#A855F7', '#EC4899', '#10B981', '#6366F1', '#D946EF'];
        case 'registration':
        default:
          return ['#F59E0B', '#10B981', '#3B82F6', '#FBBF24', '#EC4899'];
      }
    };

    const palette = getPalette();

    // 1. Confetti explosion inside the CheerPopup card canvas
    try {
      if (internalCanvasRef.current) {
        const localConfetti = confetti.create(internalCanvasRef.current, {
          resize: true,
          useWorker: true
        });

        // Initial burst right around the center badge / icon
        localConfetti({
          particleCount: 55,
          spread: 85,
          startVelocity: 36,
          origin: { x: 0.5, y: 0.28 },
          colors: palette,
          disableForReducedMotion: true
        });

        // Secondary angled wave inside card
        setTimeout(() => {
          localConfetti({
            particleCount: 25,
            angle: 55,
            spread: 45,
            startVelocity: 28,
            origin: { x: 0.2, y: 0.3 },
            colors: palette
          });
          localConfetti({
            particleCount: 25,
            angle: 125,
            spread: 45,
            startVelocity: 28,
            origin: { x: 0.8, y: 0.3 },
            colors: palette
          });
        }, 120);

        // Third gentle shower
        setTimeout(() => {
          localConfetti({
            particleCount: 20,
            spread: 90,
            startVelocity: 18,
            origin: { x: 0.5, y: 0.2 },
            colors: palette
          });
        }, 260);
      }
    } catch {}

    // 2. Full-viewport celebration fireworks for maximum delight
    try {
      // Primary burst
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: palette,
        disableForReducedMotion: true
      });

      // Lateral cannons from screen edges
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
          colors: palette
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
          colors: palette
        });
      }, 160);
    } catch {}

    startTimeRef.current = Date.now();
    setProgress(100);

    // High precision progress interval
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);
      if (remainingPct <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 30);

    // Auto dismiss after specified milliseconds
    timerRef.current = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data?.isOpen, data?.type, duration, onClose]);

  if (!data || !data.isOpen) return null;

  // Thematic visual styling per action type
  const getThemeConfig = () => {
    switch (data.type) {
      case 'registration':
        return {
          icon: <Gift className="w-9 h-9 text-amber-500 animate-cheer-bounce" />,
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          badgeText: data.badge || 'Welcome Gift Unlocked',
          headerGradient: 'from-amber-500 via-emerald-500 to-teal-600',
          cardGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.25)]',
          auraColor: 'from-amber-400/20 via-emerald-400/20 to-transparent',
          accentColor: 'text-amber-600',
          btnBg: 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 shadow-amber-500/25',
          progressBg: 'from-amber-400 to-emerald-500'
        };
      case 'deposit':
        return {
          icon: <ArrowDownCircle className="w-9 h-9 text-emerald-500 animate-cheer-bounce" />,
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          badgeText: data.badge || 'Deposit Escrow Active',
          headerGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
          cardGlow: 'shadow-[0_0_50px_rgba(16,185,129,0.3)]',
          auraColor: 'from-emerald-400/20 via-teal-400/20 to-transparent',
          accentColor: 'text-emerald-600',
          btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25',
          progressBg: 'from-emerald-400 to-teal-500'
        };
      case 'withdrawal':
        return {
          icon: <Zap className="w-9 h-9 text-blue-500 animate-cheer-bounce fill-blue-500" />,
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          badgeText: data.badge || 'Payout Dispatched',
          headerGradient: 'from-blue-600 via-indigo-600 to-cyan-500',
          cardGlow: 'shadow-[0_0_50px_rgba(59,130,246,0.25)]',
          auraColor: 'from-blue-400/20 via-indigo-400/20 to-transparent',
          accentColor: 'text-blue-600',
          btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25',
          progressBg: 'from-blue-400 to-indigo-500'
        };
      case 'task_reward':
        return {
          icon: <Trophy className="w-9 h-9 text-amber-500 animate-cheer-bounce fill-amber-400" />,
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          badgeText: data.badge || 'Task Reward Unlocked',
          headerGradient: 'from-amber-500 via-orange-500 to-emerald-600',
          cardGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.3)]',
          auraColor: 'from-amber-400/25 via-orange-400/25 to-transparent',
          accentColor: 'text-amber-600',
          btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
          progressBg: 'from-amber-400 to-orange-500'
        };
      case 'selling_card':
        return {
          icon: <Layers className="w-9 h-9 text-purple-500 animate-cheer-bounce" />,
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
          badgeText: data.badge || 'USDT Selling Cards Claimed',
          headerGradient: 'from-purple-600 via-pink-600 to-indigo-600',
          cardGlow: 'shadow-[0_0_50px_rgba(147,51,234,0.25)]',
          auraColor: 'from-purple-400/20 via-pink-400/20 to-transparent',
          accentColor: 'text-purple-600',
          btnBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25',
          progressBg: 'from-purple-400 to-pink-500'
        };
      default:
        return {
          icon: <PartyPopper className="w-9 h-9 text-emerald-500 animate-cheer-bounce" />,
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          badgeText: data.badge || 'Success',
          headerGradient: 'from-emerald-500 to-teal-600',
          cardGlow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]',
          auraColor: 'from-emerald-400/20 to-transparent',
          accentColor: 'text-emerald-600',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25',
          progressBg: 'from-emerald-400 to-teal-500'
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Click propagation stop on popup card */}
      <div 
        className={`w-full max-w-sm bg-white rounded-3xl overflow-hidden border border-slate-200 relative ${theme.cardGlow} animate-cheer-pop`}
        onClick={e => e.stopPropagation()}
      >
        {/* Dedicated Canvas for Confetti Explosion Inside CheerPopup */}
        <canvas 
          ref={internalCanvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-hidden rounded-3xl"
        />

        {/* Animated Confetti Sparkle & Particle Details inside card */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <span className="absolute top-5 left-6 text-sm animate-ping opacity-75">✨</span>
          <span className="absolute top-12 right-7 text-xs animate-bounce opacity-80">⭐</span>
          <span className="absolute top-24 left-4 text-xs animate-pulse opacity-70">🎉</span>
          <span className="absolute top-28 right-5 text-sm animate-float-slow opacity-75">✨</span>
          <span className="absolute bottom-16 left-5 text-xs animate-bounce opacity-65">⭐</span>
          <span className="absolute bottom-12 right-6 text-xs animate-ping opacity-60">✨</span>
        </div>

        {/* Animated aura swirl behind the icon */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none">
          <div className={`w-full h-full rounded-full bg-gradient-to-tr ${theme.auraColor} blur-2xl animate-cheer-aura`} />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-40 active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Container */}
        <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center relative z-10">
          
          {/* Main Icon Container with 3D Float */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-lg relative z-10">
              {theme.icon}
            </div>
            {/* Sparkle Badges */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action Badge */}
          <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border mb-2 flex items-center gap-1.5 ${theme.badgeBg}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <span>{theme.badgeText}</span>
          </div>

          {/* Cheer Title */}
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            {data.title}
          </h3>

          {/* Highlight Value Box if present */}
          {data.highlightText && (
            <div className="mt-2.5 px-4 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center w-full">
              <span className={`text-base font-black font-mono tracking-tight block ${theme.accentColor}`}>
                {data.highlightText}
              </span>
            </div>
          )}

          {/* Subtitle / Descriptive details */}
          <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed max-w-xs">
            {data.subtitle}
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`w-full mt-4 py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 z-40 ${theme.btnBg}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Awesome! Continue</span>
          </button>
        </div>

        {/* Bottom Shrinking Progress Bar for Milliseconds Indicator */}
        <div className="w-full h-1.5 bg-slate-100 overflow-hidden mt-1 relative z-10">
          <div 
            className={`h-full bg-gradient-to-r ${theme.progressBg} transition-[width] ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
