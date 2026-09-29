import React, { useState } from 'react';
import {
  Headphones,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
  Copy,
  RefreshCw,
  Phone,
  Mail,
  Send,
  MessageCircle,
  Clock,
  ShieldCheck,
  Eye,
  Sliders,
  X,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupportChannel } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const AdminSupportChannelsTab: React.FC = () => {
  const {
    supportChannels,
    fetchSupportChannels,
    adminAddSupportChannel,
    adminUpdateSupportChannel,
    adminDeleteSupportChannel,
    adminToggleSupportChannel,
    adminResetSupportChannels,
    showToast
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<SupportChannel | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formContactLink, setFormContactLink] = useState('');
  const [formAvatar, setFormAvatar] = useState('🎧');
  const [formChannelType, setFormChannelType] = useState<'whatsapp' | 'telegram' | 'email' | 'phone' | 'livechat' | 'other'>('whatsapp');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);

  // Quick Preset Templates
  const PRESET_TEMPLATES = [
    {
      label: 'WhatsApp 24/7 Priority Desk',
      channel_type: 'whatsapp' as const,
      title: 'Official 24/7 WhatsApp Help Desk',
      subtitle: 'Instant Resolution • SLA < 3 Mins',
      handle: '+91 98765 43210',
      contact_link: 'https://wa.me/919876543210',
      avatar: '💬'
    },
    {
      label: 'Telegram Official News Channel',
      channel_type: 'telegram' as const,
      title: 'Linkpay Official Telegram Channel',
      subtitle: 'Official Announcements & Live Rate Updates',
      handle: '@juspay_official_channel',
      contact_link: 'https://t.me/juspay_official_channel',
      avatar: '📢'
    },
    {
      label: 'Telegram VIP Crypto Desk',
      channel_type: 'telegram' as const,
      title: 'Crypto Settlement Desk',
      subtitle: 'USDT TRC20 / BEP20 Expedited Approvals',
      handle: '@juspay_crypto_desk',
      contact_link: 'https://t.me/juspay_crypto_desk',
      avatar: '💎'
    },
    {
      label: 'WhatsApp Affiliate Hotline',
      channel_type: 'whatsapp' as const,
      title: 'Affiliate & Team Partner Hotline',
      subtitle: 'Level A & Level B Commission Inquiries',
      handle: '+91 98765 43211',
      contact_link: 'https://wa.me/919876543211',
      avatar: '🤝'
    },
    {
      label: 'Institutional Email Support',
      channel_type: 'email' as const,
      title: 'Institutional SLA Email Desk',
      subtitle: 'Executive Escalation • Guaranteed <15m Response',
      handle: 'support@juspay-usdt.com',
      contact_link: 'mailto:support@juspay-usdt.com',
      avatar: '✉️'
    }
  ];

  const EMOJI_PRESETS = ['🎧', '💬', '📱', '📢', '💎', '🤝', '🛡️', '⚡', '🚀', '✉️', '🌐', '💼', '📞', '🤖', '👑', '🔥'];

  const handleOpenAdd = () => {
    triggerSwitchSound();
    setEditingItem(null);
    setFormTitle('');
    setFormSubtitle('Online 24/7 Dedicated Support Desk');
    setFormHandle('');
    setFormContactLink('');
    setFormAvatar('💬');
    setFormChannelType('whatsapp');
    setFormIsActive(true);
    setFormDisplayOrder(supportChannels.length + 1);
    setIsAdding(true);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    triggerSwitchSound();
    setFormChannelType(preset.channel_type);
    setFormTitle(preset.title);
    setFormSubtitle(preset.subtitle);
    setFormHandle(preset.handle);
    setFormContactLink(preset.contact_link);
    setFormAvatar(preset.avatar);
    showToast(`Loaded template: ${preset.label}`);
  };

  const handleOpenEdit = (channel: SupportChannel) => {
    triggerSwitchSound();
    setEditingItem(channel);
    setFormTitle(channel.title);
    setFormSubtitle(channel.subtitle);
    setFormHandle(channel.handle);
    setFormContactLink(channel.contact_link);
    setFormAvatar(channel.avatar || '🎧');
    setFormChannelType(channel.channel_type || (channel.contact_link.includes('wa.me') ? 'whatsapp' : channel.contact_link.includes('t.me') ? 'telegram' : 'other'));
    setFormIsActive(channel.is_active !== false);
    setFormDisplayOrder(channel.display_order || 0);
    setIsAdding(true);
  };

  const handleCloseForm = () => {
    triggerCancelSound();
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter a channel title.');
      return;
    }
    if (!formHandle.trim()) {
      showToast('Please enter a channel handle, username, or phone number.');
      return;
    }
    if (!formContactLink.trim()) {
      showToast('Please enter a contact link or URL.');
      return;
    }

    setIsSubmitting(true);
    triggerConfirmSound();

    let cleanLink = formContactLink.trim();
    if (formChannelType === 'whatsapp' && !cleanLink.startsWith('http') && !cleanLink.startsWith('mailto')) {
      const numericPhone = cleanLink.replace(/[^\d]/g, '');
      if (numericPhone) {
        cleanLink = `https://wa.me/${numericPhone}`;
      }
    } else if (formChannelType === 'telegram' && !cleanLink.startsWith('http') && !cleanLink.startsWith('mailto')) {
      const cleanTelegram = cleanLink.replace(/^@/, '');
      if (cleanTelegram) {
        cleanLink = `https://t.me/${cleanTelegram}`;
      }
    }

    const payload = {
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || 'Online 24/7 Dedicated Support Desk',
      handle: formHandle.trim(),
      contact_link: cleanLink,
      avatar: formAvatar.trim() || '🎧',
      channel_type: formChannelType,
      is_active: formIsActive,
      display_order: Number(formDisplayOrder) || 0
    };

    if (editingItem) {
      const res = await adminUpdateSupportChannel(editingItem.id, payload);
      if (res.success) {
        triggerSuccessSound();
        setIsAdding(false);
        setEditingItem(null);
      }
    } else {
      const res = await adminAddSupportChannel(payload);
      if (res.success) {
        triggerSuccessSound();
        setIsAdding(false);
        setEditingItem(null);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    triggerConfirmSound();
    setIsSubmitting(true);
    await adminDeleteSupportChannel(id);
    setDeletingId(null);
    setIsSubmitting(false);
  };

  const handleToggle = async (channel: SupportChannel) => {
    triggerSwitchSound();
    await adminToggleSupportChannel(channel.id, !channel.is_active);
  };

  const handleCopyLink = (channel: SupportChannel) => {
    navigator.clipboard.writeText(channel.contact_link);
    setCopiedId(channel.id);
    showToast(`Copied ${channel.title} link!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncNeon = async () => {
    setIsSyncing(true);
    triggerSwitchSound();
    await fetchSupportChannels();
    showToast('Support channels re-synchronized from Neon PostgreSQL.');
    setTimeout(() => setIsSyncing(false), 500);
  };

  const filteredChannels = supportChannels.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact_link.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = supportChannels.filter(c => c.is_active !== false).length;

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
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* 1. Header Banner */}
      <div className="fintech-card-navy p-4 text-white space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">24/7 SLA Official Verified Support Desks</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{activeCount} Active Desks</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Configure direct verified channels (WhatsApp, Telegram, Phone, Email) shown in Customer Service & Priority Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncNeon}
              disabled={isSyncing}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="Sync from PostgreSQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="fintech-btn-emerald px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Support Channel</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/60">
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <span className="text-[10px] text-slate-400 block font-medium">Total Channels</span>
            <span className="text-sm font-extrabold font-mono text-white">{supportChannels.length} Desks</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <span className="text-[10px] text-slate-400 block font-medium">Active Channels</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400">{activeCount} Online</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <span className="text-[10px] text-slate-400 block font-medium">SLA Resolution</span>
            <span className="text-sm font-extrabold font-mono text-white">&lt; 3 Minutes</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <span className="text-[10px] text-slate-400 block font-medium">Status In App</span>
            <span className="text-sm font-extrabold font-mono text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live in UI</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search support channels by title, handle, WhatsApp number, or Telegram username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-9 pr-3 py-2 text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>

        <button
          onClick={() => adminResetSupportChannels()}
          className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          title="Reset to official verified default channels"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Factory Defaults</span>
        </button>
      </div>

      {/* 3. Channels List */}
      <div className="space-y-2.5">
        {filteredChannels.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-700">No Support Channels Found</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchQuery ? 'No channels match your search filter.' : 'Click "Add Support Channel" or "Reset Factory Defaults" to create official support channels.'}
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="fintech-btn-emerald px-4 py-1.5 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Channel</span>
            </button>
          </div>
        ) : (
          filteredChannels.map((channel, index) => {
            const badge = getTypeBadge(channel.channel_type, channel.contact_link);
            const BadgeIcon = badge.icon;
            const isItemActive = channel.is_active !== false;

            return (
              <div
                key={channel.id || channel.channel_id || index}
                className={`fintech-card p-4 transition-all duration-150 ${
                  isItemActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Avatar & Channel Details */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-2xl flex items-center justify-center border border-slate-200 shrink-0 shadow-xs">
                      {channel.avatar || '🎧'}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{channel.title}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                          <BadgeIcon className="w-2.5 h-2.5" />
                          <span>{badge.label}</span>
                        </span>
                        {isItemActive ? (
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[8px] font-bold rounded border border-emerald-200 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 text-[8px] font-bold rounded">
                            Inactive / Hidden
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 truncate">{channel.subtitle}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {channel.handle}
                        </span>
                        <a
                          href={channel.contact_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-medium truncate max-w-xs"
                          title={channel.contact_link}
                        >
                          <span className="truncate">{channel.contact_link}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleCopyLink(channel)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                      title="Copy link"
                    >
                      {copiedId === channel.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => window.open(channel.contact_link, '_blank')}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Test live link"
                    >
                      <span>Test</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handleToggle(channel)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isItemActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title={isItemActive ? 'Hide from user screens' : 'Show on user screens'}
                    >
                      {isItemActive ? 'Pause' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(channel)}
                      className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                      title="Edit channel details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingId(channel.id)}
                      className="p-2 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                      title="Delete channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Live User Preview Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-700" />
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Live Preview • How It Appears on Customer Service Screen
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Customer Service & Priority Desk (24/7 SLA)</span>
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          {supportChannels.filter(c => c.is_active !== false).map(channel => (
            <div
              key={`preview_${channel.id}`}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-xl flex items-center justify-center border border-slate-200 shrink-0">
                  {channel.avatar || '🎧'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-bold text-xs text-slate-900 truncate">{channel.title}</h5>
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

              <div className="fintech-btn-emerald px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 cursor-default shadow-xs">
                <span>Connect</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. ADD / EDIT CHANNEL MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {editingItem ? 'Edit Support Channel' : 'Add New Support Channel'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingItem ? 'Update verified desk details in real-time.' : 'Configure a new 24/7 SLA customer support channel.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseForm}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Preset Templates */}
            {!editingItem && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  1-Click Preset Templates
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PRESET_TEMPLATES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{preset.avatar}</span>
                        <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                          {preset.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-3.5">
              
              {/* Channel Type Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Channel Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                    { type: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-700 bg-sky-50 border-sky-300' },
                    { type: 'email', label: 'Email Desk', icon: Mail, color: 'text-purple-700 bg-purple-50 border-purple-300' },
                    { type: 'phone', label: 'Phone Line', icon: Phone, color: 'text-amber-700 bg-amber-50 border-amber-300' },
                    { type: 'livechat', label: 'Live Chat', icon: Headphones, color: 'text-indigo-700 bg-indigo-50 border-indigo-300' },
                    { type: 'other', label: 'Custom URL', icon: Globe, color: 'text-slate-700 bg-slate-50 border-slate-300' },
                  ].map(item => {
                    const isSelected = formChannelType === item.type;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setFormChannelType(item.type as any);
                          if (item.type === 'whatsapp' && formAvatar === '📢') setFormAvatar('💬');
                          if (item.type === 'telegram' && formAvatar === '💬') setFormAvatar('📢');
                          if (item.type === 'email') setFormAvatar('✉️');
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isSelected
                            ? `${item.color} font-extrabold shadow-xs ring-1 ring-emerald-500`
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ItemIcon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Avatar */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Channel Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official 24/7 WhatsApp Support"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Icon / Emoji
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formAvatar}
                    onChange={e => setFormAvatar(e.target.value)}
                    className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-base text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Emoji quick presets */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Quick Icons:</span>
                {EMOJI_PRESETS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormAvatar(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                      formAvatar === emoji ? 'bg-emerald-100 border border-emerald-400 scale-110' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Subtitle / SLA description */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Subtitle / SLA Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Online 24/7 Dedicated Support Desk • SLA < 3 Mins"
                  value={formSubtitle}
                  onChange={e => setFormSubtitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Handle / Phone / Username */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Handle / Phone Number / Display Text *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formChannelType === 'whatsapp'
                      ? '+91 98765 43210'
                      : formChannelType === 'telegram'
                      ? '@juspay_support'
                      : formChannelType === 'email'
                      ? 'support@juspay-usdt.com'
                      : '+91 98765 43210'
                  }
                  value={formHandle}
                  onChange={e => {
                    const val = e.target.value;
                    setFormHandle(val);
                    if (!formContactLink || formContactLink.startsWith('https://wa.me/') || formContactLink.startsWith('https://t.me/')) {
                      if (formChannelType === 'whatsapp') {
                        const digits = val.replace(/[^\d]/g, '');
                        if (digits) setFormContactLink(`https://wa.me/${digits}`);
                      } else if (formChannelType === 'telegram') {
                        const clean = val.replace(/^@/, '');
                        if (clean) setFormContactLink(`https://t.me/${clean}`);
                      }
                    }
                  }}
                  className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Direct Contact Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Direct Contact Link / URL *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormContactLink('https://wa.me/')}
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                    >
                      wa.me/
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setFormContactLink('https://t.me/')}
                      className="text-[10px] text-sky-700 hover:underline font-bold"
                    >
                      t.me/
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setFormContactLink('mailto:support@juspay-usdt.com')}
                      className="text-[10px] text-purple-700 hover:underline font-bold"
                    >
                      mailto:
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder={
                    formChannelType === 'whatsapp'
                      ? 'https://wa.me/919876543210'
                      : formChannelType === 'telegram'
                      ? 'https://t.me/juspay_support'
                      : formChannelType === 'email'
                      ? 'mailto:support@juspay-usdt.com'
                      : 'https://wa.me/919876543210'
                  }
                  value={formContactLink}
                  onChange={e => setFormContactLink(e.target.value)}
                  className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Options: Active Toggle & Display Order */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Active Online</span>
                    <span className="text-[10px] text-slate-500">Show on user app</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={e => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={e => setFormDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fintech-btn-emerald px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingItem ? 'Update Channel' : 'Add Channel'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Delete Support Channel?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently remove this verified customer support channel?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
