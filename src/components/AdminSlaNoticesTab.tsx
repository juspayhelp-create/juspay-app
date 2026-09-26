import React, { useState } from 'react';
import {
  ShieldCheck,
  Megaphone,
  Plus,
  Check,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  Layers,
  CheckCircle2,
  Eye,
  Sliders,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SLAAnnouncement } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const AdminSlaNoticesTab: React.FC = () => {
  const {
    stats,
    adminUpdateStats,
    adminAddAnnouncement,
    adminUpdateAnnouncement,
    adminDeleteAnnouncement,
    adminToggleAnnouncement,
    adminResetAnnouncements,
    showToast
  } = useApp();

  const announcements: SLAAnnouncement[] = stats.global_announcements || [];
  const activeCount = announcements.filter(a => a.is_active).length;

  // Banner Global Controls
  const [badgeText, setBadgeText] = useState(stats.sla_badge_text || 'SLA NOTICE');
  const [isBannerEnabled, setIsBannerEnabled] = useState(stats.sla_banner_enabled !== false);
  const [hasUnsavedBannerSettings, setHasUnsavedBannerSettings] = useState(false);

  // Announcement Form State (Add / Edit)
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<SLAAnnouncement | null>(null);

  const [formBadge, setFormBadge] = useState('SLA NOTICE');
  const [formMessage, setFormMessage] = useState('');
  const [formPriority, setFormPriority] = useState<'normal' | 'urgent' | 'highlight'>('highlight');
  const [formIsActive, setFormIsActive] = useState(true);

  // Quick Preset Templates
  const PRESET_TEMPLATES = [
    {
      badge: 'SLA NOTICE',
      priority: 'highlight' as const,
      message: `Official Settlement Gateway: Guaranteed Fixed 1 USDT = ${stats.realtime_exchange_rate || 111} INR • 24/7 Fast Payouts & Automated Settlements.`,
    },
    {
      badge: 'INSTANT SLA',
      priority: 'urgent' as const,
      message: 'Automated settlement transfers complete within 1-5 minutes with 100% cryptographic vault backing.',
    },
    {
      badge: 'BANKING UPDATE',
      priority: 'normal' as const,
      message: 'Zero-deduction merchant settlements live for verified personal and business bank accounts.',
    },
    {
      badge: 'SECURITY AUDIT',
      priority: 'highlight' as const,
      message: 'All withdrawal channels secured with Juspay Dual-Factor Verification & End-to-End Encryption.',
    },
  ];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormBadge('SLA NOTICE');
    setFormMessage('');
    setFormPriority('highlight');
    setFormIsActive(true);
    setIsAdding(true);
  };

  const handleOpenEdit = (item: SLAAnnouncement) => {
    setEditingItem(item);
    setFormBadge(item.badge || 'SLA NOTICE');
    setFormMessage(item.message);
    setFormPriority(item.priority || 'normal');
    setFormIsActive(item.is_active);
    setIsAdding(true);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setFormBadge(preset.badge);
    setFormMessage(preset.message);
    setFormPriority(preset.priority);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) {
      showToast('Announcement message cannot be empty');
      return;
    }

    triggerConfirmSound();
    if (editingItem) {
      adminUpdateAnnouncement(editingItem.id, {
        badge: formBadge.trim().toUpperCase() || 'SLA NOTICE',
        message: formMessage.trim(),
        priority: formPriority,
        is_active: formIsActive,
      });
    } else {
      adminAddAnnouncement({
        badge: formBadge.trim().toUpperCase() || 'SLA NOTICE',
        message: formMessage.trim(),
        priority: formPriority,
        is_active: formIsActive,
      });
    }
    triggerSuccessSound();

    // Broadcast live notice event to display on-screen alert banner across user views
    if (formIsActive) {
      window.dispatchEvent(new CustomEvent('juspay_notice_broadcast', {
        detail: {
          title: formBadge.trim().toUpperCase() || 'SLA NOTICE',
          message: formMessage.trim(),
          badge: formBadge.trim().toUpperCase() || 'SLA NOTICE',
          priority: formPriority
        }
      }));
    }

    setIsAdding(false);
    setEditingItem(null);
  };

  const handleSaveBannerSettings = () => {
    triggerConfirmSound();
    adminUpdateStats({
      sla_badge_text: badgeText.trim().toUpperCase() || 'SLA NOTICE',
      sla_banner_enabled: isBannerEnabled,
    });
    setHasUnsavedBannerSettings(false);
    triggerSuccessSound();
    showToast('SLA Banner global settings updated.');
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'highlight':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Overview & Quick Actions */}
      <div className="clay-card p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#EFE8DF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                  SLA Notice Banner Management
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-extrabold border border-emerald-300">
                  {activeCount} Active / {announcements.length} Total
                </span>
              </div>
              <p className="text-[11px] text-[#7A6B5D] font-medium">
                Configure live ticker messages, service SLA guarantees, and priority badges displayed on the home screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="clay-btn-emerald px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding && !editingItem ? 'Close Form' : 'New Notice'}</span>
            </button>
            <button
              onClick={adminResetAnnouncements}
              title="Reset to default notices"
              className="px-2.5 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* 2. Global Banner Configuration Controls */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">Banner Display Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsBannerEnabled(!isBannerEnabled);
                  setHasUnsavedBannerSettings(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  isBannerEnabled
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isBannerEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    <span>Banner Visible</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    <span>Banner Hidden</span>
                  </>
                )}
              </button>
              {hasUnsavedBannerSettings && (
                <button
                  type="button"
                  onClick={handleSaveBannerSettings}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer shadow-xs animate-pulse"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Default Badge Label Text
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={e => {
                  setBadgeText(e.target.value);
                  setHasUnsavedBannerSettings(true);
                }}
                placeholder="e.g. SLA NOTICE or SYSTEM GUARANTEE"
                className="w-full clay-inset px-3 py-1.5 text-xs font-bold uppercase text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                The pill label displayed inside the emerald badge on the left side of the home banner.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Live Banner Preview
              </label>
              {isBannerEnabled ? (
                <div className="bg-slate-900 text-slate-100 rounded-lg px-3 py-1.5 border border-slate-800 flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[9px] shrink-0 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{badgeText.trim() || 'SLA NOTICE'}</span>
                  </div>
                  <div className="text-slate-200 text-[10px] font-semibold truncate">
                    {announcements.filter(a => a.is_active)[0]?.message || 'No active announcements.'}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 text-slate-500 rounded-lg px-3 py-2 text-center text-[10px] font-bold border border-dashed border-slate-300">
                  Banner is currently toggled OFF for all users
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Add / Edit Notice Form */}
        {isAdding && (
          <form
            onSubmit={handleSubmitForm}
            className="p-4 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-teal-50/40 rounded-2xl border border-emerald-200/80 space-y-3.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {editingItem ? <Edit2 className="w-3.5 h-3.5 text-emerald-700" /> : <Plus className="w-3.5 h-3.5 text-emerald-700" />}
                {editingItem ? 'Edit SLA Announcement' : 'Create New SLA Notice Announcement'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[10px] font-bold text-slate-600 block mb-1">
                Quick Template Presets (Click to autofill):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(tmpl)}
                    className="text-[10px] px-2 py-1 bg-white hover:bg-emerald-50 text-slate-800 font-semibold rounded-lg border border-slate-200 hover:border-emerald-300 cursor-pointer transition-colors shadow-2xs"
                  >
                    {tmpl.badge}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Tag / Badge *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLA NOTICE"
                  value={formBadge}
                  onChange={e => setFormBadge(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-bold uppercase text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Priority Level
                </label>
                <select
                  value={formPriority}
                  onChange={e => setFormPriority(e.target.value as any)}
                  className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="highlight">Highlight (Golden/Amber emphasis)</option>
                  <option value="urgent">Urgent (Red alert priority)</option>
                  <option value="normal">Normal (Standard emerald SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Initial Status
                </label>
                <select
                  value={formIsActive ? 'true' : 'false'}
                  onChange={e => setFormIsActive(e.target.value === 'true')}
                  className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="true">Active (Visible immediately)</option>
                  <option value="false">Draft / Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Announcement Message *
              </label>
              <textarea
                rows={2}
                placeholder="Enter guaranteed settlement rates, IMPS turnaround times, or policy notices..."
                value={formMessage}
                onChange={e => setFormMessage(e.target.value)}
                className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                This text will stream across the home screen marquee ticker. Keep it crisp, accurate, and professional.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsAdding(false);
                  setEditingItem(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingItem ? 'Save Changes' : 'Publish Announcement'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. Announcements List */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-emerald-700" />
              Configured SLA Notices ({announcements.length})
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Click toggle to activate or deactivate without deleting
            </span>
          </div>

          {announcements.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No SLA Announcements Configured</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Create a new announcement or reset to defaults to display official settlement SLAs on the user home screen.
              </p>
              <button
                onClick={adminResetAnnouncements}
                className="mt-3 clay-btn-emerald px-3.5 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Standard Notices</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    item.is_active
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          #{index + 1}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-900 text-emerald-400 rounded tracking-wider uppercase border border-slate-800">
                          {item.badge || 'SLA NOTICE'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold rounded border uppercase ${getPriorityStyle(
                            item.priority
                          )}`}
                        >
                          {item.priority || 'normal'}
                        </span>
                        {item.is_active ? (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            Live on Marquee
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold text-slate-600 bg-slate-200 rounded">
                            Inactive / Hidden
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-relaxed pt-0.5">
                        {item.message}
                      </p>

                      {item.created_at && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Created: {item.created_at}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 self-end sm:self-start shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => adminToggleAnnouncement(item.id)}
                        title={item.is_active ? 'Deactivate Notice' : 'Activate Notice'}
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          item.is_active
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {item.is_active ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit announcement message"
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this SLA announcement?')) {
                            adminDeleteAnnouncement(item.id);
                          }
                        }}
                        title="Delete announcement"
                        className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
