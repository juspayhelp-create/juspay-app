import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Megaphone, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Award, 
  X, 
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerHaptic, triggerCancelSound, triggerSwitchSound, triggerSuccessSound, triggerConfirmSound } from '../utils/haptics';

export interface InAppAlertItem {
  id: string;
  title: string;
  message: string;
  type?: 'Deposit' | 'Withdrawal' | 'System' | 'Commission' | 'Reward' | 'Notice' | 'KYC' | string;
  badge?: string;
  priority?: 'normal' | 'urgent' | 'highlight';
}

interface InAppNotificationBannerProps {
  onOpenNotifications: () => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({ onOpenNotifications }) => {
  const { notifications, stats, currentUser } = useApp();
  const [currentAlert, setCurrentAlert] = useState<InAppAlertItem | null>(null);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(() => Date.now());

  // Listen to new notifications or active SLA notice updates
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const latestNotif = notifications[0];
    if (!latestNotif) return;

    // Check if notification was created recently and is for current user
    if (latestNotif.user_id === currentUser.id && !latestNotif.is_read) {
      const notifTime = new Date(latestNotif.created_at).getTime();
      if (!isNaN(notifTime) && notifTime > lastProcessedTimestamp - 10000) {
        triggerHaptic(latestNotif.type === 'Deposit' || latestNotif.type === 'Commission' ? 'success' : 'medium');
        setCurrentAlert({
          id: latestNotif.id,
          title: latestNotif.title,
          message: latestNotif.message,
          type: latestNotif.type,
          badge: latestNotif.badge,
          priority: latestNotif.priority
        });
      }
    }
  }, [notifications, currentUser.id]);

  // Global listener for custom window broadcast event 'juspay_notice_broadcast'
  useEffect(() => {
    const handleBroadcast = (e: any) => {
      const detail = e.detail;
      if (detail && detail.message) {
        triggerHaptic(detail.priority === 'urgent' ? 'warning' : 'medium');
        setCurrentAlert({
          id: `broadcast_${Date.now()}`,
          title: detail.title || detail.badge || 'New Official Notice',
          message: detail.message,
          type: 'Notice',
          badge: detail.badge || 'SLA NOTICE',
          priority: detail.priority || 'highlight'
        });
      }
    };

    window.addEventListener('juspay_notice_broadcast', handleBroadcast);
    return () => window.removeEventListener('juspay_notice_broadcast', handleBroadcast);
  }, []);

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (!currentAlert) return;
    const timer = setTimeout(() => {
      setCurrentAlert(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentAlert]);

  if (!currentAlert) return null;

  const getIcon = (type?: string, priority?: string) => {
    switch (type) {
      case 'Notice':
        return priority === 'urgent' 
          ? <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" /> 
          : <Megaphone className="w-4 h-4 text-emerald-600 animate-pulse" />;
      case 'Deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
      case 'Withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-amber-600" />;
      case 'Commission':
      case 'Reward':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'KYC':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-in slide-in-from-top-6 fade-in duration-300 pointer-events-auto">
      <div 
        onClick={() => {
          triggerSwitchSound();
          triggerHaptic('medium');
          setCurrentAlert(null);
          onOpenNotifications();
        }}
        className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-emerald-500/40 cursor-pointer group hover:border-emerald-400 hover:bg-slate-900 transition-all relative overflow-hidden spring-press"
      >
        {/* Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse" />

        <div className="flex items-start gap-3">
          
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            {getIcon(currentAlert.type, currentAlert.priority)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentAlert.badge && (
                <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider">
                  {currentAlert.badge}
                </span>
              )}
              <h4 className="font-extrabold text-white text-xs truncate">
                {currentAlert.title}
              </h4>
            </div>

            <p className="text-slate-300 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
              {currentAlert.message}
            </p>

            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-emerald-400 font-bold">
              <span className="flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Tap to view in Notification Drawer</span>
              </span>
              <span className="flex items-center gap-0.5 text-emerald-400 group-hover:underline">
                <span>Open Notice</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerCancelSound();
              triggerHaptic('light');
              setCurrentAlert(null);
            }}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors spring-press cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </div>
  );
};
