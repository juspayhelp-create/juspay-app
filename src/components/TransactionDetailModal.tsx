import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Gift,
  Coins,
  Wallet,
  Building2,
  FileText,
  Headphones,
  Maximize2
} from 'lucide-react';
import { Transaction } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound } from '../utils/haptics';
import { useApp } from '../context/AppContext';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const { setActiveScreen, stats, showToast } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isReceiptExpanded, setIsReceiptExpanded] = useState(false);

  if (!isOpen || !transaction) return null;

  // Type normalization - Strictly only Deposits and Withdrawals
  const rawType = String(transaction.type || '').toLowerCase();
  const isDeposit = rawType.includes('deposit');
  const isWithdrawal = rawType.includes('withdraw');

  // Do not show modal for Registration Bonus, Rewards, Task Points, Claims, etc.
  if (!isDeposit && !isWithdrawal) return null;

  const handleCopy = (text: string, label: string, key: string) => {
    triggerSwitchSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClose = () => {
    triggerCancelSound();
    onClose();
  };

  const handleContactSupport = () => {
    triggerConfirmSound();
    onClose();
    setActiveScreen('service');
  };

  // Status normalization
  const rawStatus = String(transaction.status || '').toLowerCase();
  const isCompleted = ['completed', 'approved', 'settled', 'successful', 'success'].includes(rawStatus);
  const isRejected = ['rejected', 'failed', 'declined', 'cancelled'].includes(rawStatus);
  const isPending = !isCompleted && !isRejected;

  // Format localized date and time
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // Order identifier
  const orderId = transaction.order_id || transaction.tx_id || transaction.id || 'N/A';
  const displayId = String(orderId).replace(/^DEP-|^WTH-/, '');
  const referenceNo = transaction.utr_number || transaction.tx_hash || transaction.tx_id || '';

  // Amounts
  const grossAmountInr = Number(transaction.amount || transaction.amount_inr || 0);
  const withdrawFee = isWithdrawal ? Number(transaction.fee ?? transaction.withdrawal_fee ?? stats.withdraw_fee ?? 500) : 0;
  const netAmountInr = isWithdrawal ? Math.max(0, grossAmountInr - withdrawFee) : grossAmountInr;
  const usdtAmount = transaction.amount_usdt ? Number(transaction.amount_usdt) : Number((grossAmountInr / (stats.realtime_exchange_rate || 111)).toFixed(2));

  // Payment channel / details
  const paymentMethod = transaction.payment_method || transaction.deposit_method || (isDeposit ? 'USDT Crypto' : isWithdrawal ? 'Bank IMPS Payout' : 'Vault Settlement');
  const accountDetails = transaction.account_details || transaction.payment_details || transaction.destination_details || (isDeposit ? `${transaction.network || 'TRC20'} Blockchain` : 'Registered Payout Account');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          {/* Top Bar / Drag Handle for Mobile */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                  isDeposit
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isDeposit ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  {isDeposit ? 'Deposit Details' : 'Withdrawal Details'}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Order #{displayId}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Amount & Status Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white text-center space-y-2 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                {isWithdrawal ? 'Total Withdrawal Requested' : 'Total Settlement Amount'}
              </span>

              <div className="flex items-baseline justify-center gap-1.5 font-mono">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  ₹{grossAmountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {usdtAmount > 0 && (
                <div className="text-[11px] font-mono text-emerald-400 font-bold">
                  ≈ {usdtAmount.toFixed(2)} USDT (Rate: ₹{stats.realtime_exchange_rate || 111}/USDT)
                </div>
              )}

              {/* Status Badge */}
              <div className="pt-2 flex justify-center">
                {isCompleted ? (
                  <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed & Settled</span>
                  </div>
                ) : isRejected ? (
                  <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rejected / Failed</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Processing & Under Verification</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Alert Banner (if applicable) */}
            {isRejected && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Settlement Rejection Notice</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  <strong>Reason:</strong> {transaction.rejection_reason || transaction.admin_remarks || transaction.notes || 'Verification mismatch or unconfirmed blockchain hash.'}
                </p>
                <p className="text-[10px] text-rose-600 pt-0.5">
                  Your funds are secure. If you believe this is an error, please contact our 24/7 Support Desk below.
                </p>
              </div>
            )}

            {/* Processing SLA Banner (if applicable) */}
            {isPending && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold">24/7 SLA Resolution in Progress:</span> Your transaction has been received and queued for automated clearing. Average verification time is under 15 minutes.
                </div>
              </div>
            )}

            {/* Detailed Metadata Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Transaction Metadata</span>
              </h4>

              {/* Order ID */}
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium">Transaction Reference:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 text-[11px]">{orderId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(orderId, 'Order Reference ID', 'order_id')}
                    className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer transition-all"
                    title="Copy Order ID"
                  >
                    {copiedKey === 'order_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Submission Timestamp:</span>
                <span className="font-semibold text-slate-800 text-[11px]">
                  {formatDateTime(transaction.created_at || transaction.createdAt || transaction.timestamp)}
                </span>
              </div>

              {/* Payment Channel / Method */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Payment Channel:</span>
                <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                  {isDeposit ? <Coins className="w-3 h-3 text-emerald-600" /> : <Building2 className="w-3 h-3 text-blue-600" />}
                  <span>{paymentMethod}</span>
                </span>
              </div>

              {/* Target Destination / Account Details */}
              <div className="flex items-start justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium shrink-0 pr-2">Destination / Account:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] text-right break-all max-w-[240px]">
                  {accountDetails}
                </span>
              </div>

              {/* UTR / Blockchain TxID / Hash / Bank UTR */}
              {isDeposit ? (
                referenceNo ? (
                  <div className="flex items-start justify-between py-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium shrink-0 pr-2">
                      TxHash / UTR:
                    </span>
                    <div className="flex items-center gap-1.5 max-w-[220px]">
                      <span className="font-mono text-slate-900 text-[10px] break-all bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {referenceNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(referenceNo, 'Transaction Hash / UTR', 'tx_hash')}
                        className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer shrink-0 transition-all"
                        title="Copy Hash / UTR"
                      >
                        {copiedKey === 'tx_hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ) : null
              ) : (
                /* Withdrawal Bank UTR / Ref row */
                <div className="flex items-start justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium shrink-0 pr-2">
                    Bank UTR / Ref:
                  </span>
                  <div className="flex items-center gap-1.5 max-w-[220px]">
                    {transaction.bank_utr ? (
                      <>
                        <span className="font-mono font-bold text-[10px] break-all bg-white px-1.5 py-0.5 rounded border border-slate-200 text-emerald-700">
                          {transaction.bank_utr}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(transaction.bank_utr!, 'Bank UTR', 'bank_utr')}
                          className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer shrink-0 transition-all"
                          title="Copy Bank UTR"
                        >
                          {copiedKey === 'bank_utr' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </>
                    ) : isPending ? (
                      <span className="font-mono text-amber-700 text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Pending Clearance
                      </span>
                    ) : referenceNo ? (
                      <>
                        <span className="font-mono text-slate-900 text-[10px] break-all bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {referenceNo}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(referenceNo, 'Reference Number', 'tx_hash')}
                          className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer shrink-0 transition-all"
                          title="Copy Reference"
                        >
                          {copiedKey === 'tx_hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </>
                    ) : (
                      <span className="font-mono text-slate-400 text-[10px]">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Network */}
              {transaction.network && (
                <div className="flex items-center justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Blockchain Network:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200 font-mono">
                    {transaction.network}
                  </span>
                </div>
              )}
            </div>

            {/* Financial Settlement Breakdown (for withdrawals and fee calculations) */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <Wallet className="w-3.5 h-3.5 text-slate-600" />
                <span>Settlement Breakdown</span>
              </h4>

              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Gross Settlement Request:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{grossAmountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isWithdrawal && (
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>Institutional Processing Fee:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -₹{withdrawFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-t border-slate-200 text-slate-900 font-extrabold text-sm">
                <span>Net Disbursed / Credited:</span>
                <span className="font-mono text-emerald-700">
                  ₹{netAmountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Attached Proof Receipt (if available) */}
            {(transaction.screenshot_base64 || transaction.proof_screenshot) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Transfer Receipt Screenshot</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReceiptExpanded(!isReceiptExpanded)}
                    className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isReceiptExpanded ? 'Collapse' : 'Expand'}</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={transaction.screenshot_base64 || transaction.proof_screenshot}
                    alt="Payment Receipt"
                    className={`w-full object-contain transition-all ${
                      isReceiptExpanded ? 'max-h-96' : 'max-h-36'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Security Guarantee Note */}
            <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2 border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Protected by 256-bit Institutional Ledger Authentication & Automated Payout Rails.
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleContactSupport}
              className="w-full sm:flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span>Need Help? Contact Support</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:flex-1 fintech-btn-emerald py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <span>Done</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
