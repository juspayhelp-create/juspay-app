import React, { useMemo } from 'react';
import { 
  Calendar, 
  Coins, 
  TrendingUp, 
  Wallet, 
  ArrowDownLeft, 
  Award,
  Percent,
  Users,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StatisticsScreen: React.FC = () => {
  const { 
    currentUser, 
    allUsers,
    stats, 
    getAffiliateCommissions, 
    setActiveScreen,
    claimableOrders,
    transactions,
    isOrderClaimedByUser
  } = useApp();

  // Calculate user's Level 1, Level 2, and Level 3 referrals count
  const referralCounts = useMemo(() => {
    if (!currentUser || !allUsers || !Array.isArray(allUsers)) {
      return { level1: 0, level2: 0, level3: 0, total: 0 };
    }

    const myCodes = new Set<string>();
    if (currentUser.referral_code) myCodes.add(currentUser.referral_code.toLowerCase().trim());
    if (currentUser.referralCode) myCodes.add(currentUser.referralCode.toLowerCase().trim());
    if (currentUser.id) myCodes.add(String(currentUser.id).toLowerCase().trim());
    if (currentUser.email) myCodes.add(currentUser.email.toLowerCase().trim());
    if (currentUser.username) myCodes.add(currentUser.username.toLowerCase().trim());

    // Level 1 (Direct Referrals)
    const level1Users = allUsers.filter(u => {
      if (u.id === currentUser.id || String(u.id) === String(currentUser.id)) return false;
      const refBy = (u.referred_by || u.referredBy || u.upline_code || u.referrer_id || '').toLowerCase().trim();
      return refBy ? myCodes.has(refBy) || u.referrer_id === currentUser.id : false;
    });

    const level1Keys = new Set<string>();
    level1Users.forEach(u => {
      if (u.id) level1Keys.add(String(u.id).toLowerCase());
      if (u.email) level1Keys.add(u.email.toLowerCase());
      if (u.username) level1Keys.add(u.username.toLowerCase());
      if (u.referral_code) level1Keys.add(u.referral_code.toLowerCase().trim());
      if (u.referralCode) level1Keys.add(u.referralCode.toLowerCase().trim());
    });

    // Level 2 (Tier 2 Referrals)
    const level2Users = allUsers.filter(u => {
      if (u.id === currentUser.id || String(u.id) === String(currentUser.id)) return false;
      if (level1Keys.has(String(u.id).toLowerCase()) || level1Keys.has(u.email?.toLowerCase() || '')) return false;

      const dbL2Code = (u.upline_l2_code || '').toLowerCase().trim();
      if (dbL2Code && myCodes.has(dbL2Code)) return true;

      const refBy = (u.referred_by || u.referredBy || u.upline_code || u.referrer_id || '').toLowerCase().trim();
      if (!refBy) return false;

      return level1Keys.has(refBy);
    });

    const level2Keys = new Set<string>();
    level2Users.forEach(u => {
      if (u.id) level2Keys.add(String(u.id).toLowerCase());
      if (u.email) level2Keys.add(u.email.toLowerCase());
      if (u.username) level2Keys.add(u.username.toLowerCase());
      if (u.referral_code) level2Keys.add(u.referral_code.toLowerCase().trim());
      if (u.referralCode) level2Keys.add(u.referralCode.toLowerCase().trim());
    });

    // Level 3 (Tier 3 Referrals)
    const level3Users = allUsers.filter(u => {
      if (u.id === currentUser.id || String(u.id) === String(currentUser.id)) return false;
      if (level1Keys.has(String(u.id).toLowerCase()) || level1Keys.has(u.email?.toLowerCase() || '')) return false;
      if (level2Keys.has(String(u.id).toLowerCase()) || level2Keys.has(u.email?.toLowerCase() || '')) return false;

      const dbL3Code = (u.upline_l3_code || '').toLowerCase().trim();
      if (dbL3Code && myCodes.has(dbL3Code)) return true;

      const refBy = (u.referred_by || u.referredBy || u.upline_code || u.referrer_id || '').toLowerCase().trim();
      if (!refBy) return false;

      return level2Keys.has(refBy);
    });

    const l1 = level1Users.length;
    const l2 = level2Users.length;
    const l3 = level3Users.length;

    return {
      level1: l1,
      level2: l2,
      level3: l3,
      total: l1 + l2 + l3
    };
  }, [allUsers, currentUser]);

  // Real-time dynamic calculation for Total Cashback Profit:
  // 1. Profit from user's claimed cashback orders
  const activeOrdersCashbackProfit = claimableOrders
    .filter(o => isOrderClaimedByUser(o.id, currentUser.id))
    .reduce((sum, o) => sum + (o.income_inr || (o.amount_inr * (o.cashback_rate || 4)) / 100), 0);

  // 2. Profit from user's historical completed 'Claim' / 'cashback_reward' transactions
  const userCompletedClaims = transactions.filter(
    t => (String(t.user_id) === String(currentUser.id) || (currentUser.email && t.user_email === currentUser.email)) &&
         (t.type === 'Claim' || t.type === 'cashback_reward') &&
         (t.status === 'Completed' || t.status === 'completed' || t.status === 'successful' || t.status === 'approved')
  );

  const historicalClaimsProfit = userCompletedClaims
    .filter(t => !claimableOrders.some(o => (t.order_id && (t.order_id === o.id || t.order_id === o.code)) || (t.notes && t.notes.includes(o.code))))
    .reduce((sum, t) => {
      const match = t.notes?.match(/\+₹([0-9.]+)/);
      if (match) return sum + parseFloat(match[1]);
      return sum + (t.amount_inr || t.amount || 0);
    }, 0);

  const totalCashbackProfit = Number((activeOrdersCashbackProfit + historicalClaimsProfit).toFixed(2));

  // Real-time dynamic calculation for Completed Cashback Tasks count:
  const activeClaimedCount = claimableOrders.filter(o => isOrderClaimedByUser(o.id, currentUser.id)).length;
  const historicalClaimCount = userCompletedClaims.filter(
    t => !claimableOrders.some(o => (t.order_id && (t.order_id === o.id || t.order_id === o.code)) || (t.notes && t.notes.includes(o.code)))
  ).length;
  const totalCompletedCashbackTasks = activeClaimedCount + historicalClaimCount;

  // Real-time formatted date (DD/MM/YYYY)
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <div className="space-y-3.5 pb-24 animate-in fade-in duration-150">
      
      {/* 1. Header with real-time date */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Statistics ({formattedDate})
          </h2>
          <p className="text-xs text-slate-700 font-semibold">Real-time Trading & Commission Metrics</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          <span className="font-mono font-extrabold">{formattedDate}</span>
        </div>
      </div>

      {/* 2. Account Metrics Grid (4 Cards): Balance, Team Referrals, Deposit, Commission */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Balance Card */}
        <div className="fintech-card p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Balance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-extrabold text-slate-900 font-mono block tabular-nums">
              ₹{(currentUser.vault_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-800 block mt-0.5 font-bold">Available for Payout</span>
          </div>
        </div>

        {/* Team Referrals Card */}
        <div 
          onClick={() => setActiveScreen('team')}
          className="fintech-card p-3.5 hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Team Referrals</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-extrabold text-slate-900 font-mono block tabular-nums">
                {referralCounts.total}
              </span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Total Members
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono font-bold">
              <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-200 flex-1 text-center" title="Level 1 Direct Referrals">
                L1: <strong className="text-blue-900">{referralCounts.level1}</strong>
              </span>
              <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-200 flex-1 text-center" title="Level 2 Tier 2 Referrals">
                L2: <strong className="text-purple-900">{referralCounts.level2}</strong>
              </span>
              <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-200 flex-1 text-center" title="Level 3 Tier 3 Referrals">
                L3: <strong className="text-amber-900">{referralCounts.level3}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Deposit Card */}
        <div className="fintech-card p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Deposit</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-200">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-extrabold text-slate-900 font-mono block tabular-nums">
              ₹{currentUser.deposit_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-purple-800 block mt-0.5 font-bold">USDT / INR Inflow</span>
          </div>
        </div>

        {/* Commission Card */}
        <div className="fintech-card p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Commission</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-extrabold text-slate-900 font-mono block tabular-nums">
              ₹{getAffiliateCommissions(currentUser.id).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-800 block mt-0.5 font-bold">Affiliate & Referrals</span>
          </div>
        </div>

      </div>

      {/* 3. LIVE MARKET OPERATIONS Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE MARKET OPERATIONS</span>
          </h3>
          <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Active 24/7
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          
          {/* Total Cashback Profit */}
          <div className="fintech-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Total Cashback Profit</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-base font-extrabold text-slate-900 font-mono block tabular-nums">
                ₹{totalCashbackProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-800 block mt-0.5 font-bold">Realized Cashback Return</span>
            </div>
          </div>

          {/* Completed Cashback Tasks */}
          <div className="fintech-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Completed Cashback Tasks</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-200">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-extrabold text-slate-900 font-mono block tabular-nums">
                  ₹{totalCashbackProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {totalCompletedCashbackTasks} Tasks
                </span>
              </div>
              <span className="text-[10px] text-blue-800 block mt-1 font-bold">Total Profit Made From Tasks</span>
            </div>
          </div>

          {/* Commission Rate */}
          <div className="fintech-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Commission Rate</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-200">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-base font-extrabold text-slate-900 font-mono block tabular-nums">
                {stats.commission_rate.toFixed(2)}%
              </span>
              <span className="text-[10px] text-purple-800 block mt-0.5 font-bold">Standard Return Yield</span>
            </div>
          </div>

          {/* Live Dynamic Rates & Tier Yields */}
          <div className="fintech-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Live Rates & Tiers</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-extrabold text-slate-900 font-mono block tabular-nums">
                  ₹{stats.realtime_exchange_rate} <span className="text-[10px] text-slate-500 font-sans">/ USDT</span>
                </span>
                <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono font-bold">
                <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-200 flex-1 text-center" title="Level 1 Direct Referral Commission Rate">
                  L1: <strong className="text-blue-900">{stats.direct_referral_rate}%</strong>
                </span>
                <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-200 flex-1 text-center" title="Level 2 Tier 2 Referral Commission Rate">
                  L2: <strong className="text-purple-900">{stats.indirect_referral_rate}%</strong>
                </span>
                <span className="bg-slate-50 text-slate-700 px-1 py-0.5 rounded border border-slate-200 flex-1 text-center" title="Level 3 Tier 3 Referral Commission Rate">
                  L3: <strong className="text-amber-900">{stats.level_3_referral_rate ?? 1.0}%</strong>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Exchange Rate Banner */}
      <div 
        onClick={() => setActiveScreen('deposit')}
        className="bg-slate-900 rounded-xl p-3.5 text-white cursor-pointer hover:bg-slate-800 transition-all border border-slate-800 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center border border-slate-700">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Real Time Exchange Rates</span>
              <h3 className="text-sm font-extrabold font-mono text-white tracking-wide">
                1 USDT = {stats.realtime_exchange_rate} INR
              </h3>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg shadow-xs">
            Deposit Now
          </span>
        </div>
      </div>

    </div>
  );
};
