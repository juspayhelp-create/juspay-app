import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCheck, 
  Bell, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldAlert, 
  ShieldCheck,
  Award, 
  Inbox, 
  Megaphone, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Gift
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SLAAnnouncement, AppNotification } from '../types';
import { triggerHaptic, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { 
    notifications, 
    currentUser, 
    markAllNotificationsAsRead, 
    markNotificationAsRead, 
    stats,
    setActiveScreen,
    openKycModal,
    showToast
  } = useApp();
  
  const [filter, setFilter] = useState<'All' | 'Notices' | 'Deposit' | 'Withdrawal' | 'Reward' | 'KYC'>('All');
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('juspay_read_notice_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  // Sync read notices to localStorage
  const markNoticeAsRead = (id: string) => {
    if (!readNoticeIds.includes(id)) {
      const updated = [...readNoticeIds, id];
      setReadNoticeIds(updated);
      try {
        localStorage.setItem('juspay_read_notice_ids', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleMarkAllRead = () => {
    triggerSuccessSound();
    markAllNotificationsAsRead();
    const allNoticeIds = activeNotices.map(n => n.id);
    const combined = Array.from(new Set([...readNoticeIds, ...allNoticeIds]));
    setReadNoticeIds(combined);
    try {
      localStorage.setItem('juspay_read_notice_ids', JSON.stringify(combined));
    } catch {}
    showToast('All notifications and notices marked as read.');
  };

  if (!isOpen) return null;

  const activeNotices: SLAAnnouncement[] = (stats.global_announcements || []).filter(a => a.is_active);
  const userNotifs = notifications.filter(n => n.user_id === currentUser.id);

  // Convert active notices to unified list item format for 'All' tab
  const noticeListItems = activeNotices.map(notice => ({
    id: `notice_${notice.id}`,
    rawNoticeId: notice.id,
    isNotice: true,
    title: notice.badge || 'SLA NOTICE',
    message: notice.message,
    type: 'Notice',
    is_read: readNoticeIds.includes(notice.id),
    created_at: notice.created_at || 'Active Official Notice',
    priority: notice.priority || 'highlight',
    badge: notice.badge || 'OFFICIAL SLA'
  }));

  const notifListItems = userNotifs.map(n => ({
    id: n.id,
    rawNoticeId: '',
    isNotice: false,
    title: n.title,
    message: n.message,
    type: n.type,
    is_read: n.is_read,
    created_at: n.created_at,
    priority: n.priority || 'normal',
    badge: n.badge
  }));

  // Filter logic
  let displayItems: any[] = [];
  if (filter === 'All') {
    displayItems = [...noticeListItems, ...notifListItems];
  } else if (filter === 'Notices') {
    displayItems = noticeListItems;
  } else if (filter === 'Deposit') {
    displayItems = notifListItems.filter(n => n.type === 'Deposit');
  } else if (filter === 'Withdrawal') {
    displayItems = notifListItems.filter(n => n.type === 'Withdrawal');
  } else if (filter === 'Reward') {
    displayItems = notifListItems.filter(n => n.type === 'Commission' || n.type === 'Reward');
  } else if (filter === 'KYC') {
    displayItems = notifListItems.filter(n => n.type === 'KYC' || n.type === 'System' || n.title.includes('KYC') || n.message.includes('KYC'));
  }

  const unreadCount = displayItems.filter(i => !i.is_read).length;

  const getIcon = (type: string, priority?: string) => {
    switch (type) {
      case 'Notice':
        return priority === 'urgent' 
          ? <AlertTriangle className="w-4 h-4 text-rose-600" /> 
          : <Megaphone className="w-4 h-4 text-emerald-600" />;
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
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleItemClick = (item: any) => {
    triggerHaptic('light');
    if (item.isNotice) {
      markNoticeAsRead(item.rawNoticeId);
      setExpandedNoticeId(prev => prev === item.id ? null : item.id);
    } else {
      markNotificationAsRead(item.id);
      if (item.type === 'Deposit') {
        onClose();
        setActiveScreen('deposit');
      } else if (item.type === 'Withdrawal') {
        onClose();
        setActiveScreen('withdraw');
      } else if (item.type === 'KYC' || item.title.includes('KYC')) {
        onClose();
        openKycModal();
      }
    }
  };

  const handleTabChange = (newTab: any) => {
    triggerSwitchSound();
    setFilter(newTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-white text-sm">Notices & Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Real-time system updates & vault transaction logs</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerCancelSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer spring-press"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Live SLA Notice Sticky Ticker */}
        {stats.sla_banner_enabled !== false && stats.global_announcement && (
          <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-emerald-200 text-[11px] font-medium flex items-center gap-2 border-b border-emerald-800/40 shrink-0">
            <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider shrink-0">
              {stats.sla_badge_text || 'LIVE SLA'}
            </span>
            <span className="truncate flex-1 font-semibold text-slate-100">{stats.global_announcement}</span>
          </div>
        )}

        {/* Action Row & Filter Tabs */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'All', label: 'All', count: noticeListItems.length + notifListItems.length },
              { id: 'Notices', label: '📢 Notices', count: activeNotices.length },
              { id: 'Deposit', label: '📥 Deposits', count: notifListItems.filter(n => n.type === 'Deposit').length },
              { id: 'Withdrawal', label: '📤 Payouts', count: notifListItems.filter(n => n.type === 'Withdrawal').length },
              { id: 'Reward', label: '🎁 Rewards', count: notifListItems.filter(n => n.type === 'Commission' || n.type === 'Reward').length },
              { id: 'KYC', label: '🛡️ KYC', count: notifListItems.filter(n => n.type === 'KYC' || n.title.includes('KYC')).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 spring-press ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                    filter === tab.id ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 ml-auto whitespace-nowrap spring-press"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark read</span>
          </button>
        </div>

        {/* Notices & Notifications Feed List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/70">
          {displayItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3 stroke-[1.5]" />
              <p className="text-xs font-black text-slate-700">No notifications in this filter</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All alerts and official notices will appear here in real-time.</p>
            </div>
          ) : (
            displayItems.map(item => {
              const isNotice = item.isNotice;
              const isUrgent = item.priority === 'urgent';
              const isHighlight = item.priority === 'highlight';
              const isExpanded = expandedNoticeId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isNotice
                      ? isUrgent
                        ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                        : isHighlight
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200 shadow-xs'
                      : item.is_read
                        ? 'bg-white border-slate-200 opacity-90'
                        : 'bg-white border-emerald-300 shadow-xs'
                  }`}
                >
                  {/* Left Priority Accent Bar for Notices */}
                  {isNotice && (
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      isUrgent ? 'bg-rose-500' : isHighlight ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                  )}

                  <div className="flex items-start gap-3">
                    
                    {/* Icon Box */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isNotice
                        ? isUrgent
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : isHighlight
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {getIcon(item.type, item.priority)}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isNotice && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-black rounded uppercase tracking-wider ${
                              isUrgent 
                                ? 'bg-rose-600 text-white' 
                                : isHighlight 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-800 text-slate-100'
                            }`}>
                              {item.badge || 'SLA NOTICE'}
                            </span>
                          )}

                          <h4 className="font-extrabold text-slate-900 text-xs truncate">
                            {item.title}
                          </h4>
                        </div>

                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                        )}
                      </div>

                      <p className={`text-slate-700 text-xs mt-1 leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}>
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <span>{item.created_at}</span>
                        {isNotice ? (
                          <span className="text-emerald-700 font-bold font-sans flex items-center gap-0.5 group-hover:underline">
                            <span>{isExpanded ? 'Show less' : 'View full notice'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans font-medium">Tap to view</span>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>24/7 Real-Time Vault Broadcast Desk</span>
          </span>
          <button
            onClick={() => {
              triggerCancelSound();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
