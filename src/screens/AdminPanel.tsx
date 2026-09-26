import React, { useState, useEffect } from 'react';
import { formatISTTimestamp } from '../utils/time';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Wallet, 
  ArrowLeft, 
  Mail, 
  Coins, 
  DollarSign, 
  Lock, 
  Check, 
  AlertTriangle, 
  Eye, 
  TrendingUp, 
  Percent,
  Search,
  UserCheck,
  UserX,
  ExternalLink,
  CheckSquare,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  Target,
  Edit2,
  RefreshCw,
  Flame,
  Zap,
  Layers,
  ArrowUpRight,
  Filter,
  Building2,
  QrCode,
  CreditCard,
  Globe,
  RotateCcw,
  Copy,
  Save,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskCategory, TaskActionType, ClaimableOrder, OrderCategoryRange } from '../types';
import { GatewayLogoBadge } from './ToolWalletScreen';
import { ScreenBoundary } from '../components/ScreenBoundary';
import { AdminGatewaysTab } from '../components/AdminGatewaysTab';
import { AdminDeviceClustersTab } from '../components/AdminDeviceClustersTab';
import { AdminSlaNoticesTab } from '../components/AdminSlaNoticesTab';
import { AdminKycTab } from '../components/AdminKycTab';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const AdminPanel: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    fetchUsers,
    isLoadingUsers,
    transactions, 
    tasks,
    claimableOrders,
    userWallets, 
    stats, 
    emailLogs,
    paymentGateways,
    cryptoVaults,
    platformAccount,
    deviceClusters,
    multiAccountAlerts,
    fetchDeviceClusters,
    adminClusterAction,
    adminApproveDeposit, 
    adminRejectDeposit, 
    adminApproveWithdrawal, 
    adminRejectWithdrawal, 
    adminUpdateUserBalance, 
    adminReconcileUser,
    adminToggleUserStatus, 
    adminUpdateStats,
    adminApproveWallet,
    adminDeleteWallet,
    adminAddTask,
    adminEditTask,
    adminDeleteTask,
    adminToggleTask,
    fetchTasks,
    adminAddOrder,
    adminUpdateOrder,
    adminDeleteOrder,
    adminResetOrders,
    adminUpdatePlatformAccount,
    adminAddPaymentGateway,
    adminUpdatePaymentGateway,
    adminDeletePaymentGateway,
    adminTogglePaymentGateway,
    adminAddCryptoVault,
    adminUpdateCryptoVault,
    adminDeleteCryptoVault,
    adminToggleCryptoVault,
    adminResetPaymentSettings,
    isAdminAuthenticated,
    openAdminPasswordModal,
    logoutAdmin,
    setActiveScreen,
    switchUser,
    showToast
  } = useApp();

  const safeUsers = allUsers || [];
  const safeTransactions = transactions || [];
  const safeTasks = tasks || [];
  const safeClaimableOrders = claimableOrders || [];
  const safeUserWallets = userWallets || [];
  const safeStats = stats || { realtime_exchange_rate: 111, commission_rate: 4.0, direct_referral_rate: 4.0, indirect_referral_rate: 2.0, level_3_referral_rate: 1.0, binding_bonus_amount: 50 };
  const safeEmailLogs = emailLogs || [];
  const safePaymentGateways = paymentGateways || [];
  const safeCryptoVaults = cryptoVaults || [];
  const safeDeviceClusters = deviceClusters || [];
  const safeMultiAccountAlerts = multiAccountAlerts || [];

  const [activeTab, setActiveTab] = useState<'approvals' | 'kyc' | 'offers' | 'gateways' | 'clusters' | 'users' | 'rates' | 'tasks' | 'notices' | 'wallets' | 'emails'>('approvals');
  const [pendingKycCount, setPendingKycCount] = useState<number>(0);
  const [exchangeRateInput, setExchangeRateInput] = useState((safeStats.realtime_exchange_rate || 111).toString());
  const [cashbackRateInput, setCashbackRateInput] = useState((safeStats.commission_rate || 4.0).toString());
  const [directReferralInput, setDirectReferralInput] = useState((safeStats.direct_referral_rate || 4.0).toString());
  const [indirectReferralInput, setIndirectReferralInput] = useState((safeStats.indirect_referral_rate || 2.0).toString());
  const [level3ReferralInput, setLevel3ReferralInput] = useState((safeStats.level_3_referral_rate || 1.0).toString());
  const [bindingBonusInput, setBindingBonusInput] = useState((safeStats.binding_bonus_amount || 50).toString());

  const [minDepositInput, setMinDepositInput] = useState((safeStats.min_deposit || 50).toString());
  const [maxDepositInput, setMaxDepositInput] = useState((safeStats.max_deposit || 5000).toString());
  const [minWithdrawInput, setMinWithdrawInput] = useState((safeStats.min_withdraw || 500).toString());
  const [maxWithdrawInput, setMaxWithdrawInput] = useState((safeStats.max_withdraw || 200000).toString());
  const [withdrawFeeInput, setWithdrawFeeInput] = useState((safeStats.withdraw_fee || safeStats.withdrawal_fee || 500).toString());

  // Automatically keep inputs in sync whenever stats change or update from server
  useEffect(() => {
    if (stats) {
      if (stats.realtime_exchange_rate !== undefined) setExchangeRateInput(stats.realtime_exchange_rate.toString());
      if (stats.commission_rate !== undefined) setCashbackRateInput(stats.commission_rate.toString());
      if (stats.direct_referral_rate !== undefined) setDirectReferralInput(stats.direct_referral_rate.toString());
      if (stats.indirect_referral_rate !== undefined) setIndirectReferralInput(stats.indirect_referral_rate.toString());
      if (stats.level_3_referral_rate !== undefined) setLevel3ReferralInput(stats.level_3_referral_rate.toString());
      if (stats.binding_bonus_amount !== undefined) setBindingBonusInput(stats.binding_bonus_amount.toString());
      if (stats.min_deposit !== undefined) setMinDepositInput(stats.min_deposit.toString());
      if (stats.max_deposit !== undefined) setMaxDepositInput(stats.max_deposit.toString());
      if (stats.min_withdraw !== undefined) setMinWithdrawInput(stats.min_withdraw.toString());
      if (stats.max_withdraw !== undefined) setMaxWithdrawInput(stats.max_withdraw.toString());
      if (stats.withdraw_fee !== undefined || stats.withdrawal_fee !== undefined) setWithdrawFeeInput((stats.withdraw_fee || stats.withdrawal_fee || 500).toString());
    }
  }, [stats]);

  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        const rtExch = s.realtime_exchange_rate || 111;
        const comm = s.commission_rate || 4.0;
        const l1 = s.commission_l1_rate || 4.0;
        const l2 = s.commission_l2_rate || 2.0;
        const l3 = s.commission_l3_rate || 1.0;
        const bonus = s.binding_bonus_amount || 50;

        const minDep = s.min_deposit || 50;
        const maxDep = s.max_deposit || 5000;
        const minWth = s.min_withdraw || 500;
        const maxWth = s.max_withdraw || 200000;
        const wthFee = s.withdraw_fee || s.withdrawal_fee || 500;

        setExchangeRateInput(rtExch.toString());
        setCashbackRateInput(comm.toString());
        setDirectReferralInput(l1.toString());
        setIndirectReferralInput(l2.toString());
        setLevel3ReferralInput(l3.toString());
        setBindingBonusInput(bonus.toString());

        setMinDepositInput(minDep.toString());
        setMaxDepositInput(maxDep.toString());
        setMinWithdrawInput(minWth.toString());
        setMaxWithdrawInput(maxWth.toString());
        setWithdrawFeeInput(wthFee.toString());

        adminUpdateStats({
          realtime_exchange_rate: Number(rtExch),
          commission_rate: Number(comm),
          direct_referral_rate: Number(l1),
          indirect_referral_rate: Number(l2),
          level_3_referral_rate: Number(l3),
          binding_bonus_amount: Number(bonus),
          min_deposit: Number(minDep),
          max_deposit: Number(maxDep),
          min_withdraw: Number(minWth),
          max_withdraw: Number(maxWth),
          withdraw_fee: Number(wthFee),
          withdrawal_fee: Number(wthFee),
        });
      }
    } catch (e) {
      console.warn('Failed to load platform settings into admin panel:', e);
    }
  };

  const [searchUser, setSearchUser] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [auditLogUser, setAuditLogUser] = useState<any | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [serverDeposits, setServerDeposits] = useState<any[]>([]);
  const [serverWithdrawals, setServerWithdrawals] = useState<any[]>([]);

  const hasValidAdminAuth = Boolean(
    isAdminAuthenticated || 
    localStorage.getItem('juspay_admin_token') || 
    currentUser.role === 'admin'
  );

  const fetchServerDeposits = async () => {
    const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
    try {
      const res = await fetch('/api/admin/deposits', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
          'x-admin-token': adminToken
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.deposits)) {
        setServerDeposits(data.deposits);
      }
    } catch (e) {
      console.warn('Failed to fetch server deposits:', e);
    }

    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': 'admin_token_2026'
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.withdrawals)) {
        setServerWithdrawals(data.withdrawals);
      }
    } catch (e) {
      console.warn('Failed to fetch server withdrawals:', e);
    }
  };

  const [taskSubmissions, setTaskSubmissions] = useState<any[]>([]);

  const fetchTaskSubmissions = async () => {
    const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
    try {
      const res = await fetch('/api/admin/task-submissions', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': 'admin_token_2026'
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        setTaskSubmissions(data.submissions);
      }
    } catch (e) {
      console.warn('Failed to fetch server task submissions:', e);
    }
  };

  const fetchPendingKycCount = async () => {
    const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
    try {
      const res = await fetch('/api/admin/kyc/list?status=PENDING', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
          'x-admin-token': adminToken
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.verifications)) {
        const count = data.verifications.filter((k: any) => (k.status || '').toUpperCase() === 'PENDING').length;
        setPendingKycCount(count);
      }
    } catch (e) {
      console.warn('Failed to fetch pending KYC count:', e);
    }
  };

  const handleApproveTaskSubmission = async (submissionId: string) => {
    const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
    try {
      const res = await fetch(`/api/admin/task-submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Task submission approved successfully! Reward credited.');
        fetchTaskSubmissions();
      } else {
        showToast(`Approval failed: ${data.message || data.error}`);
      }
    } catch (e) {
      console.warn(e);
      showToast('API connection error during approval.');
    }
  };

  const handleRejectTaskSubmission = async (submissionId: string) => {
    const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
    try {
      const res = await fetch(`/api/admin/task-submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Task submission rejected.');
        fetchTaskSubmissions();
      } else {
        showToast(`Rejection failed: ${data.message || data.error}`);
      }
    } catch (e) {
      console.warn(e);
      showToast('API connection error during rejection.');
    }
  };

  useEffect(() => {
    if (hasValidAdminAuth) {
      fetchPlatformSettings();
      fetchServerDeposits();
      fetchTaskSubmissions();
      fetchTasks();
      fetchUsers();
      fetchPendingKycCount();
    }
  }, [hasValidAdminAuth, fetchUsers]);

  useEffect(() => {
    if (hasValidAdminAuth && (activeTab === 'users' || activeTab === 'kyc')) {
      fetchUsers();
      fetchPendingKycCount();
    }
  }, [hasValidAdminAuth, activeTab, fetchUsers]);

  const fetchAuditLogs = async (user: any) => {
    setAuditLogUser(user);
    setLoadingAuditLogs(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/audit-logs`);
      const data = await res.json();
      if (data.success) {
        setAuditLogsList(data.audit_logs || []);
      } else {
        setAuditLogsList([]);
      }
    } catch (e) {
      setAuditLogsList([]);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // New Task Creator State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<'All' | TaskCategory>('All');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Daily');
  const [newTaskActionType, setNewTaskActionType] = useState<TaskActionType>('claim');
  const [newTaskType, setNewTaskType] = useState<string>('deposit');
  const [newTaskPoints, setNewTaskPoints] = useState('100');
  const [newTaskRewardInr, setNewTaskRewardInr] = useState('100');
  const [newTaskActionLink, setNewTaskActionLink] = useState('');
  const [newTaskVerificationType, setNewTaskVerificationType] = useState<'instant' | 'manual'>('instant');
  const [newTaskTarget, setNewTaskTarget] = useState('1');
  const [newTaskTargetAmount, setNewTaskTargetAmount] = useState('0');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Edit Task State
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<TaskCategory>('Daily');
  const [editTaskType, setEditTaskType] = useState<string>('deposit');
  const [editTaskPoints, setEditTaskPoints] = useState('100');
  const [editTaskRewardInr, setEditTaskRewardInr] = useState('100');
  const [editTaskActionLink, setEditTaskActionLink] = useState('');
  const [editTaskVerificationType, setEditTaskVerificationType] = useState<'instant' | 'manual'>('instant');
  const [editTaskTarget, setEditTaskTarget] = useState('1');
  const [editTaskTargetAmount, setEditTaskTargetAmount] = useState('0');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskActive, setEditTaskActive] = useState(true);

  // Dynamic Order Cashback & Ranges State
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ClaimableOrder | null>(null);
  const [orderRangeFilter, setOrderRangeFilter] = useState<OrderCategoryRange | 'All'>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  
  // Add Order Form Inputs
  const [newOrderCode, setNewOrderCode] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newOrderAmount, setNewOrderAmount] = useState('2500');
  const [newOrderMinDeposit, setNewOrderMinDeposit] = useState('2500');
  const [newOrderCashbackPct, setNewOrderCashbackPct] = useState(stats.commission_rate.toString());
  const [newOrderRange, setNewOrderRange] = useState<OrderCategoryRange>('2001-5000');
  const [newOrderNotes, setNewOrderNotes] = useState('');

  // Helper to auto-pick category range based on order amount
  const autoPickRange = (amt: number): OrderCategoryRange => {
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
      setNewOrderRange(autoPickRange(num));
    }
  };

  // Secure Guard: Require active admin session authentication
  if (!hasValidAdminAuth) {
    return (
      <div className="clay-card p-8 text-center space-y-4 max-w-sm mx-auto my-8">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-[#2D241E]">Restricted Master Admin Panel</h2>
          <p className="text-xs text-[#7A6B5D] mt-1.5 leading-relaxed">
            Administrator password verification is required to unlock financial management controls and sensitive user ledgers.
          </p>
        </div>
        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              openAdminPasswordModal(() => {
                switchUser('admin');
                setActiveScreen('admin');
              });
            }}
            className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            Authenticate Admin Password
          </button>
          <button
            onClick={() => {
              window.location.hash = '';
              setActiveScreen('home');
            }}
            className="clay-btn-dark w-full py-2 text-xs font-bold rounded-xl cursor-pointer"
          >
            Return to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pending Deposit Queue (Merging server deposits with screenshots & local transactions)
  const mappedServerDeposits = serverDeposits
    .filter(d => {
      const s = String(d.status || '').toLowerCase();
      return s === 'pending' || s === 'processing' || s === 'in_review';
    })
    .map(d => ({
      id: String(d.order_id || d.id),
      order_id: d.order_id,
      user_id: String(d.user_id),
      user_email: d.user_email || 'user@juspay.in',
      type: 'Deposit',
      amount: Number(d.amount_inr || (d.amount_usdt ? d.amount_usdt * 111 : 0)),
      currency: d.network ? 'USDT' : 'INR',
      status: d.status || 'Pending',
      timestamp: d.created_at || new Date().toISOString(),
      created_at: d.created_at || new Date().toISOString(),
      deposit_method: d.network ? 'Crypto' : (d.deposit_method || 'UPI'),
      network: d.network,
      tx_id: d.tx_id,
      utr_number: d.utr_number || d.tx_id,
      proof_screenshot: d.screenshot_base64
    }));

  const localPendingDeposits = safeTransactions.filter(
    t => (t.type === 'Deposit' || t.type === 'DEPOSIT') &&
         t.status !== 'Settled' && t.status !== 'settled' &&
         t.status !== 'Completed' && t.status !== 'completed' &&
         t.status !== 'Rejected' && t.status !== 'rejected' &&
         (t.status === 'Pending' || t.status === 'Processing' || t.status === 'pending' || t.status === 'processing')
  );

  const pendingDepositsMap = new Map();
  [...mappedServerDeposits, ...localPendingDeposits].forEach(item => {
    const key = item.order_id || item.id;
    if (key && !pendingDepositsMap.has(key)) {
      pendingDepositsMap.set(key, item);
    }
  });
  const pendingDeposits = Array.from(pendingDepositsMap.values());

  // Pending Withdrawal Queue
  const mappedServerWithdrawals = serverWithdrawals
    .filter(w => {
      const s = String(w.status || '').toLowerCase();
      return s === 'pending' || s === 'processing';
    })
    .map(w => ({
      id: w.order_id || String(w.id),
      order_id: w.order_id,
      user_id: String(w.user_id),
      user_email: w.user_email || 'user@juspay.in',
      type: 'Withdrawal',
      amount: Number(w.amount_inr || w.amount || 0),
      currency: 'INR',
      status: w.status || 'Pending',
      timestamp: w.created_at || new Date().toISOString(),
      wallet_provider: w.method || w.payment_method || 'UPI',
      account_number: w.payment_details,
      destination_details: w.payment_details,
      holder_name: w.holder_name || '',
      user_cards_balance: w.user_cards_balance !== undefined ? Number(w.user_cards_balance) : undefined
    }));

  const localPendingWithdrawals = safeTransactions.filter(
    t => (t.type === 'Withdrawal' || t.type === 'WITHDRAWAL' || t.type === 'Withdraw') &&
         t.status !== 'Settled' && t.status !== 'settled' &&
         t.status !== 'Completed' && t.status !== 'completed' &&
         t.status !== 'Rejected' && t.status !== 'rejected' &&
         (t.status === 'Pending' || t.status === 'Processing' || t.status === 'pending' || t.status === 'processing')
  );

  const pendingWithdrawalsMap = new Map();
  [...mappedServerWithdrawals, ...localPendingWithdrawals].forEach(item => {
    const key = item.order_id || item.id;
    if (key && !pendingWithdrawalsMap.has(key)) {
      pendingWithdrawalsMap.set(key, item);
    }
  });
  const pendingWithdrawals = Array.from(pendingWithdrawalsMap.values());

  const filteredUsers = safeUsers.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.referral_code.toLowerCase().includes(searchUser.toLowerCase())
  );

  const executeReject = (id: any, type: 'deposit' | 'withdrawal') => {
    try {
      window.alert(`Transaction ${id} rejected successfully.`);

      if (type === 'deposit') {
        setServerDeposits((prev: any[]) => prev.filter((item) => String(item.id || item.order_id || item.tx_id) !== String(id)));
        adminRejectDeposit(id, 'Rejected by admin').catch(e => console.error(e));
        fetchServerDeposits();
      } else {
        adminRejectWithdrawal(id, 'Rejected by admin').catch(e => console.error(e));
      }

      const saved = localStorage.getItem('transactions');
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map((t: any) =>
          String(t.id || t._id || t.order_id) === String(id) ? { ...t, status: 'rejected', rejectedAt: new Date().toISOString() } : t
        );
        localStorage.setItem('transactions', JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Reject failure:", err);
    }
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    const rt_exch_rate = parseFloat(exchangeRateInput) || 111;
    const comm_rate = parseFloat(cashbackRateInput) || 4.0;
    const dir_rate = parseFloat(directReferralInput) || 4.0;
    const ind_rate = parseFloat(indirectReferralInput) || 2.0;
    const l3_rate = parseFloat(level3ReferralInput) || 1.0;
    const bind_bonus = parseFloat(bindingBonusInput) || 50;

    adminUpdateStats({
      realtime_exchange_rate: rt_exch_rate,
      commission_rate: comm_rate,
      direct_referral_rate: dir_rate,
      indirect_referral_rate: ind_rate,
      level_3_referral_rate: l3_rate,
      binding_bonus_amount: bind_bonus,
    });

    try {
      const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
      const res = await fetch('/api/admin/settings/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': 'admin_token_2026'
        },
        body: JSON.stringify({
          commission_l1_rate: dir_rate,
          commission_l2_rate: ind_rate,
          commission_l3_rate: l3_rate,
          realtime_exchange_rate: rt_exch_rate,
          commission_rate: comm_rate,
          binding_bonus_amount: bind_bonus
        })
      });
      if (res.ok) {
        showToast('Rates persisted in server successfully.');
      } else {
        console.warn('Failed to persist rates on server. Status:', res.status);
      }
    } catch (err) {
      console.error('Error persisting rates on server:', err);
    }
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    const minDep = parseFloat(minDepositInput) || 50;
    const maxDep = parseFloat(maxDepositInput) || 5000;
    const minWth = parseFloat(minWithdrawInput) || 500;
    const maxWth = parseFloat(maxWithdrawInput) || 200000;
    const wthFee = parseFloat(withdrawFeeInput) || 500;

    adminUpdateStats({
      min_deposit: minDep,
      max_deposit: maxDep,
      min_withdraw: minWth,
      max_withdraw: maxWth,
      withdraw_fee: wthFee,
      withdrawal_fee: wthFee,
    });

    try {
      const adminToken = localStorage.getItem('juspay_admin_token') || 'admin_token_2026';
      const res = await fetch('/api/admin/settings/limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-key': 'admin_token_2026'
        },
        body: JSON.stringify({
          min_deposit: minDep,
          max_deposit: maxDep,
          min_withdraw: minWth,
          max_withdraw: maxWth,
          withdraw_fee: wthFee,
          withdrawal_fee: wthFee,
        })
      });
      if (res.ok) {
        showToast('Deposit & Withdrawal limits and fees updated successfully!');
      } else {
        showToast('Failed to save limits to server.');
      }
    } catch (err) {
      showToast('Error persisting limits on server.');
    }
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newOrderAmount);
    const minDep = parseFloat(newOrderMinDeposit) || amt;
    const pct = parseFloat(newOrderCashbackPct) || stats.commission_rate;
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid order amount in INR.');
      return;
    }
    const income = Number(((amt * pct) / 100).toFixed(2));
    
    adminAddOrder({
      code: newOrderCode.trim() || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      amount_inr: amt,
      income_inr: income,
      cashback_rate: pct,
      min_deposit_required: minDep,
      category_range: newOrderRange,
      notes: newOrderNotes.trim(),
    });

    // Reset form
    setNewOrderCode(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewOrderAmount('2500');
    setNewOrderMinDeposit('2500');
    setNewOrderNotes('');
    setIsAddingOrder(false);
  };

  const handleEditOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    adminUpdateOrder(editingOrder.id, editingOrder);
    setEditingOrder(null);
  };

  // Quick Preset Adders
  const addPresetOrder = (amount: number, category: OrderCategoryRange, codePrefix: string) => {
    const pct = stats.commission_rate;
    const income = Number(((amount * pct) / 100).toFixed(2));
    const randomCode = `${codePrefix}-${Math.floor(100 + Math.random() * 900)}`;
    adminAddOrder({
      code: randomCode,
      amount_inr: amount,
      income_inr: income,
      cashback_rate: pct,
      min_deposit_required: amount,
      category_range: category,
      notes: `Tier ₹${amount.toLocaleString('en-IN')} Offer`,
    });
  };

  // Filter claimable orders for admin list
  const filteredOrders = claimableOrders.filter(o => {
    const matchesRange = orderRangeFilter === 'All' || o.category_range === orderRangeFilter;
    const matchesSearch = !orderSearchQuery || 
      o.code.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.amount_inr.toString().includes(orderSearchQuery);
    return matchesRange && matchesSearch;
  });

  const handleAdminTabSwitch = (tab: any) => {
    triggerSwitchSound();
    setActiveTab(tab);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      
      {/* Admin Header */}
      <div className="clay-card-gold p-4 flex items-center justify-between text-amber-950">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerCancelSound();
              window.location.hash = '';
              switchUser('user');
              setActiveScreen('home');
            }}
            className="w-8 h-8 rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center text-amber-950 cursor-pointer shadow-xs"
            title="Return to User View"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-900" />
              <h2 className="font-extrabold text-sm text-amber-950 uppercase tracking-wider">
                System Master Console
              </h2>
            </div>
            <p className="text-[10px] text-amber-900 font-semibold mt-0.5">
              Logged in as Admin ({currentUser.username}) • Full Platform Controls
            </p>
          </div>
        </div>

        {/* Actions Strip: Secure Lock/Logout */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              window.location.hash = '';
              logoutAdmin();
            }}
            className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Lock & Terminate Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-4 gap-2">
        <div className="clay-card p-2.5 text-center">
          <span className="text-[9px] text-[#7A6B5D] font-bold block uppercase">Pending Deposits</span>
          <strong className="text-xs font-bold text-emerald-700 block mt-0.5">
            {pendingDeposits.length}
          </strong>
        </div>

        <div className="clay-card p-2.5 text-center">
          <span className="text-[9px] text-[#7A6B5D] font-bold block uppercase">Pending Payouts</span>
          <strong className="text-xs font-bold text-rose-700 block mt-0.5">
            {pendingWithdrawals.length}
          </strong>
        </div>

        <div className="clay-card p-2.5 text-center">
          <span className="text-[9px] text-[#7A6B5D] font-bold block uppercase">Total Users</span>
          <strong className="text-xs font-bold text-[#2D241E] block mt-0.5">
            {allUsers.length}
          </strong>
        </div>

        <div className="clay-card p-2.5 text-center">
          <span className="text-[9px] text-[#7A6B5D] font-bold block uppercase">Active Offers</span>
          <strong className="text-xs font-bold text-purple-700 block mt-0.5">
            {claimableOrders.length}
          </strong>
        </div>
      </div>

      {/* Admin Tabs Navigation Bar */}
      <div className="grid grid-cols-4 sm:grid-cols-11 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-center border border-slate-200">
        <button
          onClick={() => handleAdminTabSwitch('approvals')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Approvals</span>
          {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
            <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-rose-500 text-white rounded-full font-extrabold animate-pulse">
              {pendingDeposits.length + pendingWithdrawals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleAdminTabSwitch('kyc')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'kyc'
              ? 'bg-white text-emerald-950 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>KYC</span>
          {pendingKycCount > 0 && (
            <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-amber-500 text-white rounded-full font-extrabold animate-pulse">
              {pendingKycCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleAdminTabSwitch('offers')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'offers'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          <span>Cashback Offers</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded-full font-extrabold border border-purple-200">
            {claimableOrders.length}
          </span>
        </button>

        <button
          onClick={() => handleAdminTabSwitch('gateways')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'gateways'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          <span>Gateways</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full font-extrabold border border-emerald-300">
            {paymentGateways.length + cryptoVaults.length}
          </span>
        </button>

        <button
          onClick={() => handleAdminTabSwitch('clusters')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'clusters'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          <span>Clusters</span>
          {deviceClusters.filter(c => c.status === 'FLAGGED').length > 0 && (
            <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-amber-500 text-white rounded-full font-extrabold">
              {deviceClusters.filter(c => c.status === 'FLAGGED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleAdminTabSwitch('users')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          Users ({allUsers.length})
        </button>

        <button
          onClick={() => handleAdminTabSwitch('rates')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'rates'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          Rates
        </button>

        <button
          onClick={() => handleAdminTabSwitch('tasks')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          <span>Tasks</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full font-extrabold border border-amber-200">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => handleAdminTabSwitch('notices')}
          className={`py-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'notices'
              ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>SLA Notices</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full font-extrabold border border-emerald-300">
            {(stats.global_announcements || []).filter(a => a.is_active).length}
          </span>
        </button>

        <button
          onClick={() => handleAdminTabSwitch('wallets')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'wallets'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          Wallets
        </button>

        <button
          onClick={() => handleAdminTabSwitch('emails')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'emails'
              ? 'bg-white text-[#2D241E] shadow-xs font-extrabold'
              : 'text-[#7A6B5D] hover:text-[#2D241E]'
          }`}
        >
          Emails
        </button>
      </div>

      {/* TAB 1: Approvals Queue (Deposits & Withdrawals) */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          
          {/* Deposits Approval Queue */}
          <div className="clay-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                  Pending Deposits Queue ({pendingDeposits.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#7A6B5D] font-bold">1-Click Approval</span>
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="p-6 text-center text-[#8C7A6B] space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-[#2D241E]">All deposits reviewed!</p>
                <p className="text-[11px]">No pending deposit requests in queue.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingDeposits.map((tx, idx) => (
                  <div
                    key={`${tx.id || tx.order_id || 'dep'}-${idx}`}
                    className="p-3.5 rounded-2xl clay-card-soft flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-extrabold rounded border border-emerald-300">
                            {tx.deposit_method || 'Crypto'}
                          </span>
                          <span className="font-bold text-xs text-[#2D241E]">{tx.user_email}</span>
                        </div>
                        <p className="text-xs text-[#7A6B5D] mt-0.5">
                          Amount: <strong className="text-[#2D241E] font-mono text-sm">₹{tx.amount.toLocaleString()} INR</strong>
                        </p>
                        {tx.utr_number && (
                          <p className="text-[10px] font-mono text-[#4A3E35]">
                            UTR / Ref: <span className="font-bold text-indigo-700">{tx.utr_number}</span>
                          </p>
                        )}
                        {tx.tx_hash && (
                          <p className="text-[10px] font-mono text-[#4A3E35] truncate max-w-xs">
                            TxHash: <span className="font-bold">{tx.tx_hash}</span>
                          </p>
                        )}
                      </div>

                      <span className="text-[10px] text-[#8C7A6B] flex-shrink-0">{formatISTTimestamp(tx.timestamp)}</span>
                    </div>

                    {/* Proof Screenshot view if attached */}
                    {tx.proof_screenshot && (
                      <button
                        onClick={() => setSelectedProofUrl(tx.proof_screenshot!)}
                        className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 self-start cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Attached Proof / Screenshot</span>
                      </button>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#EFE8DF]">
                      <button
                        disabled={processingId === tx.id}
                        onClick={async () => {
                          setProcessingId(tx.id);
                          try {
                            await adminApproveDeposit(tx.id);
                            setServerDeposits(prev => prev.filter(d => String(d.id) !== String(tx.id) && d.order_id !== tx.id && d.tx_id !== tx.id));
                            await fetchServerDeposits();
                          } catch (err: any) {
                            alert('Deposit approval error: ' + (err?.message || 'Failed'));
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        className="flex-1 py-1.5 clay-btn-emerald text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {processingId === tx.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{processingId === tx.id ? 'Approving...' : 'Approve & Credit Balance'}</span>
                      </button>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', position: 'relative', zIndex: 100 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            executeReject(tx.id || tx._id, 'deposit');
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            executeReject(tx.id || tx._id, 'deposit');
                          }}
                          style={{
                            flex: '0 0 auto',
                            padding: '10px 18px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1.5px solid #dc2626',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            touchAction: 'manipulation',
                            position: 'relative',
                            zIndex: 99999
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal Approval Queue */}
          <div className="clay-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                  Pending Withdrawals Queue ({pendingWithdrawals.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#7A6B5D] font-bold">Direct Payout</span>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="p-6 text-center text-[#8C7A6B] space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-[#2D241E]">No pending withdrawals!</p>
                <p className="text-[11px]">All payout requests processed.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingWithdrawals.map((tx, idx) => (
                  <div
                    key={`${tx.id || tx.order_id || 'wd'}-${idx}`}
                    className="p-3.5 rounded-2xl clay-card-soft flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-xs text-[#2D241E]">{tx.user_email}</span>
                        {tx.user_cards_balance !== undefined && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                              🎴 Cards: {tx.user_cards_balance}
                            </span>
                            {tx.user_cards_balance < 1 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100">
                                ⚠️ Empty
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                ✓ Eligible
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-[#7A6B5D] mt-1">
                          Payout: <strong className="text-rose-700 font-mono text-sm">₹{tx.amount.toLocaleString()} INR</strong>
                        </p>
                        {tx.wallet_provider && (
                          <div className="mt-1.5 p-2 bg-amber-50/80 border border-amber-200 rounded-xl space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold">
                              <span>🏦 Channel: <strong className="text-slate-900">{tx.wallet_provider}</strong></span>
                            </div>
                            <p className="text-xs font-mono font-black text-slate-900 bg-white px-2 py-1 rounded border border-amber-200/60 shadow-2xs">
                              Destination: {tx.account_number || tx.destination_details || 'N/A'}
                            </p>
                            {tx.holder_name && (
                              <p className="text-[10px] text-slate-600">
                                Acc Holder: <span className="font-bold text-slate-800">{tx.holder_name}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8C7A6B] flex-shrink-0">{formatISTTimestamp(tx.timestamp)}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[#EFE8DF]">
                      <button
                        disabled={processingId === tx.id}
                        onClick={async () => {
                          setProcessingId(tx.id);
                          try {
                            const res = await fetch('/api/admin/disburse', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('juspay_admin_token') || localStorage.getItem('juspay_auth_token') || 'admin_token_2026'}`
                              },
                              body: JSON.stringify({
                                txId: tx.id,
                                email: tx.user_email || tx.email,
                                amount: tx.amount
                              })
                            });
                            const data = await res.json();
                            if (data.success) {
                              await adminApproveWithdrawal(tx.id);
                              try {
                                const cached = JSON.parse(localStorage.getItem('admin_payout_queue') || '[]');
                                localStorage.setItem('admin_payout_queue', JSON.stringify(cached.filter((p: any) => p.id !== tx.id && p.id !== data.updatedId)));
                              } catch (e) {}
                            } else {
                              alert('Database error: ' + (data.message || data.error));
                            }
                          } catch (e: any) {
                            alert('Network failure connecting to server: ' + (e?.message || 'Error'));
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        className="flex-1 py-1.5 clay-btn-emerald text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {processingId === tx.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{processingId === tx.id ? 'Processing...' : 'Disburse & Clear Payout'}</span>
                      </button>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', position: 'relative', zIndex: 100 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            executeReject(tx.id || tx._id, 'withdrawal');
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            executeReject(tx.id || tx._id, 'withdrawal');
                          }}
                          style={{
                            flex: '0 0 auto',
                            padding: '10px 18px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1.5px solid #dc2626',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            touchAction: 'manipulation',
                            position: 'relative',
                            zIndex: 99999
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB: Indian Identity KYC Verification Management */}
      {activeTab === 'kyc' && (
        <AdminKycTab
          onStatusChange={() => {
            fetchUsers();
            fetchPendingKycCount();
          }}
          showToast={showToast}
        />
      )}

      {/* TAB 2: Deposit Cashback & Ranges Management */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          
          {/* Main Controls Card */}
          <div className="clay-card p-4 space-y-3.5">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-700" />
                <div>
                  <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                    Deposit Cashback Offers & Range Tiers
                  </h3>
                  <span className="text-[10px] text-[#7A6B5D] block">
                    Supported tiers up to ₹50,000 INR • Real-time synchronization
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={adminResetOrders}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#7A6B5D] hover:text-[#2D241E] text-[10px] font-bold rounded-lg border border-[#E8E0D5] flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Reset to standard catalogue up to ₹50,000"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Default Tiers</span>
                </button>

                <button
                  onClick={() => setIsAddingOrder(!isAddingOrder)}
                  className="clay-btn-emerald px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingOrder ? 'Close Form' : 'Add New Offer'}</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Preset Tiers Generator */}
            <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 rounded-2xl border border-purple-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Quick High-Tier Generator (Up to ₹50,000 INR)</span>
                </span>
                <span className="text-[10px] text-purple-800 font-bold">1-Click Add</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => addPresetOrder(2800, '2001-5000', 'ORD-2K')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-950 text-[10px] font-bold rounded-lg border border-purple-200 shadow-xs cursor-pointer"
                >
                  + ₹2,800 (Tier 2K-5K)
                </button>
                <button
                  onClick={() => addPresetOrder(8500, '5001-15000', 'ORD-8K')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-950 text-[10px] font-bold rounded-lg border border-purple-200 shadow-xs cursor-pointer"
                >
                  + ₹8,500 (Tier 5K-15K)
                </button>
                <button
                  onClick={() => addPresetOrder(22000, '15001-50000', 'ORD-22K')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-950 text-[10px] font-bold rounded-lg border border-purple-200 shadow-xs cursor-pointer"
                >
                  + ₹22,000 (Tier 15K-50K)
                </button>
                <button
                  onClick={() => addPresetOrder(50000, '15001-50000', 'ORD-50K')}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold rounded-lg border border-amber-400 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Flame className="w-3 h-3 text-red-600" />
                  <span>+ ₹50,000 (Max Bracket)</span>
                </button>
              </div>
            </div>

            {/* Create New Order Form */}
            {isAddingOrder && (
              <form
                onSubmit={handleCreateOrderSubmit}
                className="p-4 bg-gradient-to-br from-purple-50/70 to-amber-50/50 rounded-2xl border border-purple-200 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-1 border-b border-purple-200/60">
                  <span className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Configure New Dynamic Cashback Offer
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Bracket Range Tier *
                    </label>
                    <select
                      value={newOrderRange}
                      onChange={e => setNewOrderRange(e.target.value as OrderCategoryRange)}
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Top Picks">Top Picks (Featured on Top)</option>
                      <option value="100-300">₹100 - ₹300</option>
                      <option value="301-500">₹301 - ₹500</option>
                      <option value="501-2000">₹501 - ₹2,000</option>
                      <option value="2001-5000">₹2,001 - ₹5,000</option>
                      <option value="5001-15000">₹5,001 - ₹15,000</option>
                      <option value="15001-50000">₹15,001 - ₹50,000 (High Volume Tier)</option>
                    </select>
                  </div>

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

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Internal Admin Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Merchant Settlement Queue"
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
                    placeholder="Search by code (e.g. ORD-9901) or amount..."
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    className="w-full clay-inset pl-8 pr-3 py-1.5 text-xs font-medium text-[#2D241E] bg-white"
                  />
                </div>

                <span className="text-[10px] font-mono font-bold text-[#7A6B5D] whitespace-nowrap">
                  Showing {filteredOrders.length} / {claimableOrders.length}
                </span>
              </div>

              {/* Range Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-1">
                {(['All', 'Top Picks', '100-300', '301-500', '501-2000', '2001-5000', '5001-15000', '15001-50000'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setOrderRangeFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      orderRangeFilter === cat
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {cat === '15001-50000' ? '₹15K-50K' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Offers List */}
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Tag className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No order offers found matching filter.</p>
                <button
                  onClick={() => setIsAddingOrder(true)}
                  className="text-xs text-purple-800 font-bold hover:underline cursor-pointer"
                >
                  Click here to create a new offer
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {filteredOrders.map(order => {
                  const rate = order.cashback_rate || stats.commission_rate;
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
                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-100 text-purple-900 rounded-full border border-purple-200">
                            {order.category_range}
                          </span>
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
                          onClick={() => setEditingOrder(order)}
                          className="px-2.5 py-1.5 bg-white text-purple-800 hover:bg-purple-50 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          title="Edit Offer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            adminUpdateOrder(order.id, { is_claimed: !order.is_claimed });
                          }}
                          className="px-2.5 py-1.5 bg-white text-[#7A6B5D] hover:text-[#2D241E] rounded-xl text-[10px] font-bold border border-[#E8E0D5] cursor-pointer"
                          title="Toggle Claimed status"
                        >
                          {order.is_claimed ? 'Unclaim' : 'Mark Claimed'}
                        </button>

                        <button
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
                    onClick={() => setEditingOrder(null)}
                    className="text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] cursor-pointer"
                  >
                    Close
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
                          const rate = editingOrder.cashback_rate || stats.commission_rate;
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
                        value={editingOrder.cashback_rate || stats.commission_rate}
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

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Category Range
                    </label>
                    <select
                      value={editingOrder.category_range}
                      onChange={e => setEditingOrder({ ...editingOrder, category_range: e.target.value as OrderCategoryRange })}
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white"
                    >
                      <option value="Top Picks">Top Picks</option>
                      <option value="100-300">₹100 - ₹300</option>
                      <option value="301-500">₹301 - ₹500</option>
                      <option value="501-2000">₹501 - ₹2,000</option>
                      <option value="2001-5000">₹2,001 - ₹5,000</option>
                      <option value="5001-15000">₹5,001 - ₹15,000</option>
                      <option value="15001-50000">₹15,001 - ₹50,000</option>
                    </select>
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

        </div>
      )}

      {/* TAB: Gateways & Crypto Vaults Management */}
      {activeTab === "gateways" && (
        <ScreenBoundary fallbackTitle="Payment Gateways Configuration System">
          <AdminGatewaysTab />
        </ScreenBoundary>
      )}

      {/* TAB: Multi-Account Device Clusters & Flag-Only Governance */}
      {activeTab === 'clusters' && (
        <ScreenBoundary fallbackTitle="Multi-Account Detection & Device Clusters">
          <AdminDeviceClustersTab
            clusters={deviceClusters}
            alerts={multiAccountAlerts}
            onRefresh={fetchDeviceClusters}
            onClusterAction={adminClusterAction}
          />
        </ScreenBoundary>
      )}

      {/* TAB 3: User Accounts & Direct Balance Control */}
      {activeTab === 'users' && (
        <div className="clay-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
            <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              Registered Accounts ({allUsers.length})
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchUsers()}
                className="px-2 py-1 bg-white hover:bg-slate-50 text-[#7A6B5D] rounded-lg border border-[#E8E0D5] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                title="Refresh from Neon PostgreSQL"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Sync Neon</span>
              </button>
              <div className="relative w-36">
                <Search className="w-3.5 h-3.5 text-[#8C7A6B] absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="w-full clay-inset pl-7 pr-2 py-1 text-[11px] text-[#2D241E] bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isLoadingUsers && allUsers.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#D97706] border-t-transparent"></div>
                <p className="text-xs text-[#7A6B5D] font-medium">Querying live accounts directly from Neon PostgreSQL...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#7A6B5D] bg-white/50 rounded-xl border border-dashed border-[#EFE8DF]">
                No user accounts found matching your search.
              </div>
            ) : (
              filteredUsers.map(u => (
              <div
                key={u.id}
                className="p-3 rounded-2xl clay-card-soft space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#2D241E]">{u.username}</span>
                      <span className="px-1.5 py-0.5 bg-white text-[#4A3E35] text-[9px] font-bold rounded border border-[#E8E0D5]">
                        {u.role}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        u.status === 'Active' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {u.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7A6B5D] font-mono">{u.email}</span>
                    <span className="text-[10px] text-[#8C7A6B] block">
                      Ref: <strong className="font-mono">{u.referral_code}</strong> | PIN: <strong className="font-mono">{u.security_pin}</strong>
                    </span>
                  </div>

                  {/* Switch User or Toggle Status */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adminToggleUserStatus(u.id)}
                      className="p-1.5 bg-white hover:bg-slate-50 text-[#7A6B5D] rounded-lg border border-[#E8E0D5] text-[10px] font-bold cursor-pointer"
                      title="Toggle Ban / Active"
                    >
                      {u.status === 'Active' ? <UserX className="w-3.5 h-3.5 text-rose-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => {
                        switchUser(u.role);
                        setActiveScreen('home');
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-50 text-[#2D241E] rounded-lg border border-[#E8E0D5] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Impersonate</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => fetchAuditLogs(u)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="View Balance Audit Logs"
                    >
                      <Eye className="w-3 h-3 text-amber-700" />
                      <span>Audit Logs</span>
                    </button>
                    <button
                      disabled={processingId === `reconcile_${u.id}`}
                      onClick={async () => {
                        setProcessingId(`reconcile_${u.id}`);
                        try {
                          await adminReconcileUser(u.id);
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Reconcile balance & total inflow from settled transactions"
                    >
                      {processingId === `reconcile_${u.id}` ? (
                        <div className="w-3 h-3 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-emerald-700" />
                      )}
                      <span>Reconcile</span>
                    </button>
                  </div>
                </div>

                {/* Balances & Direct Adjusters */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-white p-2 rounded-xl border border-[#E8E0D5]">
                  <div>
                    <span className="text-[#7A6B5D] block font-semibold">Vault</span>
                    <strong className="font-mono text-emerald-700">₹{(u.vault_balance ?? 0).toFixed(0)}</strong>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <button
                        onClick={() => adminUpdateUserBalance(u.id, 'vault_balance', 500)}
                        className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold hover:bg-emerald-100 cursor-pointer"
                      >
                        +₹500
                      </button>
                      <button
                        onClick={() => adminUpdateUserBalance(u.id, 'vault_balance', -500)}
                        className="px-1.5 py-0.5 bg-rose-50 text-rose-800 rounded font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        -₹500
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#7A6B5D] block font-semibold">Deposit</span>
                    <strong className="font-mono text-[#2D241E]">₹{(u.deposit_balance ?? 0).toFixed(0)}</strong>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <button
                        onClick={() => adminUpdateUserBalance(u.id, 'deposit_balance', 1000)}
                        className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold hover:bg-emerald-100 cursor-pointer"
                      >
                        +₹1k
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#7A6B5D] block font-semibold">Commissions</span>
                    <strong className="font-mono text-purple-700">₹{(u.total_commissions ?? 0).toFixed(0)}</strong>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <button
                        onClick={() => adminUpdateUserBalance(u.id, 'total_commissions', 200)}
                        className="px-1.5 py-0.5 bg-purple-50 text-purple-800 rounded font-bold hover:bg-purple-100 cursor-pointer"
                      >
                        +₹200
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )))}
          </div>
        </div>
      )}

      {/* TAB 4: Rates & Financial Rules Config */}
      {activeTab === 'rates' && (
        <div className="clay-card p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
            <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              Real-time Exchange Rates & Commission Rules
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold">Auto-persisted</span>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  1 USDT to INR Exchange Rate *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRateInput}
                    onChange={e => setExchangeRateInput(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                    INR
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Base Deposit Cashback Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={cashbackRateInput}
                    onChange={e => setCashbackRateInput(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Level A Referral Commission (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={directReferralInput}
                    onChange={e => setDirectReferralInput(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Level B Indirect Referral Commission (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={indirectReferralInput}
                    onChange={e => setIndirectReferralInput(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Level C (Level 3) Referral Commission (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={level3ReferralInput}
                    onChange={e => setLevel3ReferralInput(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Account Binding Bonus Reward *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={bindingBonusInput}
                    onChange={e => setBindingBonusInput(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                    INR
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="clay-btn-emerald w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Update Platform Financial Rates</span>
            </button>
          </form>

          {/* Deposit & Withdrawal Limits & Fee Configuration */}
          <div className="pt-4 border-t border-[#EFE8DF] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                Deposit & Withdrawal Limits & Fee Settings
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold">Auto-persisted</span>
            </div>

            <form onSubmit={handleSaveLimits} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Minimum Deposit Amount (USDT) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={minDepositInput}
                      onChange={e => setMinDepositInput(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      USDT
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Maximum Deposit Amount (USDT) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={maxDepositInput}
                      onChange={e => setMaxDepositInput(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      USDT
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Minimum Withdrawal Amount (INR) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={minWithdrawInput}
                      onChange={e => setMinWithdrawInput(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      INR
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Maximum Withdrawal Amount (INR) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={maxWithdrawInput}
                      onChange={e => setMaxWithdrawInput(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      INR
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Withdrawal Processing Fee (INR) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={withdrawFeeInput}
                      onChange={e => setWithdrawFeeInput(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-[#7A6B5D] font-bold">
                      INR
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="clay-btn-emerald w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Update Deposit/Withdrawal Limits & Fees</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: Task Rewards Management */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="clay-card p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                  Platform Task Catalogue ({tasks.length})
                </h3>
              </div>

              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="clay-btn-emerald px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingTask ? 'Close Form' : 'Create Task'}</span>
              </button>
            </div>

            {/* Create Task Form */}
            {isAddingTask && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!newTaskTitle.trim()) {
                    showToast('Please enter a task title.');
                    return;
                  }
                  const pts = parseInt(newTaskPoints, 10) || 100;
                  const rewardInr = parseFloat(newTaskRewardInr) || pts;
                  const targetCount = parseInt(newTaskTarget, 10) || 1;
                  const targetAmt = parseFloat(newTaskTargetAmount) || 0;

                  adminAddTask({
                    title: newTaskTitle.trim(),
                    category: newTaskCategory,
                    task_type: newTaskType,
                    action_type: newTaskActionType,
                    reward_points: pts,
                    reward_amount_inr: rewardInr,
                    action_link: newTaskActionLink.trim(),
                    verification_type: newTaskVerificationType,
                    target_count: targetCount,
                    target_amount: targetAmt > 0 ? targetAmt : targetCount,
                    description: newTaskDesc.trim() || `Complete ${newTaskTitle.trim()} to earn ₹${rewardInr}.`,
                  });

                  // Reset form
                  setNewTaskTitle('');
                  setNewTaskDesc('');
                  setNewTaskPoints('100');
                  setNewTaskRewardInr('100');
                  setNewTaskActionLink('');
                  setNewTaskVerificationType('instant');
                  setNewTaskTarget('1');
                  setNewTaskTargetAmount('0');
                  setIsAddingTask(false);
                }}
                className="p-4 bg-gradient-to-br from-amber-50/60 to-orange-50/30 rounded-2xl border border-amber-200/80 space-y-3"
              >
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/50">
                  <span className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Create New Task
                  </span>
                  <span className="text-[10px] text-emerald-800 font-extrabold font-mono">Instant Cash Reward</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Execute 5 Cashback Orders"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      required
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Task Category *
                    </label>
                    <select
                      value={newTaskCategory}
                      onChange={e => setNewTaskCategory(e.target.value as TaskCategory)}
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Daily">Daily (Recurring 24h)</option>
                      <option value="Team Growth">Team Growth (Referrals)</option>
                      <option value="Newbie">Newbie (Onboarding)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Task Logic Type *
                    </label>
                    <select
                      value={newTaskType}
                      onChange={e => {
                        const val = e.target.value;
                        setNewTaskType(val);
                        if (val === 'bind_payment') setNewTaskActionType('bind');
                        else if (val === 'deposit') setNewTaskActionType('deposit');
                        else if (val === 'invite_active') setNewTaskActionType('invite');
                        else if (val === 'withdrawal') setNewTaskActionType('trade');
                        else if (val === 'claim_cashback') setNewTaskActionType('claim');
                      }}
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="deposit">deposit (USDT Deposit)</option>
                      <option value="bind_payment">bind_payment (Verified Tool)</option>
                      <option value="invite_active">invite_active (Active Friends)</option>
                      <option value="claim_cashback">claim_cashback (Cashback)</option>
                      <option value="withdrawal">withdrawal (Withdrawals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Reward Amount (₹ INR) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="100"
                        value={newTaskPoints}
                        onChange={e => {
                          setNewTaskPoints(e.target.value);
                          setNewTaskRewardInr(e.target.value);
                        }}
                        required
                        className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-emerald-800 font-extrabold">
                        ₹{newTaskPoints || 0} INR
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Target Count *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      value={newTaskTarget}
                      onChange={e => setNewTaskTarget(e.target.value)}
                      required
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Threshold Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      value={newTaskTargetAmount}
                      onChange={e => setNewTaskTargetAmount(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Reward Amount (INR) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newTaskRewardInr}
                      onChange={e => setNewTaskRewardInr(e.target.value)}
                      required
                      className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Task Action Link *
                    </label>
                    <input
                      type="text"
                      placeholder="https://t.me/juspay_channel"
                      value={newTaskActionLink}
                      onChange={e => setNewTaskActionLink(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                      Verification Type *
                    </label>
                    <select
                      value={newTaskVerificationType}
                      onChange={e => setNewTaskVerificationType(e.target.value as 'instant' | 'manual')}
                      className="w-full clay-inset px-3 py-2 text-xs font-semibold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="instant">Instant Automatic Verification</option>
                      <option value="manual">Manual Screenshot Proof Verification</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                    Task Description / Requirement Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide simple instructions for user to complete the task..."
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save & Publish Task</span>
                  </button>
                </div>
              </form>
            )}

            {/* Filter Tabs */}
            {(() => {
              const baseCats = ['All', 'Newbie', 'Daily', 'Team Growth'];
              const customCats = Array.from(new Set(tasks.map(t => {
                const low = (t.category || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
                if (low.includes('newbie') || low.includes('onboard') || low.includes('starter')) return 'Newbie';
                if (low.includes('team') || low.includes('growth') || low.includes('referral') || low.includes('invite')) return 'Team Growth';
                if (low.includes('daily') || low.includes('recurring')) return 'Daily';
                return t.category || 'Daily';
              }).filter(Boolean)));
              const allFilterCats = Array.from(new Set([...baseCats, ...customCats]));
              return (
                <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-1">
                  {allFilterCats.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTaskCategoryFilter(cat as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        taskCategoryFilter === cat
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Tasks List */}
            {(() => {
              const normalizeCat = (c?: string) => {
                const low = (c || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
                if (low.includes('newbie') || low.includes('onboard') || low.includes('starter')) return 'Newbie';
                if (low.includes('team') || low.includes('growth') || low.includes('referral') || low.includes('invite')) return 'Team Growth';
                if (low.includes('daily') || low.includes('recurring')) return 'Daily';
                return c || 'Daily';
              };
              const visibleTasks = tasks.filter(t => taskCategoryFilter === 'All' || normalizeCat(t.category) === taskCategoryFilter);
              if (visibleTasks.length === 0) {
                return (
                  <div className="py-8 text-center space-y-2">
                    <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">No tasks found in this category.</p>
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="text-xs text-amber-800 font-bold hover:underline cursor-pointer"
                    >
                      Click here to create a new task
                    </button>
                  </div>
                );
              }
              return (
                <div className="space-y-2.5 pt-1">
                  {visibleTasks.map(task => {
                    const categoryColors: Record<string, string> = {
                      Daily: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      'Team Growth': 'bg-purple-50 text-purple-800 border-purple-200',
                      Newbie: 'bg-amber-50 text-amber-800 border-amber-200',
                    };
                    const catKey = normalizeCat(task.category);
                    const colorClass = categoryColors[catKey] || 'bg-slate-50 text-slate-800 border-slate-200';

                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-2xl clay-card-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-amber-200"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${colorClass}`}>
                              {task.category}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                              {task.task_type || task.action_type}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${task.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {task.is_active !== false ? 'Active' : 'Disabled'}
                            </span>
                            <span className="font-bold text-xs text-slate-800 truncate">
                              {task.title}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#7A6B5D] line-clamp-2">
                            {task.description}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-[#8C7A6B] font-mono pt-0.5 flex-wrap">
                            <span>Target: {task.target_count || task.target_amount}</span>
                            {task.target_amount > 0 && task.target_amount !== (task.target_count || 1) && (
                              <span>• Threshold: ₹{task.target_amount.toLocaleString('en-IN')}</span>
                            )}
                            {task.action_link && (
                              <span className="text-blue-700 font-semibold">• Link: {task.action_link}</span>
                            )}
                            <span className="text-purple-700 font-semibold">• Verification: {task.verification_type || 'instant'}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">
                              Reward: +₹{task.reward_amount_inr || task.reward_points} INR
                            </span>
                            <span>•</span>
                            <span>ID: {task.id}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:self-center self-end flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(task);
                              setEditTaskTitle(task.title);
                              setEditTaskCategory(task.category);
                              setEditTaskType(task.task_type || task.action_type || 'deposit');
                              setEditTaskPoints(String(task.reward_points));
                              setEditTaskRewardInr(String(task.reward_amount_inr || task.reward_points));
                              setEditTaskActionLink(task.action_link || '');
                              setEditTaskVerificationType(task.verification_type || 'instant');
                              setEditTaskTarget(String(task.target_count || 1));
                              setEditTaskTargetAmount(String(task.target_amount || 0));
                              setEditTaskDesc(task.description);
                              setEditTaskActive(task.is_active !== false);
                            }}
                            className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-all border border-amber-200 bg-white cursor-pointer"
                            title="Edit Task Requirements"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => adminToggleTask(task.id)}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                              task.is_active !== false
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Active / Inactive"
                          >
                            {task.is_active !== false ? 'Active' : 'Disabled'}
                          </button>
                          <span className="clay-badge px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            +₹{task.reward_amount_inr || task.reward_points}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove task "${task.title}"?`)) {
                                adminDeleteTask(task.id);
                              }
                            }}
                            className="p-2 text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-rose-200 bg-white cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Edit Task Modal */}
            {editingTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Edit Task Requirements</h3>
                        <p className="text-[11px] text-slate-500">ID: {editingTask.id} • Updates instantly on DB & Client</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingTask(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (!editTaskTitle.trim()) {
                        showToast('Task title cannot be empty.');
                        return;
                      }
                      const pts = parseInt(editTaskPoints, 10) || 100;
                      const count = parseInt(editTaskTarget, 10) || 1;
                      const amount = parseFloat(editTaskTargetAmount) || 0;
                      const rewardInr = parseFloat(editTaskRewardInr) || pts;

                      adminEditTask(editingTask.id, {
                        title: editTaskTitle.trim(),
                        description: editTaskDesc.trim() || `Complete ${editTaskTitle.trim()} to earn ₹${rewardInr}.`,
                        category: editTaskCategory,
                        task_type: editTaskType,
                        action_type: (editTaskType === 'bind_payment' ? 'bind' : editTaskType === 'invite_active' ? 'invite' : editTaskType === 'withdrawal' ? 'trade' : editTaskType === 'claim_cashback' ? 'claim' : 'deposit') as TaskActionType,
                        reward_points: pts,
                        reward_amount_inr: rewardInr,
                        action_link: editTaskActionLink.trim(),
                        verification_type: editTaskVerificationType,
                        target_count: count,
                        target_amount: amount > 0 ? amount : count,
                        is_active: editTaskActive
                      });

                      setEditingTask(null);
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Task Title *
                        </label>
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={e => setEditTaskTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Task Category *
                        </label>
                        <select
                          value={editTaskCategory}
                          onChange={e => setEditTaskCategory(e.target.value as TaskCategory)}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        >
                          <option value="Daily">Daily (Recurring 24h)</option>
                          <option value="Team Growth">Team Growth (Referrals)</option>
                          <option value="Newbie">Newbie (Onboarding)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Logic Type *
                        </label>
                        <select
                          value={editTaskType}
                          onChange={e => setEditTaskType(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        >
                          <option value="deposit">deposit (USDT Deposit)</option>
                          <option value="bind_payment">bind_payment (Verified Tool)</option>
                          <option value="invite_active">invite_active (Active Friends)</option>
                          <option value="claim_cashback">claim_cashback (Cashback)</option>
                          <option value="withdrawal">withdrawal (Withdrawals)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Reward Amount (₹ INR) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editTaskPoints}
                          onChange={e => {
                            setEditTaskPoints(e.target.value);
                            setEditTaskRewardInr(e.target.value);
                          }}
                          required
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Target Count *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editTaskTarget}
                          onChange={e => setEditTaskTarget(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Reward Amount (INR) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editTaskRewardInr}
                          onChange={e => setEditTaskRewardInr(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Task Action Link *
                        </label>
                        <input
                          type="text"
                          value={editTaskActionLink}
                          onChange={e => setEditTaskActionLink(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Verification Type *
                        </label>
                        <select
                          value={editTaskVerificationType}
                          onChange={e => setEditTaskVerificationType(e.target.value as 'instant' | 'manual')}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        >
                          <option value="instant">Instant Automatic Verification</option>
                          <option value="manual">Manual Screenshot Proof Verification</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Threshold Amount (₹ INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={editTaskTargetAmount}
                          onChange={e => setEditTaskTargetAmount(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Status
                        </label>
                        <div className="flex items-center gap-3 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                              type="checkbox"
                              checked={editTaskActive}
                              onChange={e => setEditTaskActive(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Task is Active</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Task Description / User Requirement Guide
                      </label>
                      <textarea
                        rows={3}
                        value={editTaskDesc}
                        onChange={e => setEditTaskDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingTask(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 bg-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="clay-btn-emerald px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Apply Updates</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Verification Queue Section */}
          <div className="clay-card p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EFE8DF]">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                Pending Manual Screenshot Proof Queue ({taskSubmissions.filter(s => s.status === 'pending').length})
              </h3>
            </div>

            {taskSubmissions.filter(s => s.status === 'pending').length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7A6B5D] font-medium font-mono">
                ✨ No pending screenshot proof submissions to verify.
              </div>
            ) : (
              <div className="space-y-3">
                {taskSubmissions
                  .filter(s => s.status === 'pending')
                  .map((sub: any) => (
                    <div key={sub.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#2D241E]">User ID: {sub.user_id}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-sm font-bold font-mono">
                            Task: {sub.task_id}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6B5D] font-semibold">
                          Submitted At: {new Date(sub.created_at).toLocaleString()}
                        </p>
                        {sub.screenshot_url && (
                          <div className="pt-1.5">
                            <span className="block text-[10px] text-slate-500 font-bold mb-1">Proof Screenshot:</span>
                            <a 
                              href={sub.screenshot_url} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              rel="noreferrer" 
                              className="inline-block"
                            >
                              <img 
                                src={sub.screenshot_url} 
                                alt="Proof screenshot" 
                                referrerPolicy="no-referrer"
                                className="max-w-xs max-h-32 rounded-lg border border-slate-300 hover:opacity-95 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => {
                            if (window.confirm('Approve submission and credit reward points?')) {
                              handleApproveTaskSubmission(sub.id);
                            }
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Reject submission and dismiss proof?')) {
                              handleRejectTaskSubmission(sub.id);
                            }
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SLA Notices Dynamic Management */}
      {activeTab === 'notices' && (
        <AdminSlaNoticesTab />
      )}

      {/* TAB 6: Payment Wallet Binding Management */}
      {activeTab === 'wallets' && (
        <div className="clay-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
            <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              Bound User Wallets ({userWallets.length})
            </h3>
          </div>

          <div className="space-y-3">
            {userWallets.map(w => {
              const owner = allUsers.find(u => u.id === w.user_id);

              return (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl clay-card-soft flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#2D241E]">{w.provider_name}</span>
                      <span className="px-1.5 py-0.5 bg-white text-[#4A3E35] text-[9px] font-bold rounded border border-[#E8E0D5]">
                        {w.type}
                      </span>
                      {w.has_binding_bonus && (
                        <span className="px-1.5 py-0.5 clay-badge bg-amber-400 text-amber-950 text-[9px] font-extrabold">
                          Bonus
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#4A3E35] mt-0.5">{w.account_number}</p>
                    <span className="text-[10px] text-[#8C7A6B] block">
                      Owner: {owner?.username || w.user_id} ({w.holder_name})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {w.bound_status === 'Pending' && (
                      <button
                        onClick={() => adminApproveWallet(w.id)}
                        className="px-2.5 py-1 clay-btn-emerald text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => adminDeleteWallet(w.id)}
                      className="px-2.5 py-1 bg-white text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 hover:bg-rose-50 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: Automated Email Logs Viewer */}
      {activeTab === 'emails' && (
        <div className="clay-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                Automated Dispatched Email Logs ({emailLogs.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-900 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Live Audit Log
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {emailLogs.map(eml => (
              <div
                key={eml.id}
                className="p-3.5 rounded-2xl clay-card-soft space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-[9px] rounded uppercase border border-blue-200">
                      {eml.type}
                    </span>
                    <h4 className="font-bold text-xs text-[#2D241E] mt-1">{eml.subject}</h4>
                    <span className="text-[10px] text-[#7A6B5D] font-mono">To: {eml.recipient_email}</span>
                  </div>
                  <span className="text-[10px] text-[#8C7A6B] flex-shrink-0">{eml.sent_at}</span>
                </div>

                <p className="text-xs text-[#4A3E35] bg-white p-2.5 rounded-xl border border-[#E8E0D5] whitespace-pre-line font-sans leading-relaxed">
                  {eml.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {auditLogUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DF]">
              <div>
                <h3 className="font-bold text-[#2D241E] text-sm flex items-center gap-2">
                  <span>Balance Audit Logs</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-mono font-normal">
                    {auditLogUser.email}
                  </span>
                </h3>
                <p className="text-[11px] text-[#7A6B5D] mt-0.5">
                  Last 10 balance adjustment events and ledger changes
                </p>
              </div>
              <button
                onClick={() => setAuditLogUser(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-[#7A6B5D] font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingAuditLogs ? (
              <div className="py-12 text-center text-sm text-[#7A6B5D]">
                Loading audit logs...
              </div>
            ) : auditLogsList.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#7A6B5D] bg-[#FDFBF7] rounded-2xl border border-[#EFE8DF]">
                No balance audit log entries recorded yet for this user.
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogsList.map((log: any) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E8E0D5] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] rounded uppercase font-mono">
                        {log.adjustment_type}
                      </span>
                      <span className="text-[10px] text-[#8C7A6B] font-mono">
                        {formatISTTimestamp(log.created_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-[#8C7A6B] block text-[9px] uppercase font-semibold">Tx ID / Order</span>
                        <strong className="font-mono text-[#2D241E] truncate block">{log.transaction_id || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[#8C7A6B] block text-[9px] uppercase font-semibold">Amount Adjusted</span>
                        <strong className={`font-mono ${Number(log.amount_adjusted) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {Number(log.amount_adjusted) >= 0 ? '+' : ''}₹{Number(log.amount_adjusted).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#8C7A6B] block text-[9px] uppercase font-semibold">Previous Balance</span>
                        <strong className="font-mono text-[#7A6B5D]">₹{Number(log.previous_balance).toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-[#8C7A6B] block text-[9px] uppercase font-semibold">New Balance</span>
                        <strong className="font-mono text-[#2D241E]">₹{Number(log.new_balance).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#EFE8DF] flex justify-end">
              <button
                onClick={() => setAuditLogUser(null)}
                className="px-4 py-2 bg-[#2D241E] text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Lightbox */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clay-card p-4 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#2D241E] text-xs">Transaction Receipt</h4>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] cursor-pointer"
              >
                Close
              </button>
            </div>
            <img
              src={selectedProofUrl}
              alt="Receipt Preview"
              className="w-full rounded-2xl max-h-80 object-contain border border-[#E8E0D5]"
            />
          </div>
        </div>
      )}

    </div>
  );
};
