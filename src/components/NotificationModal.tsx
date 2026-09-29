import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCheck, 
  Bell, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck,
  Award, 
  Inbox, 
  Megaphone, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight,
  Search,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Info,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SLAAnnouncement } from '../types';
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
  
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Notices' | 'Deposit' | 'Withdrawal'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('juspay_read_notice_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  // Auto-mark notifications and notices as read upon opening
  useEffect(() => {
    if (isOpen) {
      markAllNotificationsAsRead(true);
      const activeNotices = (stats.global_announcements || []).filter(a => a.is_active);
      const allNoticeIds = activeNotices.map(n => n.id);
      const combined = Array.from(new Set([...readNoticeIds, ...allNoticeIds]));
      setReadNoticeIds(combined);
      try {
        localStorage.setItem('juspay_read_notice_ids', JSON.stringify(combined));
      } catch {}
    }
  }, [isOpen]);

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
    const activeNotices = (stats.global_announcements || []).filter(a => a.is_active);
    const allNoticeIds = activeNotices.map(n => n.id);
    const combined = Array.from(new Set([...readNoticeIds, ...allNoticeIds]));
    setReadNoticeIds(combined);
    try {
      localStorage.setItem('juspay_read_notice_ids', JSON.stringify(combined));
    } catch {}
    showToast('All notifications and notices marked as read.');
  };

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    triggerSuccessSound();
    showToast('Notice content copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const activeNotices: SLAAnnouncement[] = (stats.global_announcements || []).filter(
    a => a.is_active && !/test\s*notice/i.test(a.message || '') && !/test\s*notice/i.test(a.badge || '')
  );
  const userNotifs = notifications.filter(
    n => n.user_id === currentUser.id && !/test\s*notice/i.test(n.title || '') && !/test\s*notice/i.test(n.message || '')
  );

  // Convert active notices to unified list item format
  const noticeListItems = activeNotices.map(notice => ({
    id: `notice_${notice.id}`,
    rawNoticeId: notice.id,
    isNotice: true,
    title: notice.badge || 'SLA NOTICE',
    message: notice.message,
    type: 'Notice',
    is_read: readNoticeIds.includes(notice.id),
    created_at: notice.created_at || 'Active Official Broadcast',
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

  // Combined & Filtered items
  const allItems = [...noticeListItems, ...notifListItems];

  const filteredItems = allItems.filter(item => {
    // Tab filter
    if (filter === 'Unread' && item.is_read) return false;
    if (filter === 'Notices' && !item.isNotice) return false;
    if (filter === 'Deposit' && item.type !== 'Deposit') return false;
    if (filter === 'Withdrawal' && item.type !== 'Withdrawal') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchMessage = item.message?.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      const matchType = item.type?.toLowerCase().includes(q);
      return matchTitle || matchMessage || matchBadge || matchType;
    }

    return true;
  });

  const unreadCount = allItems.filter(i => !i.is_read).length;

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
      } else if (item.type === 'Commission' || item.type === 'Reward') {
        onClose();
        setActiveScreen('team');
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
    <div 
      className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full min-h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200 box-border"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-white text-sm tracking-tight">Notices & Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse shadow-xs">
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
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer spring-press border border-slate-700/60 shadow-xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Live SLA Notice Sticky Ticker */}
        {stats.sla_banner_enabled !== false && (
          <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-emerald-200 text-[11px] font-medium flex items-center gap-2 border-b border-emerald-800/40 shrink-0 shadow-xs">
            <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-extrabold text-[9px] rounded uppercase tracking-wider shrink-0 shadow-2xs">
              {stats.sla_badge_text || activeNotices[0]?.badge || 'SLA NOTICE'}
            </span>
            <span className="truncate flex-1 font-semibold text-slate-100">
              {(() => {
                const headline = activeNotices.length > 0 ? activeNotices[0].message : stats.global_announcement;
                if (!headline || /test\s*notice/i.test(headline)) {
                  return 'Official System Announcement & 1:111 Settlement Updates';
                }
                return headline;
              })()}
            </span>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-3 pt-2.5 pb-1.5 bg-slate-50 border-b border-slate-200">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notifications, tx notes or notices..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Row & Filter Tabs */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'All', label: 'All', count: allItems.length },
              { id: 'Unread', label: '🔴 Unread', count: unreadCount },
              { id: 'Notices', label: '📢 Notices', count: activeNotices.length },
              { id: 'Deposit', label: '📥 Deposits', count: notifListItems.filter(n => n.type === 'Deposit').length },
              { id: 'Withdrawal', label: '📤 Payouts', count: notifListItems.filter(n => n.type === 'Withdrawal').length }
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
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-extrabold ${
                    filter === tab.id ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 ml-auto whitespace-nowrap spring-press bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark read</span>
          </button>
        </div>

        {/* Notices & Notifications Feed List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#FAFBFD]">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3 stroke-[1.5]" />
              <p className="text-xs font-extrabold text-slate-700">No notifications found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {searchQuery ? `No results matching "${searchQuery}"` : 'All alerts and official broadcasts will appear here in real-time.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredItems.map(item => {
              const isNotice = item.isNotice;
              const isUrgent = item.priority === 'urgent';
              const isHighlight = item.priority === 'highlight';
              const isExpanded = expandedNoticeId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover-lift ${
                    isNotice
                      ? isUrgent
                        ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                        : isHighlight
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200 shadow-xs'
                      : item.is_read
                        ? 'bg-white border-slate-200/90 shadow-2xs'
                        : 'bg-gradient-to-r from-emerald-50/40 to-white border-emerald-300 shadow-xs'
                  }`}
                >
                  {/* Left Priority Accent Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    isNotice
                      ? isUrgent ? 'bg-rose-500' : isHighlight ? 'bg-emerald-500' : 'bg-blue-500'
                      : item.type === 'Deposit'
                        ? 'bg-emerald-500'
                        : item.type === 'Withdrawal'
                          ? 'bg-amber-500'
                          : item.type === 'Reward' || item.type === 'Commission'
                            ? 'bg-purple-500'
                            : 'bg-blue-500'
                  }`} />

                  <div className="flex items-start gap-3 pl-1">
                    
                    {/* Icon Box */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                      isNotice
                        ? isUrgent
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : isHighlight
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        : item.type === 'Deposit'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : item.type === 'Withdrawal'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : item.type === 'Reward' || item.type === 'Commission'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {getIcon(item.type, item.priority)}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isNotice && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-black rounded uppercase tracking-wider shadow-2xs ${
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

                      {/* Quick Action Footer inside Card */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[140px]">{item.created_at}</span>
                        
                        <div className="flex items-center gap-2">
                          {isNotice ? (
                            <>
                              <button
                                onClick={(e) => copyToClipboard(item.message, item.id, e)}
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 p-1 rounded hover:bg-slate-100 transition-colors"
                                title="Copy notice text"
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <span className="text-emerald-700 font-bold font-sans flex items-center gap-0.5 group-hover:underline">
                                <span>{isExpanded ? 'Show less' : 'View full'}</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </>
                          ) : (
                            <span className="text-emerald-700 font-bold font-sans flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-3 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Juspay Broadcast Stream</span>
          </span>
          <button
            onClick={() => {
              triggerCancelSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-xs spring-press"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
