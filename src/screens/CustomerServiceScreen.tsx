import React from 'react';
import { ArrowLeft, MessageSquare, ExternalLink, ShieldCheck, Headphones, Bot, Zap, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerServiceScreen: React.FC = () => {
  const { supportChannels, setActiveScreen, setIsChatOpen, showToast, stats } = useApp();

  const handleContact = (channelTitle: string, link: string) => {
    showToast(`Connecting to verified ${channelTitle}...`);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
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
            Verified Support Desks
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Avg. Response: &lt; 3 mins</span>
          </span>
        </div>

        {supportChannels.map(channel => (
          <div
            key={channel.id}
            className="fintech-card p-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-2xl flex items-center justify-center border border-slate-200 shrink-0">
                {channel.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{channel.title}</h4>
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
        ))}
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
