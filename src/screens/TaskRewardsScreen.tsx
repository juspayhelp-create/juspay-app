import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  TrendingUp,
  Gift,
  X,
  ShieldCheck,
  Check,
  Lock,
  AlertCircle,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskCategory } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const TaskRewardsScreen: React.FC = () => {
  const { 
    tasks, 
    fetchTasks,
    claimTaskReward, 
    setActiveScreen, 
    currentUser, 
    transactions,
    showToast,
    userSubmissions,
    fetchUserTaskSubmissions,
    submitTaskProof
  } = useApp();

  useEffect(() => {
    fetchTasks();
    fetchUserTaskSubmissions();
  }, []);
  
  const normalizeCat = (c?: string): TaskCategory | string => {
    const low = (c || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
    if (low.includes('newbie') || low.includes('onboard') || low.includes('starter')) return 'Newbie';
    if (low.includes('team') || low.includes('growth') || low.includes('referral') || low.includes('invite')) return 'Team Growth';
    if (low.includes('daily') || low.includes('recurring')) return 'Daily';
    return c || 'Daily';
  };

  const [activeCategory, setActiveCategory] = useState<'All' | TaskCategory>('All');
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  // Manual submission state
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofText, setProofText] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Deposit check
  const hasApprovedDeposit = (currentUser.deposit_balance || 0) > 0 || 
    (currentUser.usdt_balance || 0) >= 50 || 
    (currentUser.total_deposit || 0) > 0 ||
    transactions.some(
      t => (t.user_id === currentUser.id || String(t.user_id) === String(currentUser.id)) && 
           (t.type?.toLowerCase().includes('deposit') || t.type?.toLowerCase() === 'crypto') && 
           (t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'approved' || t.status?.toLowerCase() === 'successful')
    );

  const filteredTasks = tasks.filter(t => {
    if (t.is_active === false) return false;
    if (activeCategory === 'All') return true;
    return normalizeCat(t.category) === activeCategory;
  });

  const baseCategories = ['All', 'Newbie', 'Team Growth', 'Daily'];
  const existingCategories = Array.from(new Set(tasks.filter(t => t.is_active !== false).map(t => normalizeCat(t.category)).filter(Boolean)));
  const displayCategoryTabs = Array.from(new Set([...baseCategories, ...existingCategories]));

  const handleSubmitProofClick = async (taskId: string) => {
    if (!proofUrl.trim()) {
      showToast('Please enter a screenshot/proof URL.');
      return;
    }
    triggerConfirmSound();
    setIsSubmittingProof(true);
    try {
      const res = await submitTaskProof(taskId, proofUrl, proofText);
      if (res.success) {
        triggerSuccessSound();
        setSubmittingTaskId(null);
        setProofUrl('');
        setProofText('');
      }
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleActionClick = async (task: (typeof tasks)[0]) => {
    // State 2: Completed & Unclaimed -> Manual Claim
    if (task.completed && !task.claimed) {
      if (claimingTaskId) return;
      triggerConfirmSound();
      setClaimingTaskId(task.id);
      try {
        const res = await claimTaskReward(task.id);
        if (res?.success !== false) {
          triggerSuccessSound();
        }
      } finally {
        setClaimingTaskId(null);
      }
      return;
    }

    // Direct Action Link Handler
    if (task.action_link && task.action_link.trim() && task.verification_type !== 'manual') {
      try {
        const link = task.action_link.trim();
        if (link.startsWith('http://') || link.startsWith('https://')) {
          window.open(link, '_blank');
        } else if (link.startsWith('/')) {
          const screenName = link.replace('/', '');
          if (['home', 'orders', 'payment', 'tool', 'team', 'profile', 'admin', 'deposit', 'withdraw', 'tasks'].includes(screenName)) {
            setActiveScreen(screenName as any);
          } else {
            window.location.href = link;
          }
        }
      } catch (err) {
        console.warn('Action link handler notice:', err);
      }
      return;
    }

    // State 1: Incomplete -> Navigation Prompt
    const type = task.task_type || task.action_type;

    if (type === 'bind_payment' || type === 'bind') {
      setActiveScreen('tool');
    } else if (type === 'deposit') {
      setActiveScreen('deposit');
    } else if (type === 'invite_active' || type === 'invite') {
      setActiveScreen('team');
    } else if (type === 'withdrawal') {
      setActiveScreen('withdraw');
    } else if (type === 'claim_cashback' || type === 'claim' || type === 'trade') {
      if (!hasApprovedDeposit) {
        showToast('Please complete a successful deposit to unlock and claim order rewards.');
      }
      setActiveScreen('payment');
    } else if (task.action_link && task.action_link.trim()) {
      window.open(task.action_link.trim(), '_blank');
    }
  };

  const getActionButton = (task: (typeof tasks)[0]) => {
    const rewardVal = task.reward_amount_inr || task.reward_points;

    // State 3: Claimed (Already Manually Claimed & Credited)
    if (task.claimed) {
      return (
        <span
          id={`task-claimed-badge-${task.id}`}
          className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center gap-1.5 border border-slate-200 select-none shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Claimed (+₹{rewardVal})</span>
        </span>
      );
    }

    // State 2: Completed & Unclaimed -> Manual Claim Button
    if (task.completed) {
      const isClaiming = claimingTaskId === task.id;
      return (
        <button
          id={`task-claim-btn-${task.id}`}
          onClick={() => handleActionClick(task)}
          disabled={isClaiming}
          className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all border border-emerald-500 ring-2 ring-emerald-300/50 animate-pulse"
        >
          <Gift className="w-3.5 h-3.5 text-amber-200 shrink-0" />
          <span>{isClaiming ? 'Claiming...' : `Claim (+₹${rewardVal})`}</span>
        </button>
      );
    }

    // Check manual verification state first
    if (task.verification_type === 'manual') {
      const sub = userSubmissions.find(s => String(s.task_id) === String(task.id));
      if (sub) {
        if (sub.status === 'PENDING') {
          return (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
              Under Review
            </span>
          );
        }
        if (sub.status === 'APPROVED') {
          return (
            <button
              id={`task-claim-approved-btn-${task.id}`}
              onClick={() => handleActionClick(task)}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
            >
              <Gift className="w-3.5 h-3.5 text-amber-200" />
              <span>Claim (+₹{rewardVal})</span>
            </button>
          );
        }
        if (sub.status === 'REJECTED') {
          return (
            <button
              onClick={() => {
                setSubmittingTaskId(task.id);
                setProofUrl(sub.proof_image_url || '');
                setProofText(sub.proof_text || '');
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200 transition-all flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Resubmit Proof</span>
            </button>
          );
        }
      }

      return (
        <button
          onClick={() => {
            setSubmittingTaskId(task.id);
            setProofUrl('');
            setProofText('');
          }}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-full border border-amber-600 flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Submit Proof</span>
        </button>
      );
    }

    // State 1: Incomplete (Pending Action Prompt)
    const type = task.task_type || task.action_type;
    let label = 'Go to Task';
    if (task.action_link && task.action_link.trim()) label = 'Open Task';
    else if (type === 'bind_payment' || type === 'bind') label = 'Go to Bind';
    else if (type === 'deposit') label = 'Deposit Funds';
    else if (type === 'invite_active' || type === 'invite') label = 'Invite Friends';
    else if (type === 'withdrawal') label = 'Withdraw Funds';
    else if (type === 'claim_cashback' || type === 'claim' || type === 'trade') {
      label = !hasApprovedDeposit ? 'Unlock Orders' : 'Claim Orders';
    }

    return (
      <button
        id={`task-action-btn-${task.id}`}
        onClick={() => handleActionClick(task)}
        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-300 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
      >
        {(type === 'claim_cashback' || type === 'claim') && !hasApprovedDeposit && (
          <Lock className="w-3 h-3 text-amber-600 shrink-0" />
        )}
        <span>{label}</span>
        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
      </button>
    );
  };

  const totalActiveTasks = tasks.filter(t => t.is_active !== false).length;
  const totalCompletedTasks = tasks.filter(t => t.is_active !== false && (t.completed || t.claimed)).length;
  const readyToClaimTasks = tasks.filter(t => t.is_active !== false && t.completed && !t.claimed).length;

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      
      {/* Task Center Header Banner */}
      <div className="clay-card-gold p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="clay-icon-box w-11 h-11 bg-white/50 backdrop-blur-md flex items-center justify-center font-bold text-amber-950 shadow-xs">
              <Target className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
                Task Rewards Hub
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-amber-950">
                  {totalCompletedTasks} of {totalActiveTasks} Tasks Done
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {readyToClaimTasks > 0 ? (
              <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-extrabold rounded-full border border-emerald-400 flex items-center gap-1 shadow-xs animate-bounce">
                <Gift className="w-3.5 h-3.5 text-amber-200" />
                <span>{readyToClaimTasks} Ready to Claim</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-300 flex items-center gap-1 shadow-xs">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Rewards</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-amber-900/90 pt-2 border-t border-amber-300/60">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-800" />
            Complete tasks below and tap <strong className="text-amber-950 font-extrabold">Claim</strong> to receive your reward.
          </span>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveScreen('admin')}
              className="text-amber-950 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin: Manage Tasks</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Rewards Guide Banner */}
      <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200 flex items-center gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-xs">
          <Gift className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-extrabold text-emerald-950 block">
            Task Rewards
          </span>
          <p className="text-[11px] text-emerald-800 font-medium leading-tight">
            Complete task objectives and tap the glowing <strong className="font-bold">Claim</strong> button to collect your reward instantly.
          </p>
        </div>
      </div>

      {/* Deposit Now Unlock More tasks Callout if not deposited */}
      {!hasApprovedDeposit && (
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 border border-amber-400">
              <Lock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold text-slate-900 block truncate">
                Deposit Now Unlock More tasks
              </span>
              <p className="text-[10px] text-amber-900 font-medium truncate">
                Complete a quick deposit to unlock full task rewards & 4% daily commission.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveScreen('deposit')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs"
          >
            <span>Deposit Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Tabs: All, Newbie, Team Growth, Daily, & Custom */}
      <div className="clay-inset p-1.5 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
        {displayCategoryTabs.map(cat => {
          const readyCount = tasks.filter(t => t.is_active !== false && (cat === 'All' || normalizeCat(t.category) === cat) && t.completed && !t.claimed).length;
          return (
            <button
              key={cat}
              onClick={() => {
                triggerSwitchSound();
                setActiveCategory(cat as any);
              }}
              className={`py-2 px-3 text-[11px] font-bold rounded-xl transition-all relative flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                activeCategory === cat
                  ? 'bg-white text-emerald-900 shadow-xs border border-[#E8E0D5]'
                  : 'text-[#7A6B5D] hover:text-[#2D241E]'
              }`}
            >
              <span>{cat}</span>
              {readyCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task Cards Feed */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="clay-card p-8 text-center space-y-2">
            <CheckSquare className="w-8 h-8 text-[#A89A8C] mx-auto" />
            <p className="text-xs text-[#8C7A6B] font-semibold">No tasks available in this category.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const targetVal = task.target_count || task.target_amount || 1;
            const progressPercent = Math.min(
              100,
              Math.round(((task.current_progress || 0) / targetVal) * 100)
            );

            const isOrderTask = task.action_type === 'claim' || task.action_type === 'trade' || task.task_type === 'claim_cashback';

            const isReadyToClaim = task.completed && !task.claimed;

            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={`clay-card p-4 transition-all ${
                  task.claimed
                    ? 'bg-slate-50/70 border-slate-200'
                    : isReadyToClaim
                    ? 'bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30 border-emerald-300 shadow-sm ring-1 ring-emerald-400/30'
                    : 'bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="clay-badge px-2 py-0.5 bg-emerald-50 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wider">
                        {task.category}
                      </span>
                      <span className="clay-badge px-2 py-0.5 bg-emerald-50 text-emerald-800 font-extrabold text-[10px] border border-emerald-200">
                        +₹{Number(task.reward_amount_inr || task.reward_points || 0).toLocaleString('en-IN')}
                      </span>
                      {isReadyToClaim && (
                        <span className="clay-badge px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[9px] border border-amber-300 flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                          <span>Ready to Claim</span>
                        </span>
                      )}
                      {isOrderTask && !hasApprovedDeposit && !task.claimed && (
                        <span className="clay-badge px-2 py-0.5 bg-amber-50 text-amber-900 font-extrabold text-[9px] border border-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-700" />
                          <span>Deposit Required</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm mt-1">{task.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex-shrink-0 mt-1">
                    {getActionButton(task)}
                  </div>
                </div>

                {/* Progress Counter & Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>
                      {task.claimed
                        ? 'Status: Claimed'
                        : isReadyToClaim
                        ? 'Target Reached'
                        : 'Progress'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {task.claimed || isReadyToClaim
                        ? `${targetVal} / ${targetVal}`
                        : `${task.current_progress || 0} / ${targetVal}`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        task.claimed
                          ? 'bg-slate-400'
                          : isReadyToClaim
                          ? 'bg-emerald-500 shadow-xs'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${task.claimed || isReadyToClaim ? 100 : progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Manual Proof Submission Inline Form */}
                {submittingTaskId === task.id && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Submit Verification Proof</span>
                      <button
                        onClick={() => {
                          triggerCancelSound();
                          setSubmittingTaskId(null);
                        }}
                        className="text-[10px] font-extrabold text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {task.action_link && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] gap-2">
                        <span className="font-semibold text-blue-950">Complete the task at action link first:</span>
                        <a
                          href={task.action_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 transition-all shrink-0"
                        >
                          <span>Go to Link</span>
                          <span className="font-mono">→</span>
                        </a>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Screenshot / Proof Image URL</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={proofUrl}
                          onChange={e => setProofUrl(e.target.value)}
                          placeholder="e.g. https://imgur.com/your-proof.png"
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setProofUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80')}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-extrabold rounded-lg border border-slate-300 transition-all shrink-0"
                        >
                          Demo Image
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Verification Notes / Username (Optional)</label>
                      <textarea
                        value={proofText}
                        onChange={e => setProofText(e.target.value)}
                        placeholder="Provide your telegram/social username or verification remarks"
                        rows={2}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingProof}
                      onClick={() => handleSubmitProofClick(task.id)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1"
                    >
                      <span>{isSubmittingProof ? 'Submitting Proof...' : 'Submit to Admin Queue'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
