import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  ExternalLink, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  FileText, 
  Calendar, 
  MapPin, 
  Phone, 
  CreditCard, 
  User, 
  Mail,
  Download,
  AlertTriangle
} from 'lucide-react';
import { KycVerification } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

interface AdminKycTabProps {
  onStatusChange?: () => void;
  showToast: (msg: string) => void;
}

export const AdminKycTab: React.FC<AdminKycTabProps> = ({ onStatusChange, showToast }) => {
  const [verifications, setVerifications] = useState<KycVerification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  // Review Modal State
  const [selectedKyc, setSelectedKyc] = useState<KycVerification | null>(null);
  
  // Rejection Reason Modal State
  const [rejectingKycId, setRejectingKycId] = useState<string | number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Document image is blurry or unreadable. Please provide a clear, full photo.');
  const [customReason, setCustomReason] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Fullscreen Image Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchKycList = async () => {
    try {
      setIsLoading(true);
      const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
      const res = await fetch('/api/admin/kyc/list', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
          'x-admin-token': adminToken
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.verifications)) {
          setVerifications(data.verifications);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch KYC verification list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, []);

  const handleReviewAction = async (id: string | number, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    setIsProcessingAction(true);
    if (status === 'VERIFIED') triggerConfirmSound();
    else triggerCancelSound();
    try {
      const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
      const res = await fetch(`/api/admin/kyc/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
          'x-admin-token': adminToken
        },
        body: JSON.stringify({
          status,
          rejection_reason: reason || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (status === 'VERIFIED') triggerSuccessSound();
        else triggerCancelSound();
        showToast(status === 'VERIFIED' ? 'KYC verified & approved successfully!' : 'KYC rejected with notification sent.');
        // Update local state immediately
        setVerifications(prev => prev.map(k => {
          if (String(k.id) === String(id)) {
            return {
              ...k,
              status,
              rejection_reason: status === 'REJECTED' ? (reason || 'Rejected') : undefined
            };
          }
          return k;
        }));

        if (selectedKyc && String(selectedKyc.id) === String(id)) {
          setSelectedKyc(prev => prev ? {
            ...prev,
            status,
            rejection_reason: status === 'REJECTED' ? (reason || 'Rejected') : undefined
          } : null);
        }

        setRejectingKycId(null);
        setCustomReason('');
        if (onStatusChange) onStatusChange();
      } else {
        showToast(data.message || data.error || 'Failed to update KYC status.');
      }
    } catch (err) {
      console.error('Error updating KYC status:', err);
      showToast('Network error while reviewing KYC.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const openRejectModal = (id: string | number) => {
    setRejectingKycId(id);
    setRejectionReason('Document image is blurry or unreadable. Please provide a clear, full photo.');
    setCustomReason('');
  };

  const confirmRejection = () => {
    if (!rejectingKycId) return;
    const finalReason = customReason.trim() ? customReason.trim() : rejectionReason;
    handleReviewAction(rejectingKycId, 'REJECTED', finalReason);
  };

  // Filter & Search Logic
  const filteredList = verifications.filter(item => {
    const statusUpper = (item.status || 'PENDING').toUpperCase();
    const matchesFilter = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'VERIFIED' ? (statusUpper === 'VERIFIED' || statusUpper === 'APPROVED') :
      statusUpper === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;

    const matchesQuery = 
      String(item.user_id).includes(q) ||
      (item.user_email && item.user_email.toLowerCase().includes(q)) ||
      (item.full_name && item.full_name.toLowerCase().includes(q)) ||
      (item.document_number && item.document_number.toLowerCase().includes(q)) ||
      (item.state && item.state.toLowerCase().includes(q)) ||
      (item.document_type && item.document_type.toLowerCase().includes(q));

    return matchesFilter && matchesQuery;
  });

  const pendingCount = verifications.filter(k => (k.status || '').toUpperCase() === 'PENDING').length;
  const verifiedCount = verifications.filter(k => (k.status || '').toUpperCase() === 'VERIFIED' || (k.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = verifications.filter(k => (k.status || '').toUpperCase() === 'REJECTED').length;

  return (
    <div className="space-y-4">
      
      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="clay-card p-3 bg-white border border-slate-200">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Submissions</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{verifications.length}</span>
        </div>

        <div className="clay-card p-3 bg-amber-50/80 border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">{pendingCount}</span>
        </div>

        <div className="clay-card p-3 bg-emerald-50/80 border border-emerald-200">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Verified & Approved</span>
          <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">{verifiedCount}</span>
        </div>

        <div className="clay-card p-3 bg-rose-50/80 border border-rose-200">
          <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">Rejected</span>
          <span className="text-xl font-black text-rose-900 font-mono mt-0.5 block">{rejectedCount}</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="clay-card p-3.5 bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search UID, Email, Name, ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* STATUS PILLS */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({verifications.length})
          </button>
          <button
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('PENDING');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">{pendingCount}</span>
          </button>
          <button
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('VERIFIED');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => {
              triggerSwitchSound();
              setStatusFilter('REJECTED');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Rejected ({rejectedCount})
          </button>

          <button
            onClick={fetchKycList}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 ml-auto shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="clay-card overflow-hidden bg-white border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-3">User UID / Email</th>
                <th className="px-3.5 py-3">Full Name (ID)</th>
                <th className="px-3.5 py-3">Document Type & Number</th>
                <th className="px-3.5 py-3">State & Mobile</th>
                <th className="px-3.5 py-3">Uploaded Proofs</th>
                <th className="px-3.5 py-3">Submission Date</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading Identity KYC Submissions...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="font-bold text-slate-700 block">No KYC submissions found</span>
                    <span className="text-xs text-slate-400">
                      {statusFilter !== 'ALL' ? `No submissions with status ${statusFilter}` : 'Submissions will appear here once users upload their IDs'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const statusUpper = (item.status || 'PENDING').toUpperCase();
                  const isItemVerified = statusUpper === 'VERIFIED' || statusUpper === 'APPROVED';
                  const isItemPending = statusUpper === 'PENDING';
                  const isItemRejected = statusUpper === 'REJECTED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* USER UID / EMAIL */}
                      <td className="px-3.5 py-3">
                        <div className="font-mono font-black text-slate-900">
                          #{item.user_id}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]" title={item.user_email}>
                          {item.user_email || 'No email'}
                        </div>
                      </td>

                      {/* FULL NAME */}
                      <td className="px-3.5 py-3 font-bold text-slate-900">
                        {item.full_name}
                        {item.dob && (
                          <div className="text-[10px] text-slate-400 font-normal font-mono">
                            DOB: {item.dob}
                          </div>
                        )}
                      </td>

                      {/* DOCUMENT TYPE & NUMBER */}
                      <td className="px-3.5 py-3">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {item.document_type}
                        </span>
                        <div className="font-mono text-xs font-extrabold text-slate-900 mt-0.5">
                          {item.document_number}
                        </div>
                      </td>

                      {/* STATE & MOBILE */}
                      <td className="px-3.5 py-3">
                        <div className="text-slate-800 font-medium">{item.state}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.mobile_number ? `+91 ${item.mobile_number}` : ''} {item.pincode ? `(${item.pincode})` : ''}
                        </div>
                      </td>

                      {/* UPLOADED PROOFS */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          {item.front_image_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(item.front_image_url)}
                              className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center hover:opacity-80 transition-all shrink-0 cursor-pointer"
                              title="Click to view Front Proof"
                            >
                              {item.front_image_url.endsWith('.pdf') ? (
                                <span className="text-[9px] font-bold text-rose-600">PDF</span>
                              ) : (
                                <img src={item.front_image_url} alt="Front" className="w-full h-full object-cover" />
                              )}
                            </button>
                          )}
                          {item.back_image_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(item.back_image_url!)}
                              className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center hover:opacity-80 transition-all shrink-0 cursor-pointer"
                              title="Click to view Back Proof"
                            >
                              {item.back_image_url.endsWith('.pdf') ? (
                                <span className="text-[9px] font-bold text-rose-600">PDF</span>
                              ) : (
                                <img src={item.back_image_url} alt="Back" className="w-full h-full object-cover" />
                              )}
                            </button>
                          )}
                          {!item.front_image_url && !item.back_image_url && (
                            <span className="text-[10px] text-slate-400">None</span>
                          )}
                        </div>
                      </td>

                      {/* SUBMISSION DATE */}
                      <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>

                      {/* STATUS */}
                      <td className="px-3.5 py-3">
                        {isItemVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            VERIFIED
                          </span>
                        ) : isItemPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            PENDING
                          </span>
                        ) : (
                          <div title={item.rejection_reason || 'Rejected'}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              REJECTED
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Review Details Modal Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedKyc(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick 1-Click Approve */}
                          {!isItemVerified && (
                            <button
                              type="button"
                              onClick={() => handleReviewAction(item.id, 'VERIFIED')}
                              disabled={isProcessingAction}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                              title="Approve / Mark Verified"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Quick Reject Button */}
                          {!isItemRejected && (
                            <button
                              type="button"
                              onClick={() => openRejectModal(item.id)}
                              disabled={isProcessingAction}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                              title="Reject Verification"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL REVIEW SIDE-BY-SIDE MODAL */}
      {selectedKyc && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedKyc(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold">KYC Verification Audit Details</h3>
                <span className="font-mono text-xs text-slate-400">#UID {selectedKyc.user_id}</span>
              </div>
              <button 
                onClick={() => setSelectedKyc(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* LEFT: ENTERED USER DETAILS */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <User className="w-4 h-4 text-emerald-600" />
                    Government Identity Profile
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Full Name as per ID</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedKyc.full_name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Date of Birth</span>
                        <span className="font-mono font-bold text-slate-800">{selectedKyc.dob}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Mobile Number</span>
                        <span className="font-mono font-bold text-slate-800">+91 {selectedKyc.mobile_number || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Document Type & Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          {selectedKyc.document_type}
                        </span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {selectedKyc.document_number}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Residential Address</span>
                      <p className="text-slate-800 font-medium bg-white p-2 rounded-lg border border-slate-200 mt-0.5">
                        {selectedKyc.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">State / Territory</span>
                        <span className="font-bold text-slate-800">{selectedKyc.state}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">PIN Code</span>
                        <span className="font-mono font-bold text-slate-800">{selectedKyc.pincode}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">User Email</span>
                      <span className="text-slate-700 font-mono text-xs">{selectedKyc.user_email || 'N/A'}</span>
                    </div>

                    {selectedKyc.rejection_reason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 mt-2">
                        <span className="font-bold block text-[10px] uppercase">Rejection Reason:</span>
                        <p className="text-xs mt-0.5">{selectedKyc.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: CLICKABLE PROOFS (FRONT & BACK) */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Uploaded Proof Documents
                  </h4>

                  <div className="space-y-4 flex-1">
                    
                    {/* FRONT PROOF */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Front Document Image / Bio Page
                      </span>
                      {selectedKyc.front_image_url ? (
                        <div 
                          onClick={() => setLightboxUrl(selectedKyc.front_image_url)}
                          className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white p-2 hover:border-emerald-500 transition-all cursor-pointer group overflow-hidden max-h-48 flex items-center justify-center"
                        >
                          {selectedKyc.front_image_url.endsWith('.pdf') ? (
                            <a 
                              href={selectedKyc.front_image_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-6 flex flex-col items-center text-rose-600"
                              onClick={e => e.stopPropagation()}
                            >
                              <FileText className="w-10 h-10 mb-1" />
                              <span className="text-xs font-bold">Open PDF Document</span>
                            </a>
                          ) : (
                            <>
                              <img 
                                src={selectedKyc.front_image_url} 
                                alt="Front Document" 
                                className="max-h-44 object-contain rounded"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" /> Click to enlarge
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-100 text-slate-400 text-center text-xs">
                          No front image provided
                        </div>
                      )}
                    </div>

                    {/* BACK PROOF (IF APPLICABLE) */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Back Document Image / Address Page
                      </span>
                      {selectedKyc.back_image_url ? (
                        <div 
                          onClick={() => setLightboxUrl(selectedKyc.back_image_url!)}
                          className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white p-2 hover:border-emerald-500 transition-all cursor-pointer group overflow-hidden max-h-48 flex items-center justify-center"
                        >
                          {selectedKyc.back_image_url.endsWith('.pdf') ? (
                            <a 
                              href={selectedKyc.back_image_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-6 flex flex-col items-center text-rose-600"
                              onClick={e => e.stopPropagation()}
                            >
                              <FileText className="w-10 h-10 mb-1" />
                              <span className="text-xs font-bold">Open PDF Document</span>
                            </a>
                          ) : (
                            <>
                              <img 
                                src={selectedKyc.back_image_url} 
                                alt="Back Document" 
                                className="max-h-44 object-contain rounded"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" /> Click to enlarge
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-100 text-slate-400 text-center text-xs">
                          {selectedKyc.document_type === 'PAN Card' || selectedKyc.document_type === 'Driving License'
                            ? 'Single-sided document (No back page required)'
                            : 'No back image provided'}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* MODAL FOOTER CONTROLS */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                  (selectedKyc.status || '').toUpperCase() === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : (selectedKyc.status || '').toUpperCase() === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedKyc.status || 'PENDING'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRejectModal(selectedKyc.id)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject KYC</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewAction(selectedKyc.id, 'VERIFIED')}
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve KYC (Mark Verified)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT MODAL */}
      {rejectingKycId && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setRejectingKycId(null)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Reject KYC Submission
              </div>
              <button 
                onClick={() => setRejectingKycId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please specify the rejection reason. This will be shown to the user on their profile KYC card so they can re-apply correctly.
            </p>

            {/* PRESET REASONS */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Select Standard Reason:</span>
              {[
                'Document image is blurry or unreadable. Please provide a clear, full photo.',
                'Full Name does not match the government ID record.',
                'Invalid or expired document details provided.',
                'Back side / address page of ID is missing or incomplete.',
                'Document number does not match standard Indian format.'
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRejectionReason(preset);
                    setCustomReason('');
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all border ${
                    rejectionReason === preset && !customReason
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* CUSTOM REASON */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Or Custom Reason:
              </span>
              <textarea
                rows={2}
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Type custom rejection note..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingKycId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejection}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all"
              >
                {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-2 text-white">
              <span className="text-xs font-bold">Screenshot High-Res View</span>
              <div className="flex items-center gap-2">
                <a 
                  href={lightboxUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Original</span>
                </a>
                <button 
                  onClick={() => setLightboxUrl(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/50 rounded-xl max-h-[80vh] overflow-auto">
              <img src={lightboxUrl} alt="Enlarged Document" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
