import React, { useState } from 'react';
import { 
  Percent, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
  Coins,
  Flame,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderCategoryRange } from '../types';
import { triggerConfirmSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const PaymentScreen: React.FC = () => {
  const { 
    currentUser, 
    claimableOrders, 
    claimOrder, 
    stats,
    transactions,
    getCumulativeApprovedDeposits,
    isOrderClaimedByUser,
    setActiveScreen,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<OrderCategoryRange | 'All'>('Top Picks');

  // Filter orders by active status first, then by active range tab
  const activeOffers = claimableOrders.filter(order => order.is_active !== false);

  const filteredOrders = activeTab === 'All' 
    ? activeOffers 
    : activeOffers.filter(order => order.category_range === activeTab);

  // Check cumulative approved deposits (strict deposit-only qualification)
  const cumulativeDeposits = getCumulativeApprovedDeposits(currentUser.id);
  const hasApprovedDeposit = cumulativeDeposits > 0;

  // Calculate user total rewards earned
  const totalRewards = (currentUser.total_rewards && currentUser.total_rewards > 0)
    ? currentUser.total_rewards
    : transactions
        .filter(t => (t.user_id === currentUser.id || t.userId === currentUser.id) && (t.type === 'Claim' || t.type === 'cashback_reward' || t.type === 'Reward' || t.type === 'Binding Bonus'))
        .reduce((acc, curr) => acc + (curr.amount || curr.amount_inr || 0), 0);

  const pendingWithdrawal = transactions
    .filter(t => (t.user_id === currentUser.id || t.userId === currentUser.id) && t.type === 'Withdrawal' && t.status === 'Pending')
    .reduce((acc, curr) => acc + (curr.amount || curr.amount_inr || 0), 0);

  const handleClaimClick = (orderId: string, minRequired: number, income: number) => {
    if (!hasApprovedDeposit) {
      showToast('Eligibility requires approved deposit transactions. Other balances or withdrawals do not qualify.');
      setActiveScreen('deposit');
      return;
    }
    if (cumulativeDeposits < minRequired) {
      showToast(`Requires cumulative approved deposits of ₹${minRequired.toLocaleString('en-IN')}. Your approved deposits: ₹${cumulativeDeposits.toLocaleString('en-IN')}.`);
      return;
    }
    triggerConfirmSound();
    const res = claimOrder(orderId, income);
    if (res?.success) {
      triggerSuccessSound();
    }
  };

  const rangeTabs: { label: string; value: OrderCategoryRange | 'All'; highlight?: boolean }[] = [
    { label: '🔥 Top Picks', value: 'Top Picks', highlight: true },
    { label: '₹100 - ₹300', value: '100-300' },
    { label: '₹301 - ₹500', value: '301-500' },
    { label: '₹501 - ₹2,000', value: '501-2000' },
    { label: '₹2,001 - ₹5,000', value: '2001-5000' },
    { label: '₹5,001 - ₹15,000', value: '5001-15000' },
    { label: '💎 ₹15,001 - ₹50,000', value: '15001-50000', highlight: true },
    { label: 'All Tiers', value: 'All' },
  ];

  return (
    <div className="space-y-3.5 pb-24 animate-in fade-in duration-150">
      
      {/* 1. Hero Card: Cashback %, Balance, Total Rewards, Pending */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200">
              <Percent className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 block">Deposit Cashback</span>
              <span className="block text-[10px] text-emerald-800 font-bold">Ranges up to ₹50,000 INR • Auto-Settlement</span>
            </div>
          </div>

          <div className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-xs border border-emerald-700">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>{stats.commission_rate.toFixed(2)}% Cashback</span>
          </div>
        </div>

        {/* 3 Metric Summary Blocks */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-center">
            <span className="text-[10px] text-slate-700 font-bold block truncate uppercase">Balance</span>
            <strong className="text-xs font-extrabold font-mono text-slate-900 block mt-0.5">
              ₹{(currentUser.vault_balance ?? 0).toFixed(0)}
            </strong>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-center">
            <span className="text-[10px] text-emerald-900 font-bold block truncate uppercase">Total Rewards</span>
            <strong className="text-xs font-extrabold font-mono text-emerald-950 block mt-0.5">
              ₹{totalRewards.toFixed(0)}
            </strong>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-center">
            <span className="text-[10px] text-amber-900 font-bold block truncate uppercase">Pending</span>
            <strong className="text-xs font-extrabold font-mono text-amber-950 block mt-0.5">
              ₹{pendingWithdrawal.toFixed(0)}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Deposit Requirement Warning / Status Callout */}
      {!hasApprovedDeposit ? (
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 space-y-2.5 shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs font-extrabold border border-amber-400">
              <Lock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-xs text-amber-950 leading-snug flex-1">
              <strong className="block text-slate-900 font-extrabold">
                Deposit Required to Unlock 4% Cashback Rewards
              </strong>
              <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                Complete at least one approved deposit via USDT to unlock instant order claiming and balance settlement across all tiers up to ₹50,000.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveScreen('deposit')}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Complete a Deposit Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Unlocked Active Notice */
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-emerald-950 leading-tight space-y-0.5">
            <span className="font-extrabold block text-emerald-950">
              Rewards Unlocked • High-Volume Tiers Active (₹100 - ₹50,000)
            </span>
            <p className="text-emerald-900 font-medium text-[10px]">
              Orders are matched automatically to your account. 4% cashback and 5% direct commission are distributed instantly upon claim.
            </p>
          </div>
        </div>
      )}

      {/* 3. Horizontal Pill Filter Tabs (Expanded up to ₹50,000) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-600">
          <span>Filter Order Cashback Brackets</span>
          <span className="text-[10px] text-emerald-700 font-extrabold font-mono">
            {filteredOrders.filter(o => !isOrderClaimedByUser(o.id, currentUser.id)).length} Available Offers
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
          {rangeTabs.map(tab => {
            const isSelected = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  triggerSwitchSound();
                  setActiveTab(tab.value);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs border border-slate-900 ring-1 ring-slate-900'
                    : tab.highlight
                    ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-white text-slate-700 hover:text-slate-950 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Claim Feed Cards */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="fintech-card p-10 text-center text-slate-600">
            <Sparkles className="w-8 h-8 mx-auto text-emerald-600 mb-2 animate-bounce" />
            <p className="text-xs font-extrabold text-slate-900">No orders available in this bracket!</p>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">Switch brackets above or check back for new batches.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const rate = order.cashback_rate || stats.commission_rate;
            const minRequired = order.min_deposit_required || order.amount_inr;
            const isUnlocked = hasApprovedDeposit && cumulativeDeposits >= minRequired;
            const isClaimed = isOrderClaimedByUser(order.id, currentUser.id);

            return (
              <div
                key={order.id}
                className={`fintech-card p-3.5 transition-all duration-150 ${
                  isClaimed
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : !isUnlocked
                    ? 'hover:border-amber-300 bg-amber-50/20'
                    : 'hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  
                  {/* Code & Range Badge */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-mono font-bold text-xs rounded border border-slate-300">
                        {order.code}
                      </span>
                      <span className="text-[10px] text-emerald-900 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        {rate}% Cashback
                      </span>
                      <span className="text-[9px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {order.category_range}
                      </span>
                      {!isUnlocked && !isClaimed && (
                        <span className="text-[9px] text-amber-900 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5 text-amber-800" />
                          <span>Req. Dep: ₹{minRequired.toLocaleString('en-IN')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-lg font-extrabold text-slate-900 font-mono">
                        ₹{order.amount_inr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-emerald-800">
                        Income: <strong className="font-mono text-sm text-emerald-900">+₹{order.income_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Claim CTA Button */}
                  <div>
                    {isClaimed ? (
                      <button
                        disabled
                        className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 bg-emerald-100/90 px-3.5 py-2 rounded-lg border border-emerald-300 opacity-90 cursor-not-allowed select-none shadow-xs"
                        title="Cashback already claimed for this order"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span>Claimed</span>
                      </button>
                    ) : !isUnlocked ? (
                      <button
                        onClick={() => handleClaimClick(order.id, minRequired, order.income_inr)}
                        className="px-3.5 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all active:scale-95"
                        title="Deposit threshold required to unlock"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-800" />
                        <span>Unlock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaimClick(order.id, minRequired, order.income_inr)}
                        className="fintech-btn-emerald px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Claim</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Order bottom details */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>Cumulative Dep: ₹{cumulativeDeposits.toLocaleString('en-IN')} (Req: ₹{minRequired.toLocaleString('en-IN')})</span>
                  </span>
                  <span className="font-extrabold text-purple-800">
                    +5% Affiliate auto-credited
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
