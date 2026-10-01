import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Monitor, 
  Laptop, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  UserCheck, 
  UserX, 
  Eye, 
  Edit3, 
  Save, 
  Tag, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import { DeviceCluster, DeviceClusterAccount, ClusterStatus, ClusterRiskLevel, MultiAccountAlert } from '../types';
import { useApp } from '../context/AppContext';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

interface AdminDeviceClustersTabProps {
  clusters: DeviceCluster[];
  alerts: MultiAccountAlert[];
  onRefresh: () => void;
  onClusterAction: (clusterId: string, action: string, targetUserId?: string, reason?: string, note?: string) => Promise<boolean>;
}

export const AdminDeviceClustersTab: React.FC<AdminDeviceClustersTabProps> = ({
  clusters,
  alerts,
  onRefresh,
  onClusterAction
}) => {
  const { showToast, switchUser, allUsers } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLAGGED' | 'HIGH_RISK' | 'WHITELISTED'>('ALL');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(clusters[0]?.id || null);
  const [editingNoteClusterId, setEditingNoteClusterId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Statistics calculation
  const totalTracked = clusters.length;
  const flaggedCount = clusters.filter(c => c.status === 'FLAGGED').length;
  const highRiskCount = clusters.filter(c => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').length;
  const whitelistedCount = clusters.filter(c => c.status === 'WHITELISTED').length;
  const totalAccountsUnderReview = clusters
    .filter(c => c.status === 'FLAGGED')
    .reduce((sum, c) => sum + c.account_count, 0);

  // Filter clusters
  const filteredClusters = clusters.filter(cluster => {
    // Status filter
    if (statusFilter === 'FLAGGED' && cluster.status !== 'FLAGGED') return false;
    if (statusFilter === 'HIGH_RISK' && cluster.risk_level !== 'HIGH' && cluster.risk_level !== 'CRITICAL') return false;
    if (statusFilter === 'WHITELISTED' && cluster.status !== 'WHITELISTED') return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesFp = cluster.device_fingerprint.toLowerCase().includes(term);
    const matchesLabel = cluster.device_label.toLowerCase().includes(term);
    const matchesIp = cluster.ip_address.toLowerCase().includes(term);
    const matchesUsers = cluster.associated_users?.some(u => 
      u.email.toLowerCase().includes(term) || 
      u.username.toLowerCase().includes(term)
    );

    return matchesFp || matchesLabel || matchesIp || matchesUsers;
  });

  const handleAction = async (clusterId: string, action: string, targetUserId?: string, reason?: string, note?: string) => {
    setIsProcessing(`${clusterId}_${action}_${targetUserId || ''}`);
    if (action.includes('WHITE') || action.includes('RESTORE')) triggerConfirmSound();
    else if (action.includes('DISMISS') || action.includes('FREEZE') || action.includes('FLAG')) triggerCancelSound();
    else triggerSwitchSound();
    const success = await onClusterAction(clusterId, action, targetUserId, reason, note);
    setIsProcessing(null);
    if (success) {
      if (action.includes('WHITE') || action.includes('RESTORE')) triggerSuccessSound();
      else if (action.includes('DISMISS') || action.includes('FREEZE')) triggerCancelSound();
      if (action === 'ADD_NOTE') {
        setEditingNoteClusterId(null);
      }
    }
  };

  const getRiskBadge = (level: ClusterRiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-md bg-rose-900 text-rose-100 border border-rose-700">Critical Risk</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-md bg-rose-100 text-rose-700 border border-rose-300">High Risk ({clusters.find(c => c.risk_level === 'HIGH')?.account_count || '3+'} Accounts)</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-300">Medium Risk (Shared Device)</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-slate-100 text-slate-700 border border-slate-200">Standard Device</span>;
    }
  };

  const getStatusBadge = (status: ClusterStatus) => {
    switch (status) {
      case 'FLAGGED':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Flagged</span>;
      case 'WHITELISTED':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Whitelisted (Family/Work)</span>;
      case 'DISMISSED':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Dismissed</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Reviewed</span>;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    triggerConfirmSound();
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard.`);
  };

  return (
    <div className="space-y-5">
      
      {/* Flag-Only System Policy Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <span>Strict Flag-Only Multi-Account Engine</span>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-200 text-indigo-800 rounded-md">Policy Guard</span>
            </h3>
            <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
              The automated system tracks hardware canvas & token signatures to detect multi-accounting clusters. In accordance with platform policy, <strong>the system never automatically blocks or restricts accounts</strong>. Administrators review linked accounts below and decide whether to whitelist shared devices (e.g. family members) or ban fraudulent accounts manually.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="fintech-btn-secondary px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Clusters</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Total Devices</span>
            <Monitor className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalTracked}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Hardware signatures</span>
        </div>

        <div className="fintech-card p-4 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold">Flagged Clusters</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 font-mono">{flaggedCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold">{totalAccountsUnderReview} accounts under review</span>
        </div>

        <div className="fintech-card p-4 border-rose-200 bg-rose-50/30">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-bold">High Risk Clusters</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 font-mono">{highRiskCount}</p>
          <span className="text-[10px] text-rose-700 font-semibold">3+ accounts per hardware</span>
        </div>

        <div className="fintech-card p-4 border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold">Whitelisted Shared</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono">{whitelistedCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Approved family/workstations</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('ALL');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap ${
              statusFilter === 'ALL' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({clusters.length})
          </button>
          <button
            type="button"
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('FLAGGED');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'FLAGGED' 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Flagged ({flaggedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('HIGH_RISK');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'HIGH_RISK' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>High Risk ({highRiskCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('WHITELISTED');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'WHITELISTED' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Whitelisted ({whitelistedCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Fingerprint, Email, IP..."
            className="w-full fintech-inset pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Cluster List / Cards */}
      <div className="space-y-4">
        {filteredClusters.length === 0 ? (
          <div className="fintech-card p-12 text-center">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No device clusters match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try changing search keywords or filter options.</p>
          </div>
        ) : (
          filteredClusters.map(cluster => {
            const isExpanded = expandedClusterId === cluster.id;
            const isEditingNote = editingNoteClusterId === cluster.id;

            return (
              <div 
                key={cluster.id} 
                className={`fintech-card overflow-hidden transition-all border ${
                  cluster.risk_level === 'CRITICAL' || cluster.risk_level === 'HIGH'
                    ? 'border-rose-300 bg-rose-50/10'
                    : cluster.status === 'FLAGGED'
                      ? 'border-amber-300 bg-amber-50/10'
                      : cluster.status === 'WHITELISTED'
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                }`}
              >
                {/* Cluster Header Bar */}
                <div 
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      cluster.risk_level === 'HIGH' || cluster.risk_level === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700'
                        : cluster.status === 'FLAGGED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {cluster.device_label.toLowerCase().includes('phone') || cluster.device_label.toLowerCase().includes('android') || cluster.device_label.toLowerCase().includes('iphone') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : cluster.device_label.toLowerCase().includes('mac') || cluster.device_label.toLowerCase().includes('laptop') ? (
                        <Laptop className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-slate-900 font-mono">
                          {cluster.device_label}
                        </h4>
                        {getRiskBadge(cluster.risk_level)}
                        {getStatusBadge(cluster.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <strong className="text-slate-800">{cluster.device_fingerprint}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{cluster.ip_address}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-sans">
                          <Users className="w-3 h-3 text-emerald-600" />
                          <strong className="text-emerald-700 font-bold">{cluster.account_count} Linked Accounts</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedClusterId(isExpanded ? null : cluster.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Cluster Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-4">
                    
                    {/* Reason / System Detection Explanation */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-slate-700">
                          <strong>Detection Signature:</strong> {cluster.flagged_reason}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 shrink-0">
                        First Seen: {new Date(cluster.first_seen_at).toLocaleDateString()} · Last Active: {new Date(cluster.last_seen_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Admin Review Notes */}
                    <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Admin Investigation Notes</span>
                        </span>
                        {!isEditingNote && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteClusterId(cluster.id);
                              setNoteInput(cluster.admin_notes || '');
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                          >
                            Edit Note
                          </button>
                        )}
                      </div>

                      {isEditingNote ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Add administrative review notes regarding this cluster..."
                            className="w-full fintech-inset p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none h-18"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteClusterId(null)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(cluster.id, 'ADD_NOTE', undefined, undefined, noteInput)}
                              className="px-3 py-1 fintech-btn-primary text-xs font-bold rounded-lg flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Note</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 italic">
                          {cluster.admin_notes || 'No review notes added yet.'}
                        </p>
                      )}
                    </div>

                    {/* Associated Accounts Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Accounts Bound to This Device Fingerprint ({cluster.associated_users?.length || 0})</span>
                        </h5>
                        <span className="text-[10px] text-slate-500">Manual review & governance controls</span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">User Details</th>
                              <th className="p-2.5">Email Address</th>
                              <th className="p-2.5 text-right">Vault Balance</th>
                              <th className="p-2.5 text-center">Account Status</th>
                              <th className="p-2.5 text-right">Admin Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {cluster.associated_users?.map(acc => {
                              const isBanned = acc.status === 'Banned';
                              return (
                                <tr key={acc.user_id} className="hover:bg-slate-50/80">
                                  <td className="p-2.5">
                                    <div className="font-bold text-slate-900">{acc.username}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">ID: {acc.user_id}</div>
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-800 font-semibold">
                                    {acc.email}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                    ₹{(acc.vault_balance ?? acc.available_balance ?? 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    {isBanned ? (
                                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-100 text-rose-700 border border-rose-300">
                                        Banned
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isBanned ? (
                                        <button
                                          type="button"
                                          disabled={isProcessing === `${cluster.id}_UNBAN_USER_${acc.user_id}`}
                                          onClick={() => handleAction(cluster.id, 'UNBAN_USER', acc.user_id)}
                                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                                        >
                                          <UserCheck className="w-3 h-3 inline mr-1" />
                                          Unban
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={isProcessing === `${cluster.id}_BAN_USER_${acc.user_id}`}
                                          onClick={() => handleAction(cluster.id, 'BAN_USER', acc.user_id, 'Multi-account violation')}
                                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 cursor-pointer"
                                        >
                                          <UserX className="w-3 h-3 inline mr-1" />
                                          Ban
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const matchedUser = allUsers.find(u => u.id === acc.user_id || u.email === acc.email);
                                          if (matchedUser) {
                                            switchUser(matchedUser.id);
                                            showToast(`Switched active view to ${acc.username}`);
                                          } else {
                                            showToast(`User ${acc.email} active in cluster database.`);
                                          }
                                        }}
                                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                                        title="Switch user / inspect session"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Cluster Level Governance Action Buttons */}
                    <div className="p-3 bg-slate-100/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cluster Governance:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {cluster.status !== 'WHITELISTED' && (
                          <button
                            type="button"
                            disabled={isProcessing === `${cluster.id}_WHITELIST_CLUSTER_`}
                            onClick={() => handleAction(cluster.id, 'WHITELIST_CLUSTER', undefined, undefined, 'Whitelisted by admin as verified shared family/work device.')}
                            className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Whitelist as Shared Family Device</span>
                          </button>
                        )}

                        {cluster.status === 'FLAGGED' && (
                          <button
                            type="button"
                            disabled={isProcessing === `${cluster.id}_DISMISS_CLUSTER_`}
                            onClick={() => handleAction(cluster.id, 'DISMISS_CLUSTER')}
                            className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Dismiss Alert</span>
                          </button>
                        )}

                        {cluster.status !== 'FLAGGED' && (
                          <button
                            type="button"
                            disabled={isProcessing === `${cluster.id}_FLAG_CLUSTER_`}
                            onClick={() => handleAction(cluster.id, 'FLAG_CLUSTER', undefined, undefined, 'Re-flagged for multi-account monitoring')}
                            className="px-3 py-1.5 rounded-xl font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Re-Flag Cluster</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => copyToClipboard(cluster.device_fingerprint, 'Device Fingerprint')}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 border border-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy FP</span>
                        </button>
                      </div>
                    </div>

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
