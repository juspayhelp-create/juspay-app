import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Globe, 
  Plus, 
  Check, 
  Sparkles, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  RotateCcw, 
  Save,
  QrCode,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Eye,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentGatewayConfig, CryptoVaultConfig, OfficialPlatformAccountConfig } from '../types';
import { GatewayLogoBadge } from '../screens/ToolWalletScreen';
import { QRCodeDisplay } from './QRCodeDisplay';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const AdminGatewaysTab: React.FC = () => {
  const {
    paymentGateways = [],
    cryptoVaults = [],
    platformAccount,
    stats,
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
    adminUploadQrImage,
    adminUpdateCryptoDepositQr,
    showToast
  } = useApp();

  // Safe Platform Account State with fallback defaults
  const [platformUpi, setPlatformUpi] = useState<string>(() => platformAccount?.upi_id || 'juspay.settle@okhdfcbank');
  const [platformBeneficiary, setPlatformBeneficiary] = useState<string>(() => platformAccount?.beneficiary_name || 'Juspay Settlement Reserve Corp');
  const [platformBankName, setPlatformBankName] = useState<string>(() => platformAccount?.bank_name || 'HDFC Bank Ltd');
  const [platformAccName, setPlatformAccName] = useState<string>(() => platformAccount?.account_name || 'Juspay Settlement Reserve Corp');
  const [platformAccNo, setPlatformAccNo] = useState<string>(() => platformAccount?.account_number || '50200084729103');
  const [platformIfsc, setPlatformIfsc] = useState<string>(() => platformAccount?.ifsc_code || 'HDFC0000240');
  const [platformBranch, setPlatformBranch] = useState<string>(() => platformAccount?.branch_name || 'Financial District, Mumbai');
  const [platformAccType, setPlatformAccType] = useState<string>(() => platformAccount?.account_type || 'Current Account');
  const [platformQrCodeUrl, setPlatformQrCodeUrl] = useState<string>(() => platformAccount?.qr_code_url || '');

  // Deposit QR Codes & Receiving Addresses (TRC20 & BEP20)
  const [trc20Address, setTrc20Address] = useState<string>(() => stats.trc20_address || 'TYx99M8fQZ4sK21B59Vn2L7xPw9mRtU98Q');
  const [trc20QrCode, setTrc20QrCode] = useState<string>(() => stats.trc20_qr_code || '');
  const [bep20Address, setBep20Address] = useState<string>(() => stats.bep20_address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [bep20QrCode, setBep20QrCode] = useState<string>(() => stats.bep20_qr_code || '');
  const [isUploadingTrc20, setIsUploadingTrc20] = useState(false);
  const [isUploadingBep20, setIsUploadingBep20] = useState(false);
  const [isSavingDepositQr, setIsSavingDepositQr] = useState(false);

  useEffect(() => {
    if (stats.trc20_address) setTrc20Address(stats.trc20_address);
    if (stats.trc20_qr_code !== undefined) setTrc20QrCode(stats.trc20_qr_code);
    if (stats.bep20_address) setBep20Address(stats.bep20_address);
    if (stats.bep20_qr_code !== undefined) setBep20QrCode(stats.bep20_qr_code);
  }, [stats.trc20_address, stats.trc20_qr_code, stats.bep20_address, stats.bep20_qr_code]);

  // Payment Gateways Add/Edit State
  const [isAddingGateway, setIsAddingGateway] = useState<boolean>(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [gwName, setGwName] = useState<string>('');
  const [gwType, setGwType] = useState<'Personal' | 'Business'>('Personal');
  const [gwMinPayin, setGwMinPayin] = useState<string>('100');
  const [gwMaxPayin, setGwMaxPayin] = useState<string>('100000');
  const [gwMinPayout, setGwMinPayout] = useState<string>('500');
  const [gwMaxPayout, setGwMaxPayout] = useState<string>('50000');
  const [gwOfficialUpi, setGwOfficialUpi] = useState<string>('');
  const [gwHasBonus, setGwHasBonus] = useState<boolean>(false);
  const [gwBonusAmount, setGwBonusAmount] = useState<string>('50');
  const [gwSubLabel, setGwSubLabel] = useState<string>('Instant Soundbox & QR');
  const [gwLogoUrl, setGwLogoUrl] = useState<string>('');
  const [gwColor, setGwColor] = useState<string>('bg-slate-700');
  const [gwSortPriority, setGwSortPriority] = useState<string>('10');

  // Crypto Vaults Add/Edit State
  const [isAddingVault, setIsAddingVault] = useState<boolean>(false);
  const [editingVault, setEditingVault] = useState<CryptoVaultConfig | null>(null);
  const [vaultSymbol, setVaultSymbol] = useState<string>('USDT');
  const [vaultNetwork, setVaultNetwork] = useState<string>('TRC20');
  const [vaultNetworkName, setVaultNetworkName] = useState<string>('TRON (TRC20)');
  const [vaultAddress, setVaultAddress] = useState<string>('TXrxPjQvzKef7P3W91Uc1yRoxwKbwQvHmp');
  const [vaultQrUrl, setVaultQrUrl] = useState<string>('');
  const [vaultMinDeposit, setVaultMinDeposit] = useState<string>('10');
  const [vaultConfirmations, setVaultConfirmations] = useState<string>('1');
  const [vaultNotes, setVaultNotes] = useState<string>('Fastest 1-confirmation settlement on TRON network. Low gas fee.');
  const [isUploadingVaultQr, setIsUploadingVaultQr] = useState(false);

  const handleSavePlatformAccount = (e: React.FormEvent) => {
    e.preventDefault();
    triggerConfirmSound();
    adminUpdatePlatformAccount({
      upi_id: (platformUpi || '').trim(),
      beneficiary_name: (platformBeneficiary || '').trim(),
      bank_name: (platformBankName || '').trim(),
      account_name: (platformAccName || '').trim(),
      account_number: (platformAccNo || '').trim(),
      ifsc_code: (platformIfsc || '').trim().toUpperCase(),
      branch_name: (platformBranch || '').trim(),
      account_type: (platformAccType || '').trim(),
      qr_code_url: (platformQrCodeUrl || '').trim() || undefined
    });
    triggerSuccessSound();
  };

  const handleSaveCryptoDepositQr = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerConfirmSound();
    setIsSavingDepositQr(true);
    try {
      await adminUpdateCryptoDepositQr({
        trc20_address: trc20Address.trim(),
        bep20_address: bep20Address.trim(),
        trc20_qr_code: trc20QrCode.trim(),
        bep20_qr_code: bep20QrCode.trim(),
      });
      triggerSuccessSound();
    } catch (err) {
      showToast('Failed to save deposit QR settings.');
    } finally {
      setIsSavingDepositQr(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'trc20' | 'bep20' | 'vault') => {
    if (type === 'trc20') setIsUploadingTrc20(true);
    if (type === 'bep20') setIsUploadingBep20(true);
    if (type === 'vault') setIsUploadingVaultQr(true);

    try {
      const res = await adminUploadQrImage(file);
      if (res.success && res.url) {
        if (type === 'trc20') setTrc20QrCode(res.url);
        if (type === 'bep20') setBep20QrCode(res.url);
        if (type === 'vault') setVaultQrUrl(res.url);
      }
    } finally {
      if (type === 'trc20') setIsUploadingTrc20(false);
      if (type === 'bep20') setIsUploadingBep20(false);
      if (type === 'vault') setIsUploadingVaultQr(false);
    }
  };

  const handleStartEditGateway = (gw: PaymentGatewayConfig) => {
    const minPay = gw.min_payin_inr ?? gw.payin_min ?? 100;
    const maxPay = gw.max_payin_inr ?? gw.payin_max ?? 100000;
    const minOut = gw.min_payout_inr ?? gw.payout_min ?? 500;
    const maxOut = gw.max_payout_inr ?? gw.payout_max ?? 50000;
    const upi = gw.official_upi_id ?? gw.upi_id ?? '';
    const bonus = gw.bonus_amount ?? gw.bonus_percentage ?? 50;
    const priority = gw.sort_priority ?? gw.sort_order ?? 10;

    setEditingGateway(gw);
    setGwName(gw.name || '');
    setGwType(gw.type === 'Business' ? 'Business' : 'Personal');
    setGwMinPayin(String(minPay));
    setGwMaxPayin(String(maxPay));
    setGwMinPayout(String(minOut));
    setGwMaxPayout(String(maxOut));
    setGwOfficialUpi(upi);
    setGwHasBonus(Boolean(gw.has_bonus));
    setGwBonusAmount(String(bonus));
    setGwSubLabel(gw.sub_label || '');
    setGwLogoUrl(gw.logo_url || '');
    setGwColor(gw.color || 'bg-slate-700');
    setGwSortPriority(String(priority));
    setIsAddingGateway(true);
  };

  const handleGatewayFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwName.trim()) {
      showToast('Please enter a gateway name.');
      return;
    }

    const minPay = parseFloat(gwMinPayin) || 100;
    const maxPay = parseFloat(gwMaxPayin) || 100000;
    const minOut = parseFloat(gwMinPayout) || 500;
    const maxOut = parseFloat(gwMaxPayout) || 50000;
    const bonus = parseFloat(gwBonusAmount) || 50;
    const sort = parseInt(gwSortPriority) || 10;

    const payload: Omit<PaymentGatewayConfig, 'id'> = {
      name: gwName.trim(),
      type: gwType,
      payin_min: minPay,
      payin_max: maxPay,
      payout_min: minOut,
      payout_max: maxOut,
      min_payin_inr: minPay,
      max_payin_inr: maxPay,
      min_payout_inr: minOut,
      max_payout_inr: maxOut,
      upi_id: gwOfficialUpi.trim() || platformAccount?.upi_id || 'juspay.settle@okhdfcbank',
      official_upi_id: gwOfficialUpi.trim() || platformAccount?.upi_id || 'juspay.settle@okhdfcbank',
      has_bonus: gwHasBonus,
      bonus_percentage: bonus,
      bonus_amount: bonus,
      sub_label: gwSubLabel.trim() || 'Instant Settlement',
      logo_url: gwLogoUrl.trim() || '',
      color: gwColor.trim() || 'bg-slate-700',
      icon_text: gwName.trim().substring(0, 2),
      sort_order: sort,
      sort_priority: sort,
      is_active: editingGateway ? editingGateway.is_active : true,
    };

    if (editingGateway) {
      triggerConfirmSound();
      adminUpdatePaymentGateway(editingGateway.id, payload);
    } else {
      triggerConfirmSound();
      adminAddPaymentGateway(payload);
    }
    triggerSuccessSound();

    setIsAddingGateway(false);
    setEditingGateway(null);
  };

  const handleStartEditVault = (v: CryptoVaultConfig) => {
    setEditingVault(v);
    setVaultSymbol(v.symbol || 'USDT');
    setVaultNetwork(v.network || 'TRC20');
    setVaultNetworkName(v.network_name || 'TRON (TRC20)');
    setVaultAddress(v.wallet_address || '');
    setVaultQrUrl(v.qr_code_url || '');
    setVaultMinDeposit(String(v.min_deposit ?? 10));
    setVaultConfirmations(String(v.confirmations_required ?? 1));
    setVaultNotes(v.notes || '');
    setIsAddingVault(true);
  };

  const handleVaultFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultAddress.trim()) {
      showToast('Please enter a custodial wallet address.');
      return;
    }

    const payload: Omit<CryptoVaultConfig, 'id'> = {
      symbol: (vaultSymbol || 'USDT').trim().toUpperCase(),
      network: (vaultNetwork || 'TRC20').trim().toUpperCase(),
      network_name: (vaultNetworkName || 'TRON (TRC20)').trim(),
      wallet_address: vaultAddress.trim(),
      qr_code_url: vaultQrUrl.trim() || undefined,
      min_deposit: parseFloat(vaultMinDeposit) || 10,
      confirmations_required: parseInt(vaultConfirmations) || 1,
      notes: (vaultNotes || '').trim(),
      is_active: editingVault ? editingVault.is_active : true,
    };

    if (editingVault) {
      triggerConfirmSound();
      adminUpdateCryptoVault(editingVault.id, payload);
    } else {
      triggerConfirmSound();
      adminAddCryptoVault(payload);
    }
    triggerSuccessSound();

    setIsAddingVault(false);
    setEditingVault(null);
  };

  const safeGateways = Array.isArray(paymentGateways) ? paymentGateways : [];
  const safeVaults = Array.isArray(cryptoVaults) ? cryptoVaults : [];

  return (
    <div className="space-y-4">
      {/* Section 1: Platform Official Settlement Banking & UPI Accounts */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              Platform Official Receiving & Settlement Accounts
            </h3>
          </div>
          <span className="text-[10px] text-emerald-900 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Live Payin Target
          </span>
        </div>

        <form onSubmit={handleSavePlatformAccount} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Official Merchant UPI ID *
              </label>
              <input
                type="text"
                value={platformUpi}
                onChange={e => setPlatformUpi(e.target.value)}
                required
                placeholder="e.g. juspay.settle@okhdfcbank"
                className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-[#7A6B5D] mt-0.5">Used for dynamic payin QR code generation</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Beneficiary Entity Name *
              </label>
              <input
                type="text"
                value={platformBeneficiary}
                onChange={e => setPlatformBeneficiary(e.target.value)}
                required
                placeholder="e.g. Juspay Settlement Reserve Corp"
                className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={platformBankName}
                onChange={e => setPlatformBankName(e.target.value)}
                required
                placeholder="e.g. HDFC Bank Ltd"
                className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Account Number *
              </label>
              <input
                type="text"
                value={platformAccNo}
                onChange={e => setPlatformAccNo(e.target.value)}
                required
                placeholder="e.g. 50200084729103"
                className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                value={platformIfsc}
                onChange={e => setPlatformIfsc(e.target.value.toUpperCase())}
                required
                placeholder="e.g. HDFC0000240"
                className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={platformAccName}
                onChange={e => setPlatformAccName(e.target.value)}
                placeholder="Account Name"
                className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={platformBranch}
                onChange={e => setPlatformBranch(e.target.value)}
                placeholder="Branch location"
                className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Account Type
              </label>
              <input
                type="text"
                value={platformAccType}
                onChange={e => setPlatformAccType(e.target.value)}
                placeholder="Current / Settlement"
                className="w-full clay-inset px-3 py-2 text-xs font-medium text-[#2D241E] bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#7A6B5D]">
              Updates reflect instantly on all user deposit screens & QR targets.
            </span>
            <button
              type="submit"
              className="clay-btn-emerald px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Platform Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Dedicated USDT Deposit QR Codes & Custodial Addresses (TRC20 & BEP20) */}
      <div className="clay-card p-4 space-y-4 border-2 border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-white shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <QrCode className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2D241E] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>USDT Deposit QR Codes & Receiving Addresses</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">
                  TRC20 & BEP20
                </span>
              </h3>
              <p className="text-[10px] text-[#7A6B5D]">
                Change or upload custom deposit QR code images and custodial addresses displayed directly on user deposit screens.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
            Real-Time App Sync
          </span>
        </div>

        <form onSubmit={handleSaveCryptoDepositQr} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TRON (TRC20) Deposit Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <strong className="text-xs font-bold text-slate-900">TRON Network (TRC20)</strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-bold">
                  USDT-TRC20
                </span>
              </div>

              {/* QR Preview & Live Target */}
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-24 h-24 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  {trc20QrCode ? (
                    <img 
                      src={trc20QrCode} 
                      alt="TRC20 Deposit QR" 
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <QRCodeDisplay value={trc20Address || 'TXrxPjQvzKef7P3W91Uc1yRoxwKbwQvHmp'} size={80} />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold text-slate-700">Displaying:</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      trc20QrCode ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {trc20QrCode ? 'Custom Image QR' : 'Auto-Generated Vector QR'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {trc20QrCode ? 'Custom merchant QR image active on user deposit screen.' : 'Generated dynamically from TRC20 address.'}
                  </p>
                  {trc20QrCode && (
                    <button
                      type="button"
                      onClick={() => setTrc20QrCode('')}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                    >
                      Reset to Auto-Generated QR
                    </button>
                  )}
                </div>
              </div>

              {/* TRC20 Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  TRC20 Receiving Wallet Address *
                </label>
                <input
                  type="text"
                  value={trc20Address}
                  onChange={e => setTrc20Address(e.target.value)}
                  required
                  placeholder="e.g. TYx99M8fQZ4sK21B59Vn2L7xPw9mRtU98Q"
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* TRC20 QR Code Image File Upload or URL */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#4A3E35]">
                  Custom TRC20 QR Code Image
                </label>
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'trc20');
                    }}
                    id="admin-upload-trc20-qr"
                    className="hidden"
                  />
                  <label
                    htmlFor="admin-upload-trc20-qr"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 cursor-pointer transition-all ${
                      isUploadingTrc20 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isUploadingTrc20 ? 'Uploading...' : 'Upload Image File'}</span>
                  </label>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={trc20QrCode}
                      onChange={e => setTrc20QrCode(e.target.value)}
                      placeholder="Or paste QR Image URL (https://...)"
                      className="w-full clay-inset px-2.5 py-1.5 text-xs text-[#2D241E] bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BNB Smart Chain (BEP20) Deposit Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <strong className="text-xs font-bold text-slate-900">BNB Smart Chain (BEP20)</strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-bold">
                  USDT-BEP20
                </span>
              </div>

              {/* QR Preview & Live Target */}
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-24 h-24 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  {bep20QrCode ? (
                    <img 
                      src={bep20QrCode} 
                      alt="BEP20 Deposit QR" 
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <QRCodeDisplay value={bep20Address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'} size={80} />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold text-slate-700">Displaying:</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      bep20QrCode ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {bep20QrCode ? 'Custom Image QR' : 'Auto-Generated Vector QR'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {bep20QrCode ? 'Custom merchant QR image active on user deposit screen.' : 'Generated dynamically from BEP20 address.'}
                  </p>
                  {bep20QrCode && (
                    <button
                      type="button"
                      onClick={() => setBep20QrCode('')}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                    >
                      Reset to Auto-Generated QR
                    </button>
                  )}
                </div>
              </div>

              {/* BEP20 Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  BEP20 Receiving Wallet Address *
                </label>
                <input
                  type="text"
                  value={bep20Address}
                  onChange={e => setBep20Address(e.target.value)}
                  required
                  placeholder="e.g. 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* BEP20 QR Code Image File Upload or URL */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#4A3E35]">
                  Custom BEP20 QR Code Image
                </label>
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'bep20');
                    }}
                    id="admin-upload-bep20-qr"
                    className="hidden"
                  />
                  <label
                    htmlFor="admin-upload-bep20-qr"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 cursor-pointer transition-all ${
                      isUploadingBep20 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isUploadingBep20 ? 'Uploading...' : 'Upload Image File'}</span>
                  </label>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={bep20QrCode}
                      onChange={e => setBep20QrCode(e.target.value)}
                      placeholder="Or paste QR Image URL (https://...)"
                      className="w-full clay-inset px-2.5 py-1.5 text-xs text-[#2D241E] bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
            <span className="text-[11px] text-[#7A6B5D]">
              Both TRC20 and BEP20 QR codes immediately refresh in the live user deposit screen.
            </span>
            <button
              type="submit"
              disabled={isSavingDepositQr}
              className="clay-btn-emerald px-5 py-2 text-xs font-extrabold rounded-full flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingDepositQr ? 'Saving QR Codes...' : 'Save & Apply Deposit QR Codes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: UPI / Fiat Payment Gateways Management */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-700" />
            <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              Configured Payment Gateways ({safeGateways.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingGateway(null);
              setGwName('');
              setGwType('Personal');
              setGwMinPayin('100');
              setGwMaxPayin('100000');
              setGwMinPayout('500');
              setGwMaxPayout('50000');
              setGwOfficialUpi(platformAccount?.upi_id || 'juspay.settle@okhdfcbank');
              setGwHasBonus(false);
              setGwBonusAmount('50');
              setGwSubLabel('Instant Settlement');
              setGwLogoUrl('');
              setGwColor('bg-slate-700');
              setGwSortPriority(String(safeGateways.length + 1));
              setIsAddingGateway(true);
            }}
            className="clay-btn-dark px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Gateway Route</span>
          </button>
        </div>

        {/* Inline Add / Edit Gateway Form */}
        {isAddingGateway && (
          <form onSubmit={handleGatewayFormSubmit} className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>{editingGateway ? `Edit Gateway: ${editingGateway.name}` : 'Configure New Gateway Route'}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsAddingGateway(false);
                  setEditingGateway(null);
                }}
                className="text-[11px] font-bold text-[#7A6B5D] hover:text-[#2D241E] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Gateway Display Name *
                </label>
                <input
                  type="text"
                  value={gwName}
                  onChange={e => setGwName(e.target.value)}
                  required
                  placeholder="e.g. Cred UPI / Paytm"
                  className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Gateway Type
                </label>
                <select
                  value={gwType}
                  onChange={e => setGwType(e.target.value as 'Personal' | 'Business')}
                  className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D241E] bg-white"
                >
                  <option value="Personal">Personal UPI</option>
                  <option value="Business">Business Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Sub-label / SLA Tag
                </label>
                <input
                  type="text"
                  value={gwSubLabel}
                  onChange={e => setGwSubLabel(e.target.value)}
                  placeholder="e.g. 0% MDR QR & POS"
                  className="w-full clay-inset px-3 py-2 text-xs text-[#2D241E] bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Min Payin (₹)
                </label>
                <input
                  type="number"
                  value={gwMinPayin}
                  onChange={e => setGwMinPayin(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Max Payin (₹)
                </label>
                <input
                  type="number"
                  value={gwMaxPayin}
                  onChange={e => setGwMaxPayin(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Min Payout (₹)
                </label>
                <input
                  type="number"
                  value={gwMinPayout}
                  onChange={e => setGwMinPayout(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Max Payout (₹)
                </label>
                <input
                  type="number"
                  value={gwMaxPayout}
                  onChange={e => setGwMaxPayout(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Official UPI ID Override (Optional)
                </label>
                <input
                  type="text"
                  value={gwOfficialUpi}
                  onChange={e => setGwOfficialUpi(e.target.value)}
                  placeholder="e.g. merchant@icici"
                  className="w-full clay-inset px-3 py-2 text-xs font-mono text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Logo Asset URL / SVG Path
                </label>
                <input
                  type="text"
                  value={gwLogoUrl}
                  onChange={e => setGwLogoUrl(e.target.value)}
                  placeholder="e.g. /assets/paytm-icon.svg"
                  className="w-full clay-inset px-3 py-2 text-xs text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Sort Priority (Lower = Top)
                </label>
                <input
                  type="number"
                  value={gwSortPriority}
                  onChange={e => setGwSortPriority(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>
            </div>

            {/* Binding Bonus Options */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gwHasBonus}
                  onChange={e => setGwHasBonus(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-[#2D241E]">Enable Account Binding Bonus</span>
              </label>

              {gwHasBonus && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#7A6B5D] font-bold">Bonus Amount: ₹</span>
                  <input
                    type="number"
                    value={gwBonusAmount}
                    onChange={e => setGwBonusAmount(e.target.value)}
                    className="w-20 clay-inset px-2 py-1 text-xs font-mono font-bold text-[#2D241E] bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsAddingGateway(false);
                  setEditingGateway(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingGateway ? 'Save Gateway Changes' : 'Add Gateway Route'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Gateway Cards List */}
        <div className="space-y-2.5">
          {safeGateways.map(gw => {
            const minPay = gw.min_payin_inr ?? gw.payin_min ?? 100;
            const maxPay = gw.max_payin_inr ?? gw.payin_max ?? 100000;
            const minOut = gw.min_payout_inr ?? gw.payout_min ?? 500;
            const maxOut = gw.max_payout_inr ?? gw.payout_max ?? 50000;
            const upi = gw.official_upi_id ?? gw.upi_id;
            const bonusAmt = gw.bonus_amount ?? gw.bonus_percentage ?? 50;

            return (
              <div
                key={gw.id}
                className={`p-3.5 rounded-2xl clay-card-soft flex items-center justify-between gap-3 transition-all ${
                  !gw.is_active ? 'opacity-60 bg-slate-100/70' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GatewayLogoBadge
                    providerName={gw.name}
                    logoUrl={gw.logo_url}
                    color={gw.color}
                    iconText={gw.icon_text}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs text-[#2D241E] truncate">{gw.name}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        gw.type === 'Business' 
                          ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {gw.type}
                      </span>
                      {gw.has_bonus && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded text-[9px] font-extrabold shadow-xs">
                          +₹{bonusAmt} Bonus
                        </span>
                      )}
                      {!gw.is_active && (
                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[9px] font-bold border border-rose-200">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#7A6B5D] mt-1 flex-wrap font-mono">
                      <span>Payin: ₹{Number(minPay).toLocaleString('en-IN')} - ₹{Number(maxPay).toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>Payout: ₹{Number(minOut).toLocaleString('en-IN')} - ₹{Number(maxOut).toLocaleString('en-IN')}</span>
                      {upi && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">{upi}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adminTogglePaymentGateway(gw.id)}
                    className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      gw.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                    }`}
                    title={gw.is_active ? 'Deactivate gateway' : 'Activate gateway'}
                  >
                    {gw.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEditGateway(gw)}
                    className="p-1.5 rounded-lg bg-white border border-[#E8E0D5] text-[#2D241E] hover:bg-slate-50 cursor-pointer"
                    title="Edit gateway parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove payment gateway "${gw.name}"?`)) {
                        adminDeletePaymentGateway(gw.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                    title="Delete gateway"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Crypto Vaults & Multi-chain Configuration */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              Crypto Custodial Vaults ({safeVaults.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingVault(null);
              setVaultSymbol('USDT');
              setVaultNetwork('TRC20');
              setVaultNetworkName('TRON (TRC20)');
              setVaultAddress('TXrxPjQvzKef7P3W91Uc1yRoxwKbwQvHmp');
              setVaultMinDeposit('10');
              setVaultConfirmations('1');
              setVaultNotes('Fastest 1-confirmation settlement on TRON network.');
              setIsAddingVault(true);
            }}
            className="clay-btn-dark px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Crypto Vault</span>
          </button>
        </div>

        {/* Inline Add / Edit Vault Form */}
        {isAddingVault && (
          <form onSubmit={handleVaultFormSubmit} className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>{editingVault ? `Edit Vault: ${editingVault.network_name}` : 'Configure New Crypto Custodial Vault'}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsAddingVault(false);
                  setEditingVault(null);
                }}
                className="text-[11px] font-bold text-[#7A6B5D] hover:text-[#2D241E] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  value={vaultSymbol}
                  onChange={e => setVaultSymbol(e.target.value.toUpperCase())}
                  required
                  placeholder="USDT"
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Network Key *
                </label>
                <input
                  type="text"
                  value={vaultNetwork}
                  onChange={e => setVaultNetwork(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. TRC20, BSC, ERC20"
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Display Network Name *
                </label>
                <input
                  type="text"
                  value={vaultNetworkName}
                  onChange={e => setVaultNetworkName(e.target.value)}
                  required
                  placeholder="e.g. TRON (TRC20)"
                  className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D241E] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                Custodial Receiving Wallet Address *
              </label>
              <input
                type="text"
                value={vaultAddress}
                onChange={e => setVaultAddress(e.target.value)}
                required
                placeholder="e.g. TXrxPjQvzKef7P3W91Uc1yRoxwKbwQvHmp"
                className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-[#7A6B5D] mt-0.5">Directly rendered on user crypto deposit QR codes & copy fields</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Minimum Deposit (USDT)
                </label>
                <input
                  type="number"
                  value={vaultMinDeposit}
                  onChange={e => setVaultMinDeposit(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                  Confirmations Required
                </label>
                <input
                  type="number"
                  value={vaultConfirmations}
                  onChange={e => setVaultConfirmations(e.target.value)}
                  className="w-full clay-inset px-3 py-2 text-xs font-mono font-bold text-[#2D241E] bg-white"
                />
              </div>
            </div>

            {/* Custom QR Code upload/URL for Vault */}
            <div className="space-y-1.5 p-3 rounded-xl bg-white border border-emerald-200">
              <label className="block text-[11px] font-bold text-[#4A3E35]">
                Custom Vault Deposit QR Code (Optional)
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'vault');
                  }}
                  id="admin-upload-vault-qr"
                  className="hidden"
                />
                <label
                  htmlFor="admin-upload-vault-qr"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 cursor-pointer transition-all ${
                    isUploadingVaultQr ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isUploadingVaultQr ? 'Uploading...' : 'Upload QR Image'}</span>
                </label>

                <div className="flex-1">
                  <input
                    type="text"
                    value={vaultQrUrl}
                    onChange={e => setVaultQrUrl(e.target.value)}
                    placeholder="Or paste QR Image URL"
                    className="w-full clay-inset px-2.5 py-1.5 text-xs text-[#2D241E] bg-white"
                  />
                </div>
              </div>

              {vaultQrUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <img src={vaultQrUrl} alt="Vault QR preview" className="w-8 h-8 object-contain rounded border border-slate-200" />
                  <span className="text-[10px] text-emerald-700 font-bold">Custom QR Image attached</span>
                  <button
                    type="button"
                    onClick={() => setVaultQrUrl('')}
                    className="text-[10px] text-rose-600 hover:underline font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A3E35] mb-1">
                SLA / Network Notes
              </label>
              <input
                type="text"
                value={vaultNotes}
                onChange={e => setVaultNotes(e.target.value)}
                placeholder="e.g. Fast 1-confirmation settlement on TRON network"
                className="w-full clay-inset px-3 py-2 text-xs text-[#2D241E] bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsAddingVault(false);
                  setEditingVault(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-[#7A6B5D] hover:text-[#2D241E] rounded-full border border-[#E8E0D5] bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="clay-btn-emerald px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingVault ? 'Save Vault Changes' : 'Add Vault Network'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Vault Cards List */}
        <div className="space-y-2.5">
          {safeVaults.map(vault => (
            <div
              key={vault.id}
              className={`p-3.5 rounded-2xl clay-card-soft flex items-center justify-between gap-3 transition-all ${
                !vault.is_active ? 'opacity-60 bg-slate-100/70' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-xs text-[#2D241E]">{vault.network_name}</h4>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-mono text-[9px] font-bold border border-emerald-200">
                    {vault.symbol} ({vault.network})
                  </span>
                  <span className="text-[10px] text-[#7A6B5D] font-bold">
                    {vault.confirmations_required} Conf. • Min {vault.min_deposit} USDT
                  </span>
                  {vault.qr_code_url && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded font-bold text-[9px] border border-purple-200 flex items-center gap-0.5">
                      <QrCode className="w-2.5 h-2.5 text-purple-700" />
                      <span>Custom QR Attached</span>
                    </span>
                  )}
                  {!vault.is_active && (
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[9px] font-bold border border-rose-200">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-[#7A6B5D] font-semibold shrink-0">Address:</span>
                  <span className="text-[11px] font-mono text-[#2D241E] font-bold truncate bg-white/70 px-2 py-0.5 rounded border border-[#E8E0D5]">
                    {vault.wallet_address}
                  </span>
                </div>
                {vault.notes && (
                  <p className="text-[10px] text-[#7A6B5D] mt-1">{vault.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => adminToggleCryptoVault(vault.id)}
                  className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    vault.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                  }`}
                  title={vault.is_active ? 'Deactivate vault' : 'Activate vault'}
                >
                  {vault.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEditVault(vault)}
                  className="p-1.5 rounded-lg bg-white border border-[#E8E0D5] text-[#2D241E] hover:bg-slate-50 cursor-pointer"
                  title="Edit vault address & SLA"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove crypto vault "${vault.network_name}"?`)) {
                      adminDeleteCryptoVault(vault.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                  title="Delete vault"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Factory Reset Controls */}
      <div className="p-3 rounded-2xl bg-white border border-[#E8E0D5] flex items-center justify-between">
        <div>
          <h4 className="font-bold text-xs text-[#2D241E]">Reset Payment & Vault Presets</h4>
          <p className="text-[10px] text-[#7A6B5D]">Restore initial official gateway handles, bank coordinates, and crypto addresses.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset all payment gateways, bank accounts, and crypto addresses to default presets?')) {
              adminResetPaymentSettings();
            }
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-300 cursor-pointer transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
};
