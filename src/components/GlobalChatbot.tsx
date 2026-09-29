import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, MessageCircle, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const GlobalChatbot: React.FC = () => {
  const { isChatOpen, setIsChatOpen, stats, supportChannels, showToast, setActiveScreen } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `Hello! I am your 24/7 Juspay Assistant. How can I assist you with your USDT deposits, 3-tier affiliate commissions (${stats.direct_referral_rate || 4}% / ${stats.indirect_referral_rate || 2}% / ${stats.level_3_referral_rate || 1}%), or INR settlements today?`,
      time: 'Just now',
    },
  ]);

  // Auto-scroll chat body on new messages or typing indicator update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  // Quick Action Buttons Data
  const quickActions = [
    { label: '💰 Fixed Rate 1:111', query: 'What is the current USDT to INR exchange rate?' },
    { label: '📥 How to Deposit', query: 'How do I make a USDT deposit?' },
    { label: '📤 Fast Payouts', query: 'What is the minimum withdrawal limit and payout timeline?' },
    { label: '🎁 3-Tier Commissions', query: 'How does the 3-tier affiliate commission system work?' },
    { label: '🛡️ Live Support Desk', query: 'I want to speak with a human support specialist.' },
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // AI Engine rule-based instant routing
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();
      const currentRate = stats.realtime_exchange_rate || 111;

      if (lower.includes('rate') || lower.includes('peg') || lower.includes('price') || lower.includes('111') || lower.includes('exchange')) {
        reply = `Our official guaranteed fixed settlement rate is 1 USDT = ₹${currentRate} INR. All deposits and withdrawals are processed strictly at this verified rate with 0% hidden exchange spreads.`;
      } else if (lower.includes('deposit') || lower.includes('recharge') || lower.includes('crypto') || lower.includes('trc20') || lower.includes('bep20')) {
        reply = `To deposit USDT:\n1. Navigate to Deposit Screen.\n2. Choose USDT-TRC20 (Tron) or USDT-BEP20 (BSC).\n3. Copy the official smart deposit address or scan the QR.\n4. Transfer USDT from Binance, Bybit, OKX, or Trust Wallet.\n5. Input the Transaction Hash (TxID) to finalize automatic credit within 1-3 mins.`;
      } else if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('bank') || lower.includes('upi')) {
        reply = `Withdrawals are processed 24/7 directly to your bound Bank Account or UPI ID.\n• Min Withdrawal: ₹${stats.min_withdraw || 500} INR\n• Max Withdrawal: ₹${stats.max_withdraw || 200000} INR\n• SLA Time: Instant to under 15 minutes.`;
      } else if (lower.includes('commission') || lower.includes('tier') || lower.includes('affiliate') || lower.includes('referral') || lower.includes('invite')) {
        reply = `You earn 3 tiers of perpetual cashback commissions whenever your downlines deposit:\n• Level 1 Direct: ${stats.direct_referral_rate || 4.0}%\n• Level 2 Team: ${stats.indirect_referral_rate || 2.0}%\n• Level 3 Network: ${stats.level_3_referral_rate || 1.0}%\nCommissions are auto-credited instantly to your balance!`;
      } else if (lower.includes('human') || lower.includes('agent') || lower.includes('support') || lower.includes('specialist') || lower.includes('telegram') || lower.includes('whatsapp')) {
        reply = `You can connect with our live human specialists anytime via official Telegram or WhatsApp channels. Visit the Customer Service tab or tap the verified desks listed below.`;
      } else {
        reply = `Thank you for your inquiry! Our systems operate 24/7 with guaranteed ₹${currentRate}/USDT conversions. If you require personalized order escalation, please reach out directly through our verified Customer Service channels.`;
      }

      const botReply: Message = {
        id: `b_${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
    }, 300);
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[540px] max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">Juspay AI Assistant</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-300 font-medium">Automated Support & Rate Guidance</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsChatOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official Channels Quick Bar */}
        {supportChannels && supportChannels.length > 0 && (
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Official:</span>
            {supportChannels.filter(c => c.is_active).map(channel => (
              <a
                key={channel.id}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 bg-white rounded border border-slate-300 text-[10px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-400 flex items-center gap-1 shrink-0 shadow-xs"
              >
                <span>{channel.name}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            ))}
          </div>
        )}

        {/* Chat Messages Body */}
        <div ref={chatBodyRef} className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FAFBFD]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none font-normal'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{m.time}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-2xl w-fit shadow-xs">
              <Bot className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggested Topics */}
        <div className="p-2 bg-slate-50 border-t border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qa.query)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shadow-xs"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or support query..."
            className="flex-1 bg-slate-100 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
