import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight,
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Building2, 
  UserCheck,
  CreditCard,
  ExternalLink,
  Check,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SecurityPinModal } from '../components/SecurityPinModal';
import { WalletType, UserWallet } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export interface ProviderConfig {
  name: string;
  type: WalletType;
  payinLimit: string;
  payoutLimit: string;
  hasBonus: boolean;
  color: string;
  iconText: string;
  logoUrl: string;
  subLabel?: string;
}

export const PERSONAL_PROVIDERS: ProviderConfig[] = [
  { 
    name: 'Paytm UPI / Wallet', 
    type: 'Personal', 
    payinLimit: '₹100 - ₹1,00,000', 
    payoutLimit: '₹500 - ₹50,000', 
    hasBonus: false, 
    color: 'bg-sky-600', 
    iconText: 'Pt',
    logoUrl: '/assets/paytm-icon.svg',
    subLabel: 'UPI & Postpaid Linked'
  },
  { 
    name: 'PhonePe UPI', 
    type: 'Personal', 
    payinLimit: '₹100 - ₹1,00,000', 
    payoutLimit: '₹500 - ₹50,000', 
    hasBonus: false, 
    color: 'bg-purple-700', 
    iconText: 'Pe',
    logoUrl: '/assets/phonepe-icon.svg',
    subLabel: 'Instant UPI Settlement'
  },
  { 
    name: 'Freecharge UPI', 
    type: 'Personal', 
    payinLimit: '₹100 - ₹50,000', 
    payoutLimit: '₹500 - ₹25,000', 
    hasBonus: false, 
    color: 'bg-amber-600', 
    iconText: 'Fc',
    logoUrl: '/assets/freecharge-icon.svg',
    subLabel: 'Axis Bank Network'
  },
  { 
    name: 'BharatPe Merchant', 
    type: 'Personal', 
    payinLimit: '₹500 - ₹2,00,000', 
    payoutLimit: '₹500 - ₹50,000', 
    hasBonus: false, 
    color: 'bg-teal-700', 
    iconText: 'BP',
    logoUrl: '/assets/bharatpe-icon.svg',
    subLabel: '0% MDR QR & POS'
  },
  { 
    name: 'Navi UPI', 
    type: 'Personal', 
    payinLimit: '₹200 - ₹1,00,000', 
    payoutLimit: '₹500 - ₹50,000', 
    hasBonus: false, 
    color: 'bg-emerald-600', 
    iconText: 'Nv',
    logoUrl: '/assets/navi-icon.svg',
    subLabel: 'Next-Gen Cashflow'
  },
  { 
    name: 'IndusPay IMPS', 
    type: 'Personal', 
    payinLimit: '₹500 - ₹2,00,000', 
    payoutLimit: '₹1,000 - ₹1,00,000', 
    hasBonus: false, 
    color: 'bg-red-800', 
    iconText: 'In',
    logoUrl: '/assets/induspay-icon.svg',
    subLabel: 'IndusInd Bank IMPS'
  },
];

export const BUSINESS_PROVIDERS: ProviderConfig[] = [
  { 
    name: 'GooglePay Business', 
    type: 'Business', 
    payinLimit: '₹500 - ₹5,00,000', 
    payoutLimit: '₹1,000 - ₹2,00,000', 
    hasBonus: true, 
    color: 'bg-blue-600', 
    iconText: 'GPay',
    logoUrl: '/assets/gpay-icon.svg',
    subLabel: 'Google Verified Merchant'
  },
  { 
    name: 'Paytm Merchant Business', 
    type: 'Business', 
    payinLimit: '₹500 - ₹5,00,000', 
    payoutLimit: '₹1,000 - ₹2,00,000', 
    hasBonus: true, 
    color: 'bg-sky-700', 
    iconText: 'PtBiz',
    logoUrl: '/assets/paytm-icon.svg',
    subLabel: 'Soundbox & QR Verified'
  },
];

export const ALL_PROVIDERS = [...PERSONAL_PROVIDERS, ...BUSINESS_PROVIDERS];

export const getWalletSortPriority = (providerName: string): number => {
  const lower = providerName.toLowerCase();
  if (lower.includes('paytm')) return 1;
  if (lower.includes('phonepe')) return 2;
  if (lower.includes('google') || lower.includes('gpay')) return 3;
  if (lower.includes('freecharge')) return 4;
  if (lower.includes('bharatpe')) return 5;
  if (lower.includes('navi')) return 6;
  if (lower.includes('indus')) return 7;
  return 99;
};

export const getProviderConfig = (providerName: string): ProviderConfig | undefined => {
  return ALL_PROVIDERS.find(p => 
    providerName.toLowerCase().includes(p.name.toLowerCase()) || 
    p.name.toLowerCase().includes(providerName.toLowerCase())
  );
};

// Reusable Gateway Brand Logo with Reliable Vector/Image Fallback (No Text Initial Badges)
export const GatewayLogoBadge: React.FC<{
  providerName: string;
  logoUrl?: string;
  iconText?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ providerName, logoUrl, size = 'md', className = '' }) => {
  const [hasError, setHasError] = useState(false);

  // Derive fallback config if not directly supplied
  const resolvedConfig = getProviderConfig(providerName);
  
  // Choose logo URL or universal UPI logo if "UPI" / "Other"
  let finalLogoUrl = logoUrl || resolvedConfig?.logoUrl;
  if (!finalLogoUrl && (providerName.toLowerCase().includes('upi') || providerName.toLowerCase().includes('other'))) {
    finalLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/512px-UPI-Logo-vector.svg.png';
  }

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const imgPadding = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  }[size];

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center overflow-hidden bg-white border border-slate-200/90 shadow-xs ${sizeClasses} ${className}`}
    >
      {finalLogoUrl && !hasError ? (
        <img
          src={finalLogoUrl}
          alt={providerName}
          onError={() => setHasError(true)}
          className={`w-full h-full object-contain ${imgPadding}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Reliable Vector Brand Fallback Icon (No plain text letter badge) */
        <div className="w-full h-full bg-slate-50 flex items-center justify-center p-1.5 text-slate-700">
          {providerName.toLowerCase().includes('business') || providerName.toLowerCase().includes('bank') ? (
            <Building2 className="w-full h-full text-slate-700 stroke-[1.8]" />
          ) : providerName.toLowerCase().includes('card') ? (
            <CreditCard className="w-full h-full text-slate-700 stroke-[1.8]" />
          ) : (
            <Wallet className="w-full h-full text-emerald-700 stroke-[1.8]" />
          )}
        </div>
      )}
    </div>
  );
};

export const ToolWalletScreen: React.FC = () => {
  const { 
    userWallets, 
    currentUser, 
    bindWallet, 
    updateWallet, 
    deleteWallet, 
    stats, 
    showToast, 
    paymentGateways,
    triggerWithdrawalCheck,
    setActiveScreen
  } = useApp();

  // Dynamic Gateway Provider Mapping
  const dynamicPersonalProviders: ProviderConfig[] = (paymentGateways && Array.isArray(paymentGateways) && paymentGateways.length > 0)
    ? paymentGateways
        .filter(g => g && g.is_active && g.type === 'Personal')
        .sort((a, b) => ((a.sort_priority ?? a.sort_order) ?? 99) - ((b.sort_priority ?? b.sort_order) ?? 99))
        .map(g => {
          const minPay = g.min_payin_inr ?? g.payin_min ?? 100;
          const maxPay = g.max_payin_inr ?? g.payin_max ?? 100000;
          const minOut = g.min_payout_inr ?? g.payout_min ?? 500;
          const maxOut = g.max_payout_inr ?? g.payout_max ?? 50000;
          return {
            name: g.name,
            type: 'Personal' as WalletType,
            payinLimit: `₹${Number(minPay).toLocaleString('en-IN')} - ₹${Number(maxPay).toLocaleString('en-IN')}`,
            payoutLimit: `₹${Number(minOut).toLocaleString('en-IN')} - ₹${Number(maxOut).toLocaleString('en-IN')}`,
            hasBonus: Boolean(g.has_bonus),
            color: g.color || 'bg-slate-700',
            iconText: g.icon_text || (g.name ? g.name.substring(0, 2) : 'UPI'),
            logoUrl: g.logo_url,
            subLabel: g.sub_label || 'Instant Soundbox & QR'
          };
        })
    : PERSONAL_PROVIDERS;

  const dynamicBusinessProviders: ProviderConfig[] = (paymentGateways && Array.isArray(paymentGateways) && paymentGateways.length > 0)
    ? paymentGateways
        .filter(g => g && g.is_active && g.type === 'Business')
        .sort((a, b) => ((a.sort_priority ?? a.sort_order) ?? 99) - ((b.sort_priority ?? b.sort_order) ?? 99))
        .map(g => {
          const minPay = g.min_payin_inr ?? g.payin_min ?? 500;
          const maxPay = g.max_payin_inr ?? g.payin_max ?? 500000;
          const minOut = g.min_payout_inr ?? g.payout_min ?? 1000;
          const maxOut = g.max_payout_inr ?? g.payout_max ?? 200000;
          return {
            name: g.name,
            type: 'Business' as WalletType,
            payinLimit: `₹${Number(minPay).toLocaleString('en-IN')} - ₹${Number(maxPay).toLocaleString('en-IN')}`,
            payoutLimit: `₹${Number(minOut).toLocaleString('en-IN')} - ₹${Number(maxOut).toLocaleString('en-IN')}`,
            hasBonus: Boolean(g.has_bonus),
            color: g.color || 'bg-blue-600',
            iconText: g.icon_text || (g.name ? g.name.substring(0, 2) : 'Biz'),
            logoUrl: g.logo_url,
            subLabel: g.sub_label || 'Soundbox & QR Verified'
          };
        })
    : BUSINESS_PROVIDERS;

  const currentPersonalList = dynamicPersonalProviders.length > 0 ? dynamicPersonalProviders : PERSONAL_PROVIDERS;
  const currentBusinessList = dynamicBusinessProviders.length > 0 ? dynamicBusinessProviders : BUSINESS_PROVIDERS;
  
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [walletSegment, setWalletSegment] = useState<WalletType>('Personal');
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig>(currentPersonalList[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Edit & Delete state
  const [editingWallet, setEditingWallet] = useState<UserWallet | null>(null);
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editHolderName, setEditHolderName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingWallet, setDeletingWallet] = useState<UserWallet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [pinMode, setPinMode] = useState<'BIND' | 'EDIT'>('BIND');

  const userSavedWallets = [...userWallets]
    .filter(w => w.user_id === currentUser.id)
    .sort((a, b) => getWalletSortPriority(a.provider_name) - getWalletSortPriority(b.provider_name));

  const handleStartAdd = () => {
    triggerSwitchSound();
    setWalletSegment('Personal');
    setSelectedProvider(currentPersonalList[0]);
    setIsAdding(true);
  };

  const handleSelectSegment = (type: WalletType) => {
    triggerSwitchSound();
    setWalletSegment(type);
    setSelectedProvider(type === 'Personal' ? currentPersonalList[0] : currentBusinessList[0]);
  };

  const handleConfirmSubmit = () => {
    if (!accountNumber.trim()) {
      showToast('Please enter your UPI ID or Account details.');
      return;
    }
    if (!holderName.trim()) {
      showToast('Please enter Account Holder / Business Name.');
      return;
    }
    triggerConfirmSound();
    setPinMode('BIND');
    setIsPinModalOpen(true);
  };

  const handleStartEdit = (w: UserWallet) => {
    triggerSwitchSound();
    setEditingWallet(w);
    setEditAccountNumber(w.account_number);
    setEditHolderName(w.holder_name);
    setIsEditModalOpen(true);
  };

  const handleConfirmEdit = () => {
    if (!editAccountNumber.trim()) {
      showToast('Please enter your UPI ID or Account details.');
      return;
    }
    if (!editHolderName.trim()) {
      showToast('Please enter Account Holder / Business Name.');
      return;
    }
    triggerConfirmSound();
    setIsEditModalOpen(false);
    setPinMode('EDIT');
    setIsPinModalOpen(true);
  };

  const handleStartDelete = (w: UserWallet) => {
    triggerCancelSound();
    setDeletingWallet(w);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingWallet) return;
    triggerConfirmSound();
    deleteWallet(deletingWallet.id);
    setIsDeleteModalOpen(false);
    setDeletingWallet(null);
  };

  const handlePinSuccess = (pin: string) => {
    triggerSuccessSound();
    if (pinMode === 'BIND') {
      const res = bindWallet(
        {
          type: walletSegment,
          provider_name: selectedProvider.name,
          account_number: accountNumber.trim(),
          holder_name: holderName.trim(),
          has_binding_bonus: selectedProvider.hasBonus,
        },
        pin
      );

      if (res.success) {
        setIsAdding(false);
        setAccountNumber('');
        setHolderName('');
      }
    } else if (pinMode === 'EDIT' && editingWallet) {
      const res = updateWallet(
        editingWallet.id,
        {
          account_number: editAccountNumber.trim(),
          holder_name: editHolderName.trim(),
        },
        pin
      );

      if (res.success) {
        setEditingWallet(null);
        setEditAccountNumber('');
        setEditHolderName('');
      }
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="fintech-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold border border-amber-300">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Settlement Accounts & Tools</h2>
            <p className="text-[11px] text-slate-700 font-medium">Bind verified official UPI & Merchant gateways</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerWithdrawalCheck(() => setActiveScreen('withdraw'))}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            <span>Withdraw Funds</span>
          </button>

          {!isAdding && (
            <button
              onClick={handleStartAdd}
              className="fintech-btn-emerald px-3.5 py-1.5 text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Link Tool</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Tool View vs Saved List View */}
      {isAdding ? (
        <div className="fintech-card p-5 space-y-4 animate-in zoom-in-95 duration-150">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Link Payout & Settlement Handle</h3>
              <p className="text-[10px] text-slate-600 font-medium">Choose from supported official gateway partners</p>
            </div>
            <button
              onClick={() => {
                triggerCancelSound();
                setIsAdding(false);
              }}
              className="text-xs text-slate-700 hover:text-slate-950 font-bold cursor-pointer px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>

          {/* Segmented Toggle: Personal vs Business */}
          <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleSelectSegment('Personal')}
              className={`py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                walletSegment === 'Personal'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Personal UPI (6 Gateways)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSegment('Business')}
              className={`py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                walletSegment === 'Business'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Business Merchant</span>
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] rounded font-extrabold shadow-xs">
                +₹50 Bonus
              </span>
            </button>
          </div>

          {/* Provider Grid with Official Brand Logos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-900">
                Select {walletSegment} Payment Gateway
              </label>
              <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Official Partner Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(walletSegment === 'Business' ? BUSINESS_PROVIDERS : PERSONAL_PROVIDERS).map(prov => {
                const isSelected = selectedProvider.name === prov.name;
                return (
                  <button
                    key={prov.name}
                    type="button"
                    onClick={() => setSelectedProvider(prov)}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs'
                        : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                    }`}
                  >
                    {prov.hasBonus && (
                      <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 bg-amber-600 text-white text-[8px] font-extrabold rounded shadow-xs flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>+₹50 Bonus</span>
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Authentic Brand Logo Image with Fallback */}
                      <GatewayLogoBadge
                        providerName={prov.name}
                        logoUrl={prov.logoUrl}
                        iconText={prov.iconText}
                        color={prov.color}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs text-slate-900 block truncate">
                          {prov.name}
                        </span>
                        {prov.subLabel && (
                          <span className="text-[10px] text-slate-500 font-medium block truncate">
                            {prov.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-700 font-medium grid grid-cols-2 gap-1">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Payin Limit</span>
                        <strong className="text-slate-900 font-mono font-bold text-[10px] block truncate">{prov.payinLimit}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[9px]">Payout Limit</span>
                        <strong className="text-slate-900 font-mono font-bold text-[10px] block truncate">{prov.payoutLimit}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                UPI Virtual Payment Address (VPA) / Registered Mobile / Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="e.g., 9876543210@paytm or merchant@ybl or account number"
                className="w-full fintech-inset px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Beneficiary / Account Holder Full Legal Name
              </label>
              <input
                type="text"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                placeholder="e.g., Arjun Dev (must match official bank / UPI records)"
                className="w-full fintech-inset px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bonus Notice */}
          {selectedProvider.hasBonus && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex items-center gap-2.5 text-xs font-medium">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong className="font-bold">Instant Incentive:</strong> ₹{stats.binding_bonus_amount} will be instantly credited to your Available Balance upon successful binding!
              </span>
            </div>
          )}

          {/* CTA Button */}
          <button
            id="bind-tool-confirm-btn"
            type="button"
            onClick={handleConfirmSubmit}
            className="w-full py-3 fintech-btn-emerald text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            <span>Confirm & Bind Payout Account</span>
          </button>

        </div>
      ) : (
        /* Saved Wallets List or Empty State */
        <div className="space-y-3">
          {userSavedWallets.length === 0 ? (
            <div className="fintech-card p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
                <Wallet className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">No Payout Accounts Bound Yet</h3>
                <p className="text-xs text-slate-700 font-medium mt-1 max-w-xs mx-auto">
                  Bind your PhonePe, Paytm, or GooglePay Business account to start receiving automated order payouts directly.
                </p>
              </div>
              <button
                onClick={handleStartAdd}
                className="fintech-btn-emerald px-5 py-2.5 text-xs font-extrabold rounded-lg inline-flex items-center gap-1.5 cursor-pointer mt-2 shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Bind First Account</span>
              </button>
            </div>
          ) : (
            userSavedWallets.map(w => (
              <div
                key={w.id}
                className="fintech-card p-4 hover:border-slate-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Render Authentic Brand Logo for Saved Wallet */}
                    <GatewayLogoBadge
                      providerName={w.provider_name}
                      size="md"
                    />

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-xs text-slate-900">{w.provider_name}</h4>
                        {w.has_binding_bonus && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white font-extrabold text-[8px] rounded shadow-xs">
                            Bonus Active
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 font-bold text-[8px] rounded border border-slate-200">
                          {w.type}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-900 mt-0.5 font-extrabold">
                        {w.account_number}
                      </p>
                      <span className="text-[10px] text-slate-700 font-medium">
                        Holder: {w.holder_name} • Verified on {w.created_at}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => handleStartEdit(w)}
                      className="px-2.5 py-1 text-[11px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Edit2 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleStartDelete(w)}
                      className="px-2.5 py-1 text-[11px] font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Strict Anti-Fraud & KYC Name Matching Policy Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Important Payout Account Policy</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed font-medium">
          <div className="flex items-start gap-1.5">
            <span className="text-amber-700 font-bold">•</span>
            <span><strong className="text-slate-900 font-bold">No Third-Party Accounts:</strong> Third-party accounts are strictly not allowed. Add only accounts registered under your own name.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-amber-700 font-bold">•</span>
            <span><strong className="text-slate-900 font-bold">Mandatory KYC Name Match:</strong> The name on your payment method (UPI / Bank) must 100% match your KYC-verified name and official documents.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-amber-700 font-bold">•</span>
            <span><strong className="text-slate-900 font-bold">Automated Clearing:</strong> Mismatched or unauthorized third-party accounts will be rejected by the payment gateway during withdrawal processing.</span>
          </div>
        </div>
      </div>

      {/* Edit Wallet Modal */}
      {isEditModalOpen && editingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm fintech-card p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Edit {editingWallet.provider_name}</h3>
                <p className="text-[10px] text-slate-500 font-medium">Update your verified payout handle details</p>
              </div>
              <button
                onClick={() => {
                  triggerCancelSound();
                  setIsEditModalOpen(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer px-2 py-1 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  UPI VPA / Account Number
                </label>
                <input
                  type="text"
                  value={editAccountNumber}
                  onChange={e => setEditAccountNumber(e.target.value)}
                  placeholder="e.g., username@paytm"
                  className="w-full fintech-inset px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Account Holder Full Legal Name
                </label>
                <input
                  type="text"
                  value={editHolderName}
                  onChange={e => setEditHolderName(e.target.value)}
                  placeholder="e.g., Arjun Dev"
                  className="w-full fintech-inset px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmEdit}
              className="w-full py-3 fintech-btn-emerald text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              <span>Proceed to PIN Authorization</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm fintech-card p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Remove Payment Method?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to unbind <strong className="text-slate-900">{deletingWallet.provider_name}</strong> ({deletingWallet.account_number})? You will need to re-bind it if you wish to use it for future payouts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsDeleteModalOpen(false);
                }}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security PIN Modal */}
      <SecurityPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title={pinMode === 'BIND' ? 'Authorize Tool Binding' : 'Authorize Account Edit'}
        description={pinMode === 'BIND' ? 'Please confirm this payout account authorization using your 6-digit Security PIN.' : 'Please confirm updating your payout account using your 6-digit Security PIN.'}
      />

    </div>
  );
};
