import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Sparkles, 
  Edit2, 
  RefreshCw, 
  Flame, 
  Zap, 
  Layers, 
  Search,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  ClaimableOrder, 
  OrderCategoryRange, 
  CashbackBracket, 
  normalizeOrderCategoryRange,
  parseOrderCategoryRanges,
  orderMatchesCategory
} from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const AdminOffersTab: React.FC = () => {
  const {
    claimableOrders = [],
    cashbackBrackets = [],
    stats,
    adminAddOrder,
    adminUpdateOrder,
    adminDeleteOrder,
    adminResetOrders,
    adminAddBracket,
    adminUpdateBracket,
    adminDeleteBracket,
    adminToggleBracket,
    adminResetBrackets,
    showToast
  } = useApp();

  // Sub-Navigation: Offers vs Brackets
  const [offersSubTab, setOffersSubTab] = useState<'offers' | 'brackets'>('offers');

  // Offers State
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ClaimableOrder | null>(null);
  const [editingSelectedRanges, setEditingSelectedRanges] = useState<string[]>([]);
  const [orderRangeFilter, setOrderRangeFilter] = useState<string>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Add Order Form Inputs
  const [newOrderCode, setNewOrderCode] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newOrderAmount, setNewOrderAmount] = useState('2500');
  const [newOrderMinDeposit, setNewOrderMinDeposit] = useState('2500');
  const [newOrderCashbackPct, setNewOrderCashbackPct] = useState(stats.commission_rate ? stats.commission_rate.toString() : '4.0');
  const [newOrderSelectedRanges, setNewOrderSelectedRanges] = useState<string[]>(['2001-5000']);
  const [newOrderIncludeTopPicks, setNewOrderIncludeTopPicks] = useState(false);
  const [newOrderNotes, setNewOrderNotes] = useState('');

  // Bracket CRUD Form Inputs & Modal State
  const [isAddingBracket, setIsAddingBracket] = useState(false);
  const [editingBracket, setEditingBracket] = useState<CashbackBracket | null>(null);
  const [newBracketKey, setNewBracketKey] = useState('');
  const [newBracketName, setNewBracketName] = useState('');
  const [newBracketMin, setNewBracketMin] = useState('1000');
  const [newBracketMax, setNewBracketMax] = useState('5000');
  const [newBracketRate, setNewBracketRate] = useState('4.0');
  const [newBracketBadge, setNewBracketBadge] = useState('⚡');
  const [newBracketHighlight, setNewBracketHighlight] = useState(false);
  const [newBracketOrder, setNewBracketOrder] = useState('10');
  const [newBracketDesc, setNewBracketDesc] = useState('');

  // Helper to auto-pick category range based on order amount
  const autoPickRange = (amt: number): string => {
    if (cashbackBrackets && cashbackBrackets.length > 0) {
      const match = cashbackBrackets.find(b => amt >= b.min_amount && (b.max_amount === 0 || amt <= b.max_amount));
      if (match) return match.key;
    }
    if (amt >= 15001) return '15001-50000';
    if (amt >= 5001) return '5001-15000';
    if (amt >= 2001) return '2001-5000';
    if (amt >= 501) return '501-2000';
    if (amt >= 301) return '301-500';
    return '100-300';
  };

  const handleOrderAmountChange = (val: string) => {
    setNewOrderAmount(val);
    setNewOrderMinDeposit(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const picked = autoPickRange(num);
      setNewOrderSelectedRanges(prev => {
        const keepsTop = prev.includes('Top Picks') || newOrderIncludeTopPicks;
        const base = [picked];
        if (keepsTop && !base.includes('Top Picks')) base.unshift('Top Picks');
        return base;
      });
    }
  };

  const toggleNewOrderRange = (key: string) => {
    triggerSwitchSound();
    setNewOrderSelectedRanges(prev => {
      if (prev.includes(key)) {
        const next = prev.filter(k => k !== key);
        return next.length > 0 ? next : [key]; // keep at least one
      } else {
        return [...prev, key];
      }
    });
  };

  const toggleEditingRange = (key: string) => {
    triggerSwitchSound();
    setEditingSelectedRanges(prev => {
      if (prev.includes(key)) {
        const next = prev.filter(k => k !== key);
        return next.length > 0 ? next : [key]; // keep at least one
      } else {
        return [...prev, key];
      }
    });
  };

  const handleOpenEditModal = (order: ClaimableOrder) => {
    setEditingOrder(order);
    const initialRanges = parseOrderCategoryRanges(order.category_ranges || order.category_range, order.amount_inr);
    setEditingSelectedRanges(initialRanges);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newOrderAmount);
    const minDep = parseFloat(newOrderMinDeposit) || amt;
    const pct = parseFloat(newOrderCashbackPct) || stats.commission_rate || 4.0;
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid order amount in INR.');
      return;
    }
    const income = Number(((amt * pct) / 100).toFixed(2));
    
    // Combine ranges
    const allRanges = [...newOrderSelectedRanges];
    if (newOrderIncludeTopPicks && !allRanges.includes('Top Picks')) {
      allRanges.unshift('Top Picks');
    }
    const finalRanges = Array.from(new Set(allRanges.filter(Boolean)));
    const finalRangeStr = finalRanges.join(', ');

    adminAddOrder({
      code: newOrderCode.trim() || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      amount_inr: amt,
      income_inr: income,
      cashback_rate: pct,
      min_deposit_required: minDep,
      category_range: finalRangeStr,
      category_ranges: finalRanges,
      is_top_pick: finalRanges.some(c => c.toLowerCase().includes('top')),
      notes: newOrderNotes.trim(),
    });

    // Reset form
    setNewOrderCode(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewOrderAmount('2500');
    setNewOrderMinDeposit('2500');
    setNewOrderSelectedRanges(['2001-5000']);
    setNewOrderIncludeTopPicks(false);
    setNewOrderNotes('');
    setIsAddingOrder(false);
  };

  const handleEditOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const finalRanges = Array.from(new Set(editingSelectedRanges.filter(Boolean)));
    const finalRangeStr = finalRanges.join(', ');

    adminUpdateOrder(editingOrder.id, {
      ...editingOrder,
      category_range: finalRangeStr,
      category_ranges: finalRanges,
      is_top_pick: finalRanges.some(c => c.toLowerCase().includes('top'))
    });
    setEditingOrder(null);
  };

  const addPresetOrder = (amount: number, category: string, codePrefix: string, alsoTopPick: boolean = true) => {
    const pct = stats.commission_rate || 4.0;
    const income = Number(((amount * pct) / 100).toFixed(2));
    const randomCode = `${codePrefix}-${Math.floor(100 + Math.random() * 900)}`;
    const ranges = alsoTopPick && category !== 'Top Picks' ? ['Top Picks', category] : [category];

    adminAddOrder({
      code: randomCode,
      amount_inr: amount,
      income_inr: income,
      cashback_rate: pct,
      min_deposit_required: amount,
      category_range: ranges.join(', '),
      category_ranges: ranges,
      is_top_pick: alsoTopPick,
      notes: `Tier ₹${amount.toLocaleString('en-IN')} Offer (${ranges.join(' + ')})`,
    });
  };

  const handleCreateBracketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBracketName.trim()) {
      showToast('Bracket title is required.');
      return;
    }
    const cleanKey = (newBracketKey.trim() || newBracketName.trim()).replace(/\s+/g, '-');
    adminAddBracket({
      key: cleanKey,
      name: newBracketName.trim(),
      min_amount: parseFloat(newBracketMin) || 0,
      max_amount: parseFloat(newBracketMax) || 0,
      default_cashback_rate: parseFloat(newBracketRate) || 4.0,
      badge: newBracketBadge.trim() || '⚡',
      highlight: newBracketHighlight,
      display_order: parseInt(newBracketOrder, 10) || 0,
      is_active: true,
      description: newBracketDesc.trim(),
    });

    // Reset Form
    setNewBracketKey('');
    setNewBracketName('');
    setNewBracketMin('1000');
    setNewBracketMax('5000');
    setNewBracketRate('4.0');
    setNewBracketBadge('⚡');
    setNewBracketHighlight(false);
    setNewBracketOrder('10');
    setNewBracketDesc('');
    setIsAddingBracket(false);
  };

  const handleEditBracketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBracket) return;
    adminUpdateBracket(editingBracket.id, editingBracket);
    setEditingBracket(null);
  };

  // Filter claimable orders for admin list
  const filteredOrders = claimableOrders.filter(o => {
    const matchesRange = orderMatchesCategory(o, orderRangeFilter);
    const assigned = parseOrderCategoryRanges(o.category_ranges || o.category_range, o.amount_inr).join(' ');
    const matchesSearch = !orderSearchQuery || 
      o.code.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.amount_inr.toString().includes(orderSearchQuery) ||
      assigned.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesRange && matchesSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Sub-Nav Switcher: Offers vs Brackets */}
      <div className="clay-card p-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => {
              triggerSwitchSound();
              setOffersSubTab('offers');
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              offersSubTab === 'offers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white/70 text-slate-700 hover:text-slate-950 hover:bg-white border border-slate-200/80'
            }`}
          >
            <span>🎁 Dynamic Cashback Offers</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              offersSubTab === 'offers' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {claimableOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerSwitchSound();
              setOffersSubTab('brackets');
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              offersSubTab === 'brackets'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'bg-white/70 text-purple-900 hover:text-purple-950 hover:bg-purple-50 border border-purple-200/80'
            }`}
          >
            <span>🏷️ Cashback Brackets & Range Tiers</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              offersSubTab === 'brackets' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              {cashbackBrackets.length}
            </span>
          </button>
        </div>
      </div>

      {/* SUB-TAB A: OFFERS LIST */}
      {offersSubTab === 'offers' && (
        <div className="clay-card p-4 space-y-3.5">
          
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-700" />
              <div>
                <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                  Deposit Cashback Offers Catalog
                </h3>
                <span className="text-[10px] text-[#7A6B5D] block">
                  Assign offers to multiple brackets simultaneously (e.g. Top Picks + Deposit Tier)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={adminResetOrders}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#7A6B5D] hover:text-[#2D241E] text-[10px] font-bold rounded-lg border border-[#E8E0D5] flex items-center gap-1 cursor-pointer shadow-xs"
                title="Reset to standard catalogue up to ₹50,000"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Default Offers</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingOrder(!isAddingOrder)}
                className="clay-btn-emerald px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingOrder ? 'Close Form' : 'Add New Offer'}</span>
              </button>
            </div>
          </div>

          {/* Quick 1-Click Preset Tiers Generator (Dual Bracket: Tier + Top Picks) */}
          <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 rounded-2xl border border-purple-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Quick High-Tier Generator (Auto-added to Tier + Top Picks)</span>
              </span>
              <span className="text-[10px] text-purple-800 font-bold">1-Click Dual Bracket</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => addPresetOrder(2800, '2001-5000', 'ORD-2K', true)}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-950 text-[10px] font-bold rounded-lg border border-purple-200 shadow-xs cursor-pointer flex items-center gap-1"
                title="Add to both 2001-5000 and Top Picks"
              >
                <span>🔥 + ₹2,800 (Tier 2K-5K + Top Picks)</span>
              </button>
              <button
                type="button"
                onClick={() => addPresetOrder(8500, '5001-15000', 'ORD-8K', true)}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-950 text-[10px] font-bold rounded-lg border border-purple-200 shadow-xs cursor-pointer flex items-center gap-1"
                title="Add to both 5001-15000 and Top Picks"
              >
                <span>🔥 + ₹8,500 (Tier 5K-15K + Top Picks)</span>
              </button>
              <button
                type="button"
                onClick={() => addPresetOrder(22000, '15001-50000', 'ORD-22K', true)}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-950 text-[10px] font-bold rounded-lg border border-purple-200 shadow-xs cursor-pointer flex items-center gap-1"
                title="Add to both 15001-50000 and Top Picks"
              >
                <span>🔥 + ₹22,000 (Tier 15K-50K + Top Picks)</span>
              </button>
              <button
                type="button"
                onClick={() => addPresetOrder(50000, '15001-50000', 'ORD-50K', true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold rounded-lg border border-amber-400 shadow-xs cursor-pointer flex items-center gap-1"
                title="Max Bracket + Top Picks"
              >
                <Flame className="w-3 h-3 text-red-600" />
                <span>+ ₹50,000 (Max + Top Picks)</span>
              </button>
            </div>
          </div>

          {/* Create New Order Form */}
          {isAddingOrder && (
            <form
              onSubmit={handleCreateOrderSubmit}
              className="p-4 bg-gradient-to-br from-purple-50/70 to-amber-50/50 rounded-2xl border border-purple-200 space-y-3.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-1 border-b border-purple-200/60">
                <span className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Configure New Dynamic Cashback Offer (Multi-Bracket Support)
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-800">
                  Live Auto-Income Calculation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Order Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-9950"
                    value={newOrderCode}
                    onChange={e => setNewOrderCode(e.target.value)}
                    required
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Order Amount (INR) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="2500"
                      value={newOrderAmount}
                      onChange={e => handleOrderAmountChange(e.target.value)}
                      required
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      INR
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Cashback Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      placeholder="4.0"
                      value={newOrderCashbackPct}
                      onChange={e => setNewOrderCashbackPct(e.target.value)}
                      required
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Bracket Assignment Section */}
              <div className="p-3 bg-white/80 rounded-xl border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#4A3E35] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                    <span>Assign to Category Brackets (Select 1, 2, or more) *</span>
                  </label>
                  <span className="text-[10px] text-purple-800 font-bold">
                    {newOrderSelectedRanges.length} Selected
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {cashbackBrackets.map(brk => {
                    const isSelected = newOrderSelectedRanges.includes(brk.key);
                    return (
                      <button
                        key={brk.id || brk.key}
                        type="button"
                        onClick={() => toggleNewOrderRange(brk.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-purple-900 text-white shadow-xs ring-1 ring-purple-800'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> : null}
                        {brk.badge && <span>{brk.badge}</span>}
                        <span>{brk.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick 1-Click Top Picks Dual-Bracket Inclusion */}
                <div className="pt-1 flex items-center justify-between border-t border-purple-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-amber-950">
                    <input
                      type="checkbox"
                      checked={newOrderSelectedRanges.includes('Top Picks') || newOrderIncludeTopPicks}
                      onChange={e => {
                        const checked = e.target.checked;
                        setNewOrderIncludeTopPicks(checked);
                        setNewOrderSelectedRanges(prev => {
                          if (checked && !prev.includes('Top Picks')) return ['Top Picks', ...prev];
                          if (!checked) return prev.filter(k => k !== 'Top Picks');
                          return prev;
                        });
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>🔥 Also Feature in Top Picks (Shows in Top Picks + Selected Tier Bracket)</span>
                  </label>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Multi-Bracket Enabled
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Min Approved Deposit Required (INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newOrderMinDeposit}
                    onChange={e => setNewOrderMinDeposit(e.target.value)}
                    required
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Calculated Income Output
                  </label>
                  <div className="w-full clay-inset px-3 py-2 text-xs font-mono font-extrabold text-emerald-800 bg-emerald-50 flex items-center justify-between">
                    <span>User Receives:</span>
                    <span>
                      +₹{(((parseFloat(newOrderAmount) || 0) * (parseFloat(newOrderCashbackPct) || 4)) / 100).toFixed(2)} INR
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Internal Admin Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Merchant Settlement Queue • Multi-tier promo"
                  value={newOrderNotes}
                  onChange={e => setNewOrderNotes(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingOrder(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Cashback Offer</span>
                </button>
              </div>
            </form>
          )}

          {/* Filter & Search Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8C7A6B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by code (e.g. ORD-9901), category, or amount..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  className="w-full clay-inset pl-8 pr-3 py-1.5 text-xs font-medium text-[#2D241E] bg-white"
                />
              </div>

              <span className="text-[10px] font-mono font-bold text-[#7A6B5D] whitespace-nowrap">
                Showing {filteredOrders.length} / {claimableOrders.length}
              </span>
            </div>

            {/* Range Category Filter Pills (Dynamically Populated from Cashback Brackets) */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
              <button
                type="button"
                onClick={() => setOrderRangeFilter('All')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  orderRangeFilter === 'All'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>All Brackets</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  orderRangeFilter === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {claimableOrders.length}
                </span>
              </button>

              {cashbackBrackets.filter(b => b.is_active !== false).map(b => {
                const count = claimableOrders.filter(o => orderMatchesCategory(o, b.key)).length;
                const isSelected = orderRangeFilter === b.key;

                return (
                  <button
                    key={b.id || b.key}
                    type="button"
                    onClick={() => setOrderRangeFilter(b.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                        : b.highlight
                        ? 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {b.badge && <span>{b.badge}</span>}
                    <span>{b.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order Offers List */}
          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Tag className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No order offers found matching filter "{orderRangeFilter}".</p>
              <button
                type="button"
                onClick={() => setIsAddingOrder(true)}
                className="text-xs text-purple-800 font-bold hover:underline cursor-pointer"
              >
                Click here to create a new offer
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {filteredOrders.map(order => {
                const rate = order.cashback_rate || stats.commission_rate || 4.0;
                const assignedBrackets = parseOrderCategoryRanges(order.category_ranges || order.category_range, order.amount_inr);
                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-2xl clay-card-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      order.is_claimed ? 'opacity-60 bg-slate-50' : 'hover:border-purple-200'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 bg-slate-800 text-white rounded">
                          {order.code}
                        </span>

                        {/* All Assigned Bracket Badges */}
                        {assignedBrackets.map(catKey => {
                          const isTop = catKey.toLowerCase().includes('top');
                          return (
                            <span
                              key={catKey}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                isTop
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-purple-100 text-purple-900 border-purple-200'
                              }`}
                            >
                              {isTop ? '🔥' : '🏷️'} {catKey}
                            </span>
                          );
                        })}

                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                          {rate}% Cashback
                        </span>
                        {order.is_claimed ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                            Claimed
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-sm font-extrabold text-[#2D241E] font-mono">
                          ₹{order.amount_inr.toLocaleString('en-IN')} INR
                        </span>
                        <span className="text-xs font-bold text-emerald-700 font-mono">
                          Income: +₹{order.income_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {order.notes && (
                        <p className="text-[10px] text-[#7A6B5D] font-sans italic">
                          Note: {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 sm:self-center self-end flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(order)}
                        className="px-2.5 py-1.5 bg-white text-purple-800 hover:bg-purple-50 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          adminUpdateOrder(order.id, { is_claimed: !order.is_claimed });
                        }}
                        className="px-2.5 py-1.5 bg-white text-[#7A6B5D] hover:text-[#2D241E] rounded-xl text-[10px] font-bold border border-[#E8E0D5] cursor-pointer"
                        title="Toggle Claimed status"
                      >
                        {order.is_claimed ? 'Unclaim' : 'Mark Claimed'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove offer "${order.code}"?`)) {
                            adminDeleteOrder(order.id);
                          }
                        }}
                        className="p-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-rose-200 bg-white cursor-pointer"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB B: CATEGORY BRACKETS & RANGE TIERS MANAGEMENT */}
      {offersSubTab === 'brackets' && (
        <div className="clay-card p-4 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <div>
                <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                  Cashback Brackets & Range Tiers Manager
                </h3>
                <span className="text-[10px] text-[#7A6B5D] block">
                  Add, edit, delete, and configure dynamic filter brackets for both Admin and Users
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={adminResetBrackets}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-900 text-[10px] font-bold rounded-lg border border-purple-200 flex items-center gap-1 cursor-pointer shadow-xs"
                title="Reset to standard 7 bracket tiers"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Standard Tiers</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingBracket(!isAddingBracket)}
                className="clay-btn-emerald px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingBracket ? 'Close Form' : 'Add New Category Range'}</span>
              </button>
            </div>
          </div>

          {/* Add New Category Bracket Form */}
          {isAddingBracket && (
            <form
              onSubmit={handleCreateBracketSubmit}
              className="p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-amber-50/60 rounded-2xl border border-purple-300 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-1 border-b border-purple-200">
                <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Create New Cashback Bracket Tier
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-800">
                  Auto-Synchronized with Filter Tabs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Bracket Display Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 💎 VIP Whale Tier or ₹50,001 - ₹1,00,000"
                    value={newBracketName}
                    onChange={e => setNewBracketName(e.target.value)}
                    required
                    className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Bracket Key / Value (Optional, auto-generated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50001-100000 or vip-whale"
                    value={newBracketKey}
                    onChange={e => setNewBracketKey(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Min Deposit (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="50001"
                    value={newBracketMin}
                    onChange={e => setNewBracketMin(e.target.value)}
                    required
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Max Deposit (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="100000"
                    value={newBracketMax}
                    onChange={e => setNewBracketMax(e.target.value)}
                    required
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Default Rate (%) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    placeholder="5.0"
                    value={newBracketRate}
                    onChange={e => setNewBracketRate(e.target.value)}
                    required
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Badge Icon Emoji
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 💎 or 🔥"
                    value={newBracketBadge}
                    onChange={e => setNewBracketBadge(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-bold text-center text-[#2D241E] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Display Order Sequence
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newBracketOrder}
                    onChange={e => setNewBracketOrder(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Highlight Pill Style
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-purple-200 cursor-pointer text-xs font-bold text-purple-950">
                    <input
                      type="checkbox"
                      checked={newBracketHighlight}
                      onChange={e => setNewBracketHighlight(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Featured Highlight Style (Golden/Purple Glow)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Marketing Subtitle / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ultra High Volume Settlement Tier with Expedited Approval"
                  value={newBracketDesc}
                  onChange={e => setNewBracketDesc(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingBracket(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save & Activate Bracket</span>
                </button>
              </div>
            </form>
          )}

          {/* Brackets Cards Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
              <span>Configured Cashback Bracket Tiers ({cashbackBrackets.length})</span>
              <span className="text-[10px] font-mono text-purple-800">
                Live syncing to User Payment Screen
              </span>
            </div>

            {cashbackBrackets.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No category brackets configured.</p>
                <button
                  type="button"
                  onClick={adminResetBrackets}
                  className="text-xs text-purple-800 font-bold hover:underline cursor-pointer"
                >
                  Click here to reset default brackets
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {cashbackBrackets.map((bracket, idx) => {
                  const activeOffersInBracket = claimableOrders.filter(o => {
                    const norm = normalizeOrderCategoryRange(o.category_range, o.amount_inr);
                    return norm === bracket.key || o.category_range === bracket.key || o.category_range === bracket.name;
                  }).length;

                  return (
                    <div
                      key={bracket.id || bracket.key || idx}
                      className={`p-3.5 rounded-2xl clay-card-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        bracket.is_active === false ? 'opacity-60 bg-slate-50' : 'hover:border-purple-300'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-mono font-extrabold text-[11px] flex items-center justify-center">
                            #{bracket.display_order || idx + 1}
                          </span>

                          {bracket.badge && (
                            <span className="text-base leading-none">
                              {bracket.badge}
                            </span>
                          )}

                          <span className="font-extrabold text-xs text-[#2D241E]">
                            {bracket.name}
                          </span>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            Key: {bracket.key}
                          </span>

                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                            {bracket.default_cashback_rate}% Default Rate
                          </span>

                          {bracket.highlight && (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                              Featured Glow
                            </span>
                          )}

                          {bracket.is_active !== false ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded">
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-300 text-slate-700 rounded">
                              Disabled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#4A3E35] flex-wrap pt-0.5">
                          <span className="font-mono font-bold text-slate-800">
                            Range: ₹{bracket.min_amount.toLocaleString('en-IN')} - {bracket.max_amount >= 50000 ? `₹${bracket.max_amount.toLocaleString('en-IN')}+` : `₹${bracket.max_amount.toLocaleString('en-IN')}`} INR
                          </span>

                          <span className="font-medium text-purple-900">
                            Active Offers in Tier: <strong className="font-mono text-purple-950 font-bold">{activeOffersInBracket}</strong>
                          </span>
                        </div>

                        {bracket.description && (
                          <p className="text-[10px] text-[#7A6B5D] italic">
                            {bracket.description}
                          </p>
                        )}
                      </div>

                      {/* Bracket Actions */}
                      <div className="flex items-center gap-1.5 sm:self-center self-end flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingBracket(bracket)}
                          className="px-2.5 py-1.5 bg-white text-purple-800 hover:bg-purple-50 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          title="Edit Bracket"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => adminToggleBracket(bracket.id || bracket.key)}
                          className="px-2.5 py-1.5 bg-white text-[#7A6B5D] hover:text-[#2D241E] rounded-xl text-[10px] font-bold border border-[#E8E0D5] cursor-pointer"
                          title="Toggle Bracket Active/Inactive status"
                        >
                          {bracket.is_active !== false ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete category bracket "${bracket.name}"?`)) {
                              adminDeleteBracket(bracket.id || bracket.key);
                            }
                          }}
                          className="p-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-rose-200 bg-white cursor-pointer"
                          title="Delete Category Bracket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clay-card p-5 max-w-md w-full space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <h4 className="font-extrabold text-[#2D241E] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-purple-700" />
                <span>Edit Dynamic Cashback Offer ({editingOrder.code})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditOrderSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Order Code
                </label>
                <input
                  type="text"
                  value={editingOrder.code}
                  onChange={e => setEditingOrder({ ...editingOrder, code: e.target.value })}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Order Amount (INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editingOrder.amount_inr}
                    onChange={e => {
                      const amt = parseFloat(e.target.value) || 0;
                      const rate = editingOrder.cashback_rate || stats.commission_rate || 4.0;
                      setEditingOrder({
                        ...editingOrder,
                        amount_inr: amt,
                        income_inr: Number(((amt * rate) / 100).toFixed(2)),
                      });
                    }}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Cashback Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={editingOrder.cashback_rate || stats.commission_rate || 4.0}
                    onChange={e => {
                      const rate = parseFloat(e.target.value) || 0;
                      setEditingOrder({
                        ...editingOrder,
                        cashback_rate: rate,
                        income_inr: Number(((editingOrder.amount_inr * rate) / 100).toFixed(2)),
                      });
                    }}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Calculated Income (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingOrder.income_inr}
                  onChange={e => setEditingOrder({ ...editingOrder, income_inr: parseFloat(e.target.value) || 0 })}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-extrabold text-emerald-800 bg-emerald-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Min Deposit Required (INR)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editingOrder.min_deposit_required || editingOrder.amount_inr}
                  onChange={e => setEditingOrder({ ...editingOrder, min_deposit_required: parseFloat(e.target.value) || 0 })}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  required
                />
              </div>

              {/* Multi-Bracket Assignment for Edit Modal */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#4A3E35] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                    <span>Assigned Category Brackets (Multi-Select) *</span>
                  </label>
                  <span className="text-[10px] text-purple-800 font-bold">
                    {editingSelectedRanges.length} Selected
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {cashbackBrackets.map(brk => {
                    const isSelected = editingSelectedRanges.includes(brk.key);
                    return (
                      <button
                        key={brk.id || brk.key}
                        type="button"
                        onClick={() => toggleEditingRange(brk.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-purple-900 text-white shadow-xs ring-1 ring-purple-800'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> : null}
                        {brk.badge && <span>{brk.badge}</span>}
                        <span>{brk.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 1-Click Top Picks Toggle in Edit Modal */}
                <div className="pt-1 flex items-center justify-between border-t border-purple-200/60">
                  <button
                    type="button"
                    onClick={() => toggleEditingRange('Top Picks')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                      editingSelectedRanges.includes('Top Picks')
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-300'
                    }`}
                  >
                    <span>🔥 {editingSelectedRanges.includes('Top Picks') ? 'Featured in Top Picks (Active)' : '+ Add to Top Picks as well'}</span>
                  </button>

                  <span className="text-[10px] text-purple-900 font-mono font-bold">
                    {editingSelectedRanges.join(' + ') || 'None selected'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bracket Modal */}
      {editingBracket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clay-card p-5 max-w-lg w-full space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <h4 className="font-extrabold text-[#2D241E] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-purple-700" />
                <span>Edit Category Bracket ({editingBracket.name})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingBracket(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditBracketSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Bracket Display Title *
                  </label>
                  <input
                    type="text"
                    value={editingBracket.name}
                    onChange={e => setEditingBracket({ ...editingBracket, name: e.target.value })}
                    className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Key Identifier *
                  </label>
                  <input
                    type="text"
                    value={editingBracket.key}
                    onChange={e => setEditingBracket({ ...editingBracket, key: e.target.value })}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Min Deposit (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingBracket.min_amount}
                    onChange={e => setEditingBracket({ ...editingBracket, min_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Max Deposit (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingBracket.max_amount}
                    onChange={e => setEditingBracket({ ...editingBracket, max_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Default Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={editingBracket.default_cashback_rate}
                    onChange={e => setEditingBracket({ ...editingBracket, default_cashback_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Badge Icon
                  </label>
                  <input
                    type="text"
                    value={editingBracket.badge || ''}
                    onChange={e => setEditingBracket({ ...editingBracket, badge: e.target.value })}
                    className="w-full clay-inset px-3 py-2 text-xs font-bold text-center text-[#2D241E] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editingBracket.display_order || 0}
                    onChange={e => setEditingBracket({ ...editingBracket, display_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Highlight Pill Style
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-purple-200 cursor-pointer text-xs font-bold text-purple-950">
                    <input
                      type="checkbox"
                      checked={Boolean(editingBracket.highlight)}
                      onChange={e => setEditingBracket({ ...editingBracket, highlight: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Featured Highlight Glow</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Marketing Description
                </label>
                <input
                  type="text"
                  value={editingBracket.description || ''}
                  onChange={e => setEditingBracket({ ...editingBracket, description: e.target.value })}
                  className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBracket(null)}
                  className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full cursor-pointer shadow-xs"
                >
                  Save Bracket Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
