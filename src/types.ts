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
  kyc_status?: KycStatus;
  kyc_rejection_reason?: string;
  kyc_verified_at?: string;
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
  currency?: CurrencyType;
  status: TransactionStatus | string;
  timestamp?: string;
  created_at?: string;
  createdAt?: string;
  description?: string;
  tx_hash?: string;
  utr_number?: string;
  proof_screenshot?: string;
  network?: 'TRC20' | 'BSC';
  deposit_method?: 'Crypto' | 'UPI' | 'Bank' | 'Wallet';
  notes?: string;
  tier_info?: 'Level A (4%)' | 'Level B (2%)' | 'Level C (1%)' | string;
  from_user_id?: string;
  wallet_provider?: string;
  wallet_id?: string;
  destination_details?: string;
  account_number?: string;
  holder_name?: string;
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

export type OrderCategoryRange = 
  | 'Top Picks'
  | '100-300'
  | '301-500'
  | '501-2000'
  | '2001-5000'
  | '5001-15000'
  | '15001-50000';

export interface ClaimableOrder {
  id: string;
  code: string;
  amount_inr: number;
  income_inr: number;
  cashback_rate?: number; // e.g. 4.0 or 4.5%
  min_deposit_required?: number; // required cumulative approved deposit threshold
  category_range: OrderCategoryRange | string;
  is_claimed: boolean;
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
  title: string;
  subtitle: string;
  handle: string;
  contact_link: string;
  avatar: string;
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

