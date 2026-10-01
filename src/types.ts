export type UserRole = 'admin' | 'user';
export type UserStatus = 'Active' | 'Banned';

export interface User {
  id: string;
  username: string;
  email: string;
  vault_balance: number;
  total_commissions: number;
  referral_code: string;
  referred_by?: string;
  available_balance?: number;
  deposit_balance?: number;
  withdrawal_balance?: number;
  commission_balance?: number;
  sell_balance?: number;
  selling_cards: number;
  usdt_selling_cards?: number;
  usdt_cards_balance?: number;
  welcome_cards_claimed?: boolean;
  welcome_cards_claimed_at?: string | null;
  has_claimed_signup_cards?: boolean;
  signup_cards_claimed?: boolean;
  last_claim_cycle_epoch?: number | string;
  last_card_claimed_at?: string | null;
  last_card_claim_timestamp?: number | string;
  security_pin: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  points: number;
  reward_points?: number;
  total_inflow?: number;
  usdt_balance?: number;
  locked_balance?: number;
  total_paid_withdrawals?: number;
  total_rewards?: number;
  total_platform_income?: number;
  totalPlatformIncome?: number;
  kyc_status?: KycStatus;
  kyc_rejection_reason?: string;
  kyc_verified_at?: string;
  referralCode?: string;
  referredBy?: string;
  upline_code?: string;
  referrer_id?: string;
  upline_l2_code?: string;
  upline_l3_code?: string;
  referral_link?: string;
  total_deposit?: number;
  total_ref_earning?: number;
  affiliate_commission_total?: number;
  commission_earned_inr?: number;
  has_active_withdrawal?: boolean;
  active_pending_order?: string | null;
  inr_balance?: number;
  token?: string;
  created_at: string;
}

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'APPROVED';
export type KycDocumentType = 'Aadhaar Card' | 'PAN Card' | 'Driving License' | 'Passport';

export interface KycVerification {
  id: string | number;
  user_id: string | number;
  user_email?: string;
  user_name?: string;
  full_name: string;
  dob: string;
  mobile_number?: string;
  address: string;
  state: string;
  pincode: string;
  document_type: KycDocumentType;
  document_number: string;
  front_image_url: string;
  back_image_url?: string;
  status: KycStatus;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export type TransactionType =
  | 'Deposit'
  | 'Withdrawal'
  | 'Reward'
  | 'Reward Redeem'
  | 'reward_redemption'
  | 'Points Redeem'
  | 'Task Points'
  | 'Claim'
  | 'Sell'
  | 'Referral Commission'
  | 'commission'
  | 'REFERRAL_L1'
  | 'REFERRAL_L2'
  | 'Binding Bonus';

export type CurrencyType = 'INR' | 'USDT';
export type TransactionStatus = 'Pending' | 'Completed' | 'Closed' | 'Rejected' | 'settled' | 'Settled' | 'approved' | 'Approved' | 'successful' | 'Successful';

export interface Transaction {
  id: string;
  order_id?: string;
  tx_id?: string;
  user_id: string;
  userId?: string;
  user_email?: string;
  userEmail?: string;
  type: TransactionType | string;
  tier?: 'level_a' | 'level_b' | 'level_c' | string;
  sourceUserId?: string;
  source_user_id?: string;
  sourceUserEmail?: string;
  source_user_email?: string;
  sourceDepositId?: string;
  source_deposit_id?: string;
  amount: number;
  amount_inr?: number;
  amount_usdt?: number;
  fee?: number;
  withdrawal_fee?: number;
  net_amount?: number;
  currency?: CurrencyType;
  status: TransactionStatus | string;
  timestamp?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  description?: string;
  tx_hash?: string;
  utr_number?: string;
  bank_utr?: string;
  proof_screenshot?: string;
  screenshot_base64?: string;
  network?: 'TRC20' | 'BSC' | 'BEP20' | string;
  deposit_method?: 'Crypto' | 'UPI' | 'Bank' | 'Wallet' | string;
  payment_method?: string;
  payment_details?: string;
  account_details?: string;
  wallet_address?: string;
  notes?: string;
  admin_notes?: string;
  admin_remarks?: string;
  rejection_reason?: string;
  tier_info?: 'Level A (4%)' | 'Level B (2%)' | 'Level C (1%)' | string;
  from_user_id?: string;
  wallet_provider?: string;
  wallet_id?: string;
  destination_details?: string;
  account_number?: string;
  holder_name?: string;
  ifsc_code?: string;
  upi_id?: string;
  bank_name?: string;
  commission_paid?: boolean; // idempotency tracking flag to prevent duplicate payouts
  metadata?: { tier?: 'level_a' | 'level_b' | 'level_c' | string; sourceUserId?: string; sourceUserEmail?: string; sourceDepositId?: string; [key: string]: any };
}

export type TaskCategory = 'Newbie' | 'Team Growth' | 'Daily' | 'newbie' | 'team_growth' | 'daily';
export type TaskActionType = 'bind' | 'deposit' | 'invite' | 'trade' | 'claim' | 'bind_payment' | 'invite_active' | 'claim_cashback' | 'withdrawal';

export interface Task {
  id: string;
  category: TaskCategory;
  title: string;
  description: string;
  reward_points: number;
  reward_amount_inr?: number;
  action_link?: string;
  verification_type?: 'instant' | 'manual';
  target_amount: number;
  target_count?: number;
  current_progress: number;
  action_type: TaskActionType;
  task_type?: 'bind_payment' | 'deposit' | 'invite_active' | 'claim_cashback' | 'withdrawal' | string;
  is_active?: boolean;
  completed: boolean;
  claimed: boolean;
}

export interface CashbackBracket {
  id: string;
  key: string;
  name: string;
  min_amount: number;
  max_amount: number;
  default_cashback_rate: number;
  badge?: string;
  highlight?: boolean;
  display_order: number;
  is_active: boolean;
  description?: string;
  created_at?: string;
}

export const DEFAULT_CASHBACK_BRACKETS: CashbackBracket[] = [
  { id: 'brk_1', key: 'Top Picks', name: '🔥 Top Picks', min_amount: 0, max_amount: 50000, default_cashback_rate: 4.0, badge: '🔥', highlight: true, display_order: 1, is_active: true, description: 'Featured high conversion picks' },
  { id: 'brk_2', key: '100-300', name: '₹100 - ₹300', min_amount: 100, max_amount: 300, default_cashback_rate: 4.0, badge: '⚡', highlight: false, display_order: 2, is_active: true, description: 'Micro entry deposits' },
  { id: 'brk_3', key: '301-500', name: '₹301 - ₹500', min_amount: 301, max_amount: 500, default_cashback_rate: 4.0, badge: '⚡', highlight: false, display_order: 3, is_active: true, description: 'Starter tier deposit offers' },
  { id: 'brk_4', key: '501-2000', name: '₹501 - ₹2,000', min_amount: 501, max_amount: 2000, default_cashback_rate: 4.0, badge: '⚡', highlight: false, display_order: 4, is_active: true, description: 'Popular retail tier' },
  { id: 'brk_5', key: '2001-5000', name: '₹2,001 - ₹5,000', min_amount: 2001, max_amount: 5000, default_cashback_rate: 4.5, badge: '🚀', highlight: false, display_order: 5, is_active: true, description: 'Mid tier growth bracket' },
  { id: 'brk_6', key: '5001-15000', name: '₹5,001 - ₹15,000', min_amount: 5001, max_amount: 15000, default_cashback_rate: 5.0, badge: '✨', highlight: false, display_order: 6, is_active: true, description: 'High yield merchant bracket' },
  { id: 'brk_7', key: '15001-50000', name: '💎 ₹15,001 - ₹50,000', min_amount: 15001, max_amount: 50000, default_cashback_rate: 5.0, badge: '💎', highlight: true, display_order: 7, is_active: true, description: 'High volume VIP tier' }
];

export type OrderCategoryRange = string;

export const parseOrderCategoryRanges = (raw?: string | string[] | null, amount?: number): string[] => {
  const validRanges = [
    'Top Picks',
    '100-300',
    '301-500',
    '501-2000',
    '2001-5000',
    '5001-15000',
    '15001-50000'
  ];

  if (Array.isArray(raw)) {
    const list = raw
      .map(r => String(r || '').trim())
      .filter(Boolean);
    if (list.length > 0) return Array.from(new Set(list));
  }

  if (raw && typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set(parsed.map((p: any) => String(p).trim()).filter(Boolean)));
        }
      } catch (e) {
        // fallthrough to delimiter parsing
      }
    }

    // Split by comma, pipe, or semicolon
    if (trimmed.includes(',') || trimmed.includes('|') || trimmed.includes(';')) {
      const parts = trimmed
        .split(/[,|;]/)
        .map(p => p.trim())
        .filter(Boolean);
      if (parts.length > 0) {
        return Array.from(new Set(parts));
      }
    }

    if (validRanges.includes(trimmed)) {
      return [trimmed];
    }
  }

  // Fallback to single normalized category from amount or raw
  const single = normalizeOrderCategoryRange(typeof raw === 'string' ? raw : null, amount);
  return [single];
};

export const orderMatchesCategory = (
  order: { category_range?: string; category_ranges?: string[]; amount_inr?: number; is_top_pick?: boolean },
  targetCategory: string
): boolean => {
  if (!targetCategory || targetCategory === 'All' || targetCategory === 'all') return true;

  const target = targetCategory.trim().toLowerCase();
  if (target === 'top picks' && order.is_top_pick) return true;

  const ranges = parseOrderCategoryRanges(order.category_ranges || order.category_range, order.amount_inr);
  return ranges.some(r => r.trim().toLowerCase() === target || r.trim() === targetCategory.trim());
};

export const normalizeOrderCategoryRange = (rawCategory?: string | null, amount?: number): OrderCategoryRange => {
  const validRanges: OrderCategoryRange[] = [
    'Top Picks',
    '100-300',
    '301-500',
    '501-2000',
    '2001-5000',
    '5001-15000',
    '15001-50000'
  ];

  if (rawCategory && typeof rawCategory === 'string') {
    const trimmed = rawCategory.trim();
    if (validRanges.includes(trimmed as OrderCategoryRange)) {
      return trimmed as OrderCategoryRange;
    }
    const s = trimmed.toLowerCase();
    if (s.includes('top')) return 'Top Picks';
    if (s.includes('15001') || s.includes('50000') || s.includes('15k') || s.includes('50k')) return '15001-50000';
    if (s.includes('5001') || s.includes('15000') || s.includes('15k')) return '5001-15000';
    if (s.includes('2001') || s.includes('5000') || s.includes('5k')) return '2001-5000';
    if (s.includes('501') || s.includes('2000') || s.includes('2k')) return '501-2000';
    if (s.includes('301') || s.includes('500')) return '301-500';
    if (s.includes('100') || s.includes('300')) return '100-300';
  }

  const amt = Number(amount || 0);
  if (amt > 15000) return '15001-50000';
  if (amt > 5000) return '5001-15000';
  if (amt > 2000) return '2001-5000';
  if (amt > 500) return '501-2000';
  if (amt > 300) return '301-500';
  if (amt >= 100) return '100-300';
  return 'Top Picks';
};

export interface ClaimableOrder {
  id: string;
  code: string;
  amount_inr: number;
  income_inr: number;
  cashback_rate?: number; // e.g. 4.0 or 4.5%
  min_deposit_required?: number; // required cumulative approved deposit threshold
  category_range: OrderCategoryRange | string;
  category_ranges?: string[];
  is_top_pick?: boolean;
  is_claimed: boolean;
  is_active?: boolean;
  created_at?: string;
  notes?: string;
}

export type WalletType = 'Personal' | 'Business';

export interface UserWallet {
  id: string;
  user_id: string;
  type: WalletType;
  provider_name: string;
  account_number: string;
  holder_name: string;
  has_binding_bonus: boolean;
  bound_status: 'Active' | 'Pending';
  created_at: string;
}

export interface StatisticsOperations {
  realtime_exchange_rate: number; // e.g. 111 INR per 1 USDT
  in_process_amount: number;
  in_process_orders: number;
  commission_rate: number; // default 4.00%
  selling_state: 'Open' | 'Closed';
  direct_referral_rate: number; // 5.0%
  indirect_referral_rate: number; // 2.5%
  level_3_referral_rate?: number; // 1.0%
  binding_bonus_amount: number; // 50 INR
  global_announcement?: string;
  global_announcements?: SLAAnnouncement[];
  min_deposit?: number;
  max_deposit?: number;
  min_withdraw?: number;
  max_withdraw?: number;
  withdraw_fee?: number;
  withdrawal_fee?: number;
  sla_badge_text?: string;
  sla_banner_enabled?: boolean;
  total_platform_income?: number;
  totalPlatformIncome?: number;
  trc20_address?: string;
  bep20_address?: string;
  trc20_qr_code?: string;
  bep20_qr_code?: string;
}

export interface SLAAnnouncement {
  id: string;
  badge?: string; // e.g. "SLA NOTICE", "SYSTEM UPDATE", "PAYOUT GUARANTEE"
  message: string;
  priority?: 'normal' | 'urgent' | 'highlight';
  is_active: boolean;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'Deposit' | 'Withdrawal' | 'System' | 'Commission' | 'Reward' | 'Notice' | 'KYC';
  is_read: boolean;
  created_at: string;
  badge?: string;
  priority?: 'normal' | 'urgent' | 'highlight';
}

export interface SupportChannel {
  id: string;
  channel_id?: string;
  title: string;
  subtitle: string;
  handle: string;
  contact_link: string;
  avatar: string;
  channel_type?: 'whatsapp' | 'telegram' | 'email' | 'phone' | 'livechat' | 'other';
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AutomatedEmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
  type: 'Deposit Approval' | 'Withdrawal Receipt' | 'OTP' | 'Binding Alert';
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  type: 'Personal' | 'Business' | 'Bank';
  payin_min: number;
  payin_max: number;
  payout_min: number;
  payout_max: number;
  min_payin_inr?: number;
  max_payin_inr?: number;
  min_payout_inr?: number;
  max_payout_inr?: number;
  has_bonus: boolean;
  bonus_percentage?: number;
  bonus_amount?: number;
  color?: string;
  icon_text?: string;
  logo_url?: string;
  sub_label?: string;
  upi_id?: string;
  official_upi_id?: string;
  qr_code_url?: string;
  is_active: boolean;
  sort_order?: number;
  sort_priority?: number;
}

export interface CryptoVaultConfig {
  id: string;
  symbol: string;
  network: string; // e.g., 'TRC20', 'BSC', 'ERC20', 'Polygon'
  network_name: string; // e.g., 'Tron (TRC20)', 'BNB Smart Chain (BEP20)'
  wallet_address: string;
  qr_code_url?: string;
  min_deposit: number;
  confirmations_required: number;
  is_active: boolean;
  notes?: string;
}

export interface OfficialPlatformAccountConfig {
  upi_id: string;
  beneficiary_name: string;
  qr_code_url?: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  account_type: string;
}

// -------------------------------------------------------------
// MULTI-ACCOUNT DETECTION & DEVICE FINGERPRINTING TYPES
// -------------------------------------------------------------

export type ClusterStatus = 'FLAGGED' | 'REVIEWED' | 'WHITELISTED' | 'DISMISSED';
export type ClusterRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DeviceFingerprintComponents {
  userAgent: string;
  platform: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
  hardwareConcurrency?: number;
  touchSupport: boolean;
  canvasHash?: string;
  webglVendor?: string;
}

export interface DeviceFingerprintData {
  visitorId: string; // Deterministic hash
  components: DeviceFingerprintComponents;
  persistentToken: string;
  ip?: string;
  createdAt: string;
}

export interface DeviceUserAssociation {
  id: string;
  device_fingerprint: string;
  user_id: string;
  user_email: string;
  username: string;
  event_type: 'REGISTRATION' | 'LOGIN' | 'ACTIVITY';
  ip_address: string;
  user_agent: string;
  os_platform: string;
  screen_res: string;
  timezone: string;
  associated_at: string;
  last_seen_at: string;
}

export interface DeviceClusterAccount {
  user_id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  vault_balance: number;
  available_balance?: number;
  deposit_balance: number;
  created_at: string;
  referral_code?: string;
  referred_by?: string;
  security_pin?: string;
}

export interface DeviceCluster {
  id: string;
  device_fingerprint: string;
  device_label: string; // e.g. "Windows 11 · Chrome 124 (1920x1080)"
  ip_address: string;
  os_platform: string;
  browser_info: string;
  screen_res: string;
  timezone: string;
  associated_user_ids: string[];
  associated_users: DeviceClusterAccount[];
  account_count: number;
  risk_level: ClusterRiskLevel;
  status: ClusterStatus;
  flagged_reason: string;
  first_seen_at: string;
  last_seen_at: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface MultiAccountAlert {
  id: string;
  cluster_id: string;
  device_fingerprint: string;
  title: string;
  description: string;
  account_count: number;
  emails: string[];
  severity: 'Warning' | 'High' | 'Critical';
  is_resolved: boolean;
  created_at: string;
}

export interface AdminAuthSession {
  token: string;
  authenticated_at: number;
  admin_user: {
    id: string;
    username: string;
    role: string;
    email: string;
  };
}

export interface AdminLoginResult {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
}

export type CheerPopupType = 'registration' | 'deposit' | 'withdrawal' | 'selling_card' | 'task_reward';

export interface CheerPopupData {
  isOpen: boolean;
  type: CheerPopupType;
  title: string;
  subtitle: string;
  highlightText?: string;
  badge?: string;
  durationMs?: number;
}

export interface TeamMemberData {
  id: string;
  email: string;
  username: string;
  referral_code?: string;
  referred_by?: string;
  deposit_balance: number;
  total_deposit: number;
  total_deposit_usdt: number;
  vault_balance?: number;
  commission_earned_inr: number;
  commission_earned_usdt: number;
  is_active: boolean;
  active_status: string;
  tier?: string;
  created_at: string;
}

export interface TeamDataResponse {
  success: boolean;
  referral_code: string;
  total_team_deposit_inr: number;
  total_team_deposit_usdt: number;
  team_deposit_inr: number;
  team_deposit: number;
  total_team_deposit: number;
  level1_deposit_inr: number;
  level2_deposit_inr: number;
  level3_deposit_inr: number;
  total_ref_earning_usdt: number;
  total_ref_earning_inr: number;
  level_a_earning_inr: number;
  level_b_earning_inr: number;
  level_c_earning_inr: number;
  l1_count: number;
  l2_count: number;
  l3_count: number;
  total_count: number;
  total_members_count: number;
  l1_active_count: number;
  level1: TeamMemberData[];
  level2: TeamMemberData[];
  level3: TeamMemberData[];
  all_team_members?: TeamMemberData[];
  commissions: any[];
}

