import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, MessageCircle, ExternalLink, HelpCircle, ShieldCheck, Move } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface Position {
  x: number;
  y: number;
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
      text: `Hello! I am your 24/7 juspay AI Assistant. How can I assist you with your USDT deposits, 3-tier affiliate commissions (${stats.direct_referral_rate || 4}% / ${stats.indirect_referral_rate || 2}% / ${stats.level_3_referral_rate || 1}%), or INR withdrawals today?`,
      time: 'Just now',
    },
  ]);

  // Movable Floating Button Position & Drag State (Button size: 44px)
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  } | null>(null);

  const BTN_SIZE = 44;

  // Auto-scroll chat body on new messages or typing indicator update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  // Initialize Position & Restore Saved Position
  useEffect(() => {
    const calculateDefault = (): Position => {
      const margin = 16;
      const x = Math.max(margin, window.innerWidth - BTN_SIZE - margin);
      const y = Math.max(margin, window.innerHeight - BTN_SIZE - 90);
      return { x, y };
    };

    try {
      const saved = localStorage.getItem('juspay_support_btn_pos');
      if (saved) {
        const parsed = JSON.parse(saved) as Position;
        const margin = 8;
        const clampedX = Math.min(Math.max(margin, parsed.x), window.innerWidth - BTN_SIZE - margin);
        const clampedY = Math.min(Math.max(margin, parsed.y), window.innerHeight - BTN_SIZE - margin);
        setPosition({ x: clampedX, y: clampedY });
        return;
      }
    } catch {
      // fallback
    }

    setPosition(calculateDefault());
  }, []);

  // Handle Screen Resize & Orientation Change
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const margin = 8;
        const maxX = Math.max(margin, window.innerWidth - BTN_SIZE - margin);
        const maxY = Math.max(margin, window.innerHeight - BTN_SIZE - margin);
        return {
          x: Math.min(Math.max(margin, prev.x), maxX),
          y: Math.min(Math.max(margin, prev.y), maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag Gesture Handlers using Pointer Events (Mouse, Trackpad & Mobile Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // Only primary mouse click / touch
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const currentX = position?.x ?? (window.innerWidth - 60);
    const currentY = position?.y ?? (window.innerHeight - 140);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 3) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (dragRef.current.hasMoved) {
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - BTN_SIZE - margin);
      const maxY = Math.max(margin, window.innerHeight - BTN_SIZE - margin);

      const nextX = Math.min(Math.max(margin, dragRef.current.initX + deltaX), maxX);
      const nextY = Math.min(Math.max(margin, dragRef.current.initY + deltaY), maxY);

      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragRef.current.hasMoved) {
      if (position) {
        try {
          localStorage.setItem('juspay_support_btn_pos', JSON.stringify(position));
        } catch {
          // ignore
        }
      }
    } else {
      setIsChatOpen(!isChatOpen);
    }

    setIsDragging(false);
    dragRef.current = null;
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const quickQuestions = [
    'How do I deposit USDT?',
    'How does 3-tier referral work?',
    'What is the USDT exchange rate?',
    'How do I bind payment tools?',
    'Where do I withdraw INR?',
    'How do Cashback Orders work?',
  ];

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('deposit') && (q.includes('how') || q.includes('usdt') || q.includes('process'))) {
        reply = "To deposit USDT: Navigate to the Home tab and tap 'Deposit USDT'. Copy the platform TRC20/BEP20 address or scan the QR code. Transfer your funds from your external wallet, enter the transaction UTR/TxHash, upload the payment screenshot, and submit. Once verified by admin, your balance will be credited directly to your Total Available Vault.";
      } else if (q.includes('referral') || q.includes('tier') || q.includes('upline') || q.includes('affiliate') || q.includes('commission')) {
        reply = `Our multi-tier referral program rewards you across three upline tiers:\n- Level 1 (Direct Referrals): Earn ${(stats.direct_referral_rate || 4.0).toFixed(1)}% of every settled deposit.\n- Level 2 (Indirect Referrals): Earn ${(stats.indirect_referral_rate || 2.0).toFixed(1)}% of deposits made by your team's invites.\n- Level 3 (Third Tier): Earn ${(stats.level_3_referral_rate || 1.0).toFixed(1)}% of deposits made by Tier 3 invites.\nAll commissions credit automatically to your vault balance and affiliate ledger upon deposit approval.`;
      } else if (q.includes('rate') || (q.includes('usdt') && q.includes('exchange')) || q.includes('peg')) {
        reply = `The platform is pegged at 1 USDT = ₹${stats.realtime_exchange_rate || 109} INR (or current dynamic rate configured in platform settings). All conversions between USDT deposits, selling cards, and INR payouts follow this rate.`;
      } else if (q.includes('bind') || q.includes('method') || q.includes('tool')) {
        reply = "Go to Profile > Payment Methods. Add your preferred UPI ID (e.g., yourname@oksbi) or Bank Account details (Account Number, IFSC, Beneficiary Name) to enable 1-click INR withdrawals.";
      } else if (q.includes('withdraw') || q.includes('payout') || q.includes('where do i withdraw')) {
        reply = "Go to Home or Profile and tap 'Withdraw Funds' / 'Withdraw INR'. Enter the amount (minimum withdrawal limits apply), select your bound UPI or bank details, and submit. Payouts are settled directly via IMPS/UPI upon review.";
      } else if (q.includes('cashback') || q.includes('order')) {
        reply = "Visit the Cashback tab to claim up to 4.0% cashback on qualifying deposit brackets (ranging up to ₹50,000 INR). Each unlocked order can be claimed once to credit income directly to your balance.";
      } else if (q.includes('deposit')) {
        reply = "To deposit USDT: Navigate to the Home tab and tap 'Deposit USDT'. Copy the platform TRC20/BEP20 address or scan the QR code. Transfer your funds from your external wallet, enter the transaction UTR/TxHash, upload the payment screenshot, and submit. Once verified by admin, your balance will be credited directly to your Total Available Vault.";
      } else {
        reply = "I am here to assist! For immediate 1-on-1 human assistance, tap 'View Desks' above to connect with verified Telegram, WhatsApp, and Phone desks, or visit the Customer Service page.";
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

  return (
    <>
      {/* 24/7 Universal Help Support Service Button - Small, Sleek & Movable */}
      <div
        className="fixed z-40 touch-none select-none transition-transform duration-75"
        style={
          position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: isDragging ? 'scale(1.06)' : 'scale(1)',
              }
            : {
                right: '16px',
                bottom: '90px',
              }
        }
      >
        <button
          id="global-chatbot-btn"
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center border-2 border-white shadow-md ${
            isDragging
              ? 'cursor-grabbing ring-2 ring-emerald-400 opacity-95'
              : 'cursor-grab active:scale-95'
          } transition-all select-none group`}
          aria-label="24/7 Universal Help Support Service"
          title="Drag to move anywhere • Tap for 24/7 Support"
        >
          <Bot className="w-5 h-5 stroke-[2.2] pointer-events-none" />
          
          {/* Miniature 24/7 Badge */}
          <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-slate-900 text-emerald-300 font-bold text-[8px] rounded-full border border-white leading-none shadow-xs pointer-events-none">
            24/7
          </span>

          {/* Active Status Dot */}
          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-300 rounded-full border border-emerald-700 pointer-events-none" />
        </button>
      </div>

      {/* Interactive Clean Chat Dialog Modal */}
      {isChatOpen && (
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
                    <h3 className="font-bold text-xs leading-tight text-white">juspay Live Service</h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">24/7 AI Concierge & Financial Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Support Channels Banner */}
            <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Need official human support?</span>
              </div>
              <button
                onClick={() => {
                  setIsChatOpen(false);
                  setActiveScreen('service');
                }}
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <span>View Desks</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={chatBodyRef} className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/70">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 text-right font-mono ${
                        m.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-600 border border-slate-200 rounded-xl rounded-bl-none px-3 py-2 text-xs flex items-center gap-1.5 shadow-xs">
                    <Bot className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                    <span className="text-[10px] font-semibold text-slate-500">juspay AI is typing...</span>
                  </div>
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Quick Queries
                </p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={isTyping}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[10px] font-semibold rounded-lg border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about deposits, 4% referrals, rates, cards..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping}
                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
