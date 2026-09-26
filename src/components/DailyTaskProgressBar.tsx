import React from 'react';
import { Flame, Sparkles, CheckCircle2, ArrowRight, Gift, Trophy } from 'lucide-react';
import { Task, TaskCategory } from '../types';

interface DailyTaskProgressBarProps {
  tasks: Task[];
  activeCategory: TaskCategory;
  onSelectCategory: (category: TaskCategory) => void;
}

export const DailyTaskProgressBar: React.FC<DailyTaskProgressBarProps> = ({
  tasks,
  activeCategory,
  onSelectCategory,
}) => {
  const normalizeCat = (c?: string) => {
    const low = (c || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
    if (low.includes('newbie') || low.includes('onboard') || low.includes('starter')) return 'Newbie';
    if (low.includes('team') || low.includes('growth') || low.includes('referral') || low.includes('invite')) return 'Team Growth';
    if (low.includes('daily') || low.includes('recurring')) return 'Daily';
    return c || 'Daily';
  };

  const dailyTasks = tasks.filter(t => t.is_active !== false && normalizeCat(t.category) === 'Daily');
  const totalTasks = dailyTasks.length;
  const completedTasks = dailyTasks.filter(t => t.completed || t.claimed).length;
  const claimedTasks = dailyTasks.filter(t => t.claimed).length;
  const readyToClaimCount = dailyTasks.filter(t => t.completed && !t.claimed).length;

  const totalPoints = dailyTasks.reduce((sum, t) => sum + (t.reward_points || 0), 0);
  const earnedPoints = dailyTasks
    .filter(t => t.claimed)
    .reduce((sum, t) => sum + (t.reward_points || 0), 0);

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAllCompleted = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <div
      id="daily-task-progress-card"
      className="clay-card p-4 space-y-3 bg-gradient-to-br from-white via-[#FAF7F2] to-emerald-50/40 border border-emerald-100/80 shadow-xs"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`clay-icon-box w-9 h-9 flex items-center justify-center flex-shrink-0 ${
            isAllCompleted
              ? 'bg-amber-100 text-amber-800 shadow-xs'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isAllCompleted ? (
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <Flame className="w-4 h-4 stroke-[2.2]" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 tracking-tight">
              Daily Tasks Progress
            </h4>
            <p className="text-[11px] text-slate-500">
              Resets daily at 11:00 PM IST
            </p>
          </div>
        </div>

        {/* Status Chip */}
        <div className="text-right">
          <span
            id="daily-progress-status-badge"
            className={`clay-badge px-2.5 py-0.5 text-[11px] font-extrabold inline-flex items-center gap-1 ${
              isAllCompleted
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : progressPercentage > 0
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {isAllCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>100% Done</span>
              </>
            ) : (
              <>
                <span>{progressPercentage}%</span>
                <span className="text-slate-400 font-normal">({completedTasks}/{totalTasks})</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar Component */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Gift className="w-3 h-3 text-emerald-600" />
            <span>Daily Earnings: <strong className="text-slate-800 font-mono font-bold">₹{earnedPoints}</strong> / ₹{totalPoints}</span>
          </span>
          <span className="font-mono text-slate-800 font-bold">
            {completedTasks} of {totalTasks} tasks
          </span>
        </div>

        {/* The Track and Bar */}
        <div
          id="daily-progress-bar-track"
          className="relative w-full h-2.5 bg-slate-100 rounded-full p-0.5 border border-slate-200/80 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily task completion progress"
        >
          {/* Subtle 50% milestone tick */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300 z-10 pointer-events-none" />

          {/* Fill */}
          <div
            id="daily-progress-bar-fill"
            className="h-full rounded-full transition-all duration-500 ease-out bg-emerald-600 shadow-xs"
            style={{ width: `${Math.max(progressPercentage, totalTasks > 0 ? 3 : 0)}%` }}
          />
        </div>
      </div>

      {/* Footer / Quick Jump action */}
      <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100">
        <span className="text-slate-500">
          {claimedTasks === totalTasks && totalTasks > 0 ? (
            <span className="text-emerald-700 font-bold">All daily bonuses claimed today!</span>
          ) : readyToClaimCount > 0 ? (
            <span className="text-amber-800 font-bold">Rewards waiting to be collected</span>
          ) : (
            <span>Complete tasks to boost daily commission yield</span>
          )}
        </span>

        {activeCategory !== 'Daily' ? (
          <button
            id="switch-to-daily-tasks-btn"
            type="button"
            onClick={() => onSelectCategory('Daily')}
            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>View Daily</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <span className="clay-badge text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-2 py-0.5">
            Viewing Daily
          </span>
        )}
      </div>
    </div>
  );
};
