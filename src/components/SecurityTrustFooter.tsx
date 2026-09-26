import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const SecurityTrustFooter: React.FC = () => {
  return (
    <div className="mt-6 pt-3 pb-2 border-t border-slate-200/80 space-y-2">
      {/* Security Trust Ticks Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate text-slate-800 font-semibold">256-Bit SSL Protection</span>
        </div>

        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate text-slate-800 font-semibold">100% Backed Reserve</span>
        </div>

        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate text-slate-800 font-semibold">Multi-Sig Cold Custody</span>
        </div>

        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate text-slate-800 font-semibold">Instant Settlement API</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityTrustFooter;
