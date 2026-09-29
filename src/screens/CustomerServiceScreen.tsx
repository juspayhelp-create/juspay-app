import React from 'react';
import { ArrowLeft, MessageSquare, ExternalLink, ShieldCheck, Headphones, Bot, Zap, Clock, MessageCircle, Send, Mail, Phone, Globe, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerServiceScreen: React.FC = () => {
  const { supportChannels, fetchSupportChannels, setActiveScreen, setIsChatOpen, showToast, stats } = useApp();

  const handleContact = (channelTitle: string, link: string) => {
    showToast(`Connecting to verified ${channelTitle}...`);
    window.open(link, '_blank');
  };

  const activeChannels = supportChannels.filter(c => c.is_active !== false);

  const getTypeBadge = (type?: string, link?: string) => {
    const inferred = type || (link?.includes('wa.me') ? 'whatsapp' : link?.includes('t.me') ? 'telegram' : 'other');
    switch (inferred) {
      case 'whatsapp':
        return { label: 'WhatsApp', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: MessageCircle };
      case 'telegram':
        return { label: 'Telegram', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: Send };
      case 'email':
        return { label: 'Email', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Mail };
      case 'phone':
        return { label: 'Phone', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Phone };
      case 'livechat':
        return { label: 'Live Chat', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Headphones };
      default:
        return { label: 'Verified Desk', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Globe };
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('home')}
            className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Customer Service & Priority Desk</span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded border border-emerald-200">
                24/7 SLA
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Official verified channels with guaranteed response SLA</p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchSupportChannels();
            showToast('Refreshed verified support channels.');
          }}
          className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:text-emerald-700 shadow-xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
          title="Refresh Support Channels"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI Bot Quick Assistant Tile */}
      <div 
        onClick={() => setIsChatOpen(true)}
        className="fintech-card-navy p-4 flex items-center justify-between cursor-pointer hover:border-slate-500 transition-all shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white">24/7 Automated Financial AI Concierge</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300">Instant answers regarding deposits, withdrawals & 1:{stats.realtime_exchange_rate || 111} peg rates</p>
          </div>
        </div>

        <span className="fintech-btn-emerald px-3 py-1.5 text-white font-bold text-xs rounded-lg shadow-xs shrink-0">
          Open Chat
        </span>
      </div>

      {/* Verified Support Desks */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verified Support Desks ({activeChannels.length})
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Avg. Response: &lt; 3 mins</span>
          </span>
        </div>

        {activeChannels.length === 0 ? (
          <div className="fintech-card p-6 text-center text-slate-500 space-y-1">
            <Headphones className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Connecting to verified desks...</p>
            <p className="text-[11px]">Please wait or tap refresh above to load official support channels.</p>
          </div>
        ) : (
          activeChannels.map(channel => {
            const badge = getTypeBadge(channel.channel_type, channel.contact_link);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={channel.id}
                className="fintech-card p-4 flex items-center justify-between transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-2xl flex items-center justify-center border border-slate-200 shrink-0 shadow-xs">
                    {channel.avatar || '🎧'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{channel.title}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border flex items-center gap-0.5 ${badge.bg}`}>
                        <BadgeIcon className="w-2 h-2" />
                        <span>{badge.label}</span>
                      </span>
                      <span className="px-1 py-0.2 bg-emerald-50 text-emerald-700 text-[8px] font-bold rounded border border-emerald-200">
                        Official
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{channel.subtitle}</p>
                    <span className="text-[10px] text-slate-700 font-mono font-bold block mt-0.5">
                      {channel.handle}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleContact(channel.title, channel.contact_link)}
                  className="fintech-btn-emerald px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Connect</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Security & Anti-Fraud Notice */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-slate-900 block font-bold mb-0.5">Official Security Protocol:</strong>
          juspay representatives will NEVER request your 6-digit Security PIN, OTP, or private keys. All crypto deposits must strictly be made to the custodial addresses displayed in the official Deposit portal.
        </div>
      </div>

    </div>
  );
};

