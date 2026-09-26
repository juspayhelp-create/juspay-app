import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Coins, 
  Copy, 
  Check, 
  Upload, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const DepositScreen: React.FC = () => {
  const { 
    currentUser, 
    stats, 
    submitDeposit, 
    setActiveScreen, 
    showToast,
    cryptoVaults
  } = useApp();

  const activeCryptoVaults = Array.isArray(cryptoVaults) ? cryptoVaults.filter(v => v && v.is_active) : [];

  const [selectedVaultId, setSelectedVaultId] = useState<string>(
    activeCryptoVaults.length > 0 ? activeCryptoVaults[0].id : 'crypto_trc20'
  );
  const selectedVault = activeCryptoVaults.find(v => v.id === selectedVaultId) || activeCryptoVaults[0] || {
    id: 'crypto_trc20',
    symbol: 'USDT',
    network: 'TRC20',
    network_name: 'TRON (TRC20)',
    wallet_address: 'TXrxPjQvzKef7P3W91Uc1yRoxwKbwQvHmp',
    min_deposit: 10,
    confirmations_required: 1,
    is_active: true,
    notes: 'Fastest 1-confirmation settlement on TRON network. Low gas fee.'
  };

  const [usdtAmount, setUsdtAmount] = useState<string>('100');
  const [txHash, setTxHash] = useState<string>('');
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const cryptoReceivingAddress = selectedVault.wallet_address;

  const parsedUsdt = parseFloat(usdtAmount) || 0;
  const cryptoInrValue = Number((parsedUsdt * stats.realtime_exchange_rate).toFixed(2));
  const cryptoTotalReceivable = cryptoInrValue;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCryptoAddress(true);
    setTimeout(() => setCopiedCryptoAddress(false), 2000);
    showToast(`${label} copied to clipboard!`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        showToast('Payment receipt screenshot attached.');
      };
      reader.readAsDataURL(file);
    }
  };

  const isBEP20 = selectedVault.network === 'BSC' || selectedVault.network === 'BEP20';
  const cleanedHash = txHash.trim();
  const isValidHash = isBEP20 
    ? /^0x[a-fA-F0-9]{64}$/.test(cleanedHash) 
    : /^[a-fA-F0-9]{64}$/.test(cleanedHash);

  const placeholderText = isBEP20
    ? "Paste 66-character BEP-20 transaction hash (starts with 0x)..."
    : "Paste 64-character TRC-20 transaction hash here...";

  const minDeposit = stats.min_deposit || 50;
  const maxDeposit = stats.max_deposit || 5000;

  const handleSubmitCryptoDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedUsdt <= 0) {
      showToast('Please enter a valid USDT deposit amount.');
      return;
    }
    if (parsedUsdt < minDeposit) {
      showToast(`Minimum deposit amount is ${minDeposit} USDT.`);
      return;
    }
    if (parsedUsdt > maxDeposit) {
      showToast(`Maximum single deposit limit is ${maxDeposit} USDT.`);
      return;
    }
    if (!isValidHash) {
      showToast(`Please enter a valid ${selectedVault.network_name} transaction hash.`);
      return;
    }

    triggerConfirmSound();
    setIsSubmitting(true);
    try {
      const res = submitDeposit(
        parsedUsdt,
        (selectedVault.network === 'TRC20' || selectedVault.network === 'BSC') ? selectedVault.network : 'Crypto',
        cleanedHash || undefined,
        screenshotPreview || undefined,
        `Crypto Vault (${selectedVault.network_name})`
      );

      if (res.success) {
        triggerSuccessSound();
        setActiveScreen('home');
      } else {
        showToast(res.message);
      }
    } catch (err) {
      console.error(err);
      showToast('Error submitting deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <button
          onClick={() => {
            triggerCancelSound();
            setActiveScreen('home');
          }}
          className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>USDT Crypto Deposit Vault</span>
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded border border-emerald-200">
              TRC20 & BEP20
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Fixed Peg Rate: 1 USDT = ₹{stats.realtime_exchange_rate} INR • Secure Escrow Settlement
          </p>
        </div>
      </div>

      {/* SLA & Multi-Chain Notice */}
      <div className="fintech-card-soft p-3 flex items-center gap-3 border-emerald-200 bg-emerald-50/60">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-[11px] text-emerald-950 leading-tight">
          <strong className="text-emerald-900 block font-bold">USDT Cryptocurrency Deposits Only</strong>
          Deposits are credited automatically upon blockchain confirmation.
        </div>
      </div>

      {/* 1. Network Selector */}
      <div className="fintech-card p-4 space-y-3">
        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
          <span>Select Transfer Blockchain Network</span>
          <span className="text-[10px] text-slate-500">TRC20 & BEP20 supported</span>
        </label>
        
        <div className={`grid gap-2.5 ${activeCryptoVaults.length > 2 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
          {activeCryptoVaults.map(vault => {
            const isSelected = selectedVaultId === vault.id;
            return (
              <button
                key={vault.id}
                type="button"
                onClick={() => {
                  triggerSwitchSound();
                  setSelectedVaultId(vault.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{vault.network_name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  {vault.confirmations_required} Conf. • Min {vault.min_deposit} USDT
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Official Receiving Address & QR Code */}
      <div className="fintech-card p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Official Custodial Vault Address</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
            {selectedVault.network_name}
          </span>
        </div>

        {/* QR Code Center Display */}
        <div className="flex justify-center py-2">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <QRCodeDisplay value={cryptoReceivingAddress} size={150} />
          </div>
        </div>

        {/* Address Input + Copy */}
        <div className="flex items-center gap-2">
          <div className="flex-1 fintech-inset px-3 py-2 text-xs font-mono text-slate-800 truncate select-all">
            {cryptoReceivingAddress}
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(cryptoReceivingAddress, 'Official Crypto Address')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              copiedCryptoAddress 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {copiedCryptoAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCryptoAddress ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 3. Deposit Amount & Live Peg Calculator */}
      <div className="fintech-card p-4 space-y-3">
        <label className="text-xs font-bold text-slate-800 block">
          Deposit Amount (USDT)
        </label>
        
        <div className="relative">
          <input
            type="number"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            placeholder="e.g. 100"
            min="10"
            step="1"
            className="w-full fintech-inset px-3.5 py-2.5 text-base font-bold font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
            USDT
          </span>
        </div>

        {/* Quick Amount Pills */}
        <div className="grid grid-cols-5 gap-1.5">
          {['50', '100', '500', '1000', '5000'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                triggerSwitchSound();
                setUsdtAmount(preset);
              }}
              className={`py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                usdtAmount === preset
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
          <span>Deposit Limits:</span>
          <span className="font-mono font-bold text-slate-700">
            Min {minDeposit} USDT • Max {maxDeposit} USDT
          </span>
        </div>

        {/* Breakdown Calculation */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Guaranteed Conversion (1 USDT = ₹{stats.realtime_exchange_rate}):</span>
            <strong className="font-mono text-slate-900">₹{cryptoInrValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
            <span>Total Credit to Balance:</span>
            <span className="font-mono text-emerald-700">₹{cryptoTotalReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 4. Verification Form: Tx Hash & Proof Upload */}
      <form onSubmit={handleSubmitCryptoDeposit} className="fintech-card p-4 space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Step 2: Submit Proof of Transfer
        </h3>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center justify-between">
            <span>Blockchain Transaction ID / Hash (TxID) <span className="text-rose-600">*</span></span>
            <span className="text-[10px] text-slate-500 font-medium">
              Format: {isBEP20 ? 'BEP-20 (66 chars, 0x...)' : 'TRC-20 (64 chars)'}
            </span>
          </label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value.replace(/\s+/g, ''))}
            placeholder={placeholderText}
            className={`w-full fintech-inset px-3 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none border ${
              cleanedHash.length > 0 && !isValidHash 
                ? 'border-rose-400 bg-rose-50/30' 
                : cleanedHash.length > 0 && isValidHash
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-200'
            }`}
            required
          />
          {cleanedHash.length > 0 && !isValidHash && (
            <p className="text-[10px] text-rose-600 font-bold mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {isBEP20 
                ? `❌ Invalid BEP-20 TxID (${cleanedHash.length}/66 chars). Must start with '0x' followed by 64 hexadecimal characters.`
                : `❌ Invalid TRC-20 TxID (${cleanedHash.length}/64 chars). Must be exactly 64 hexadecimal characters long.`
              }
            </p>
          )}
          {cleanedHash.length > 0 && isValidHash && (
            <p className="text-[10px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <span>✓ Valid {isBEP20 ? 'BEP-20 (BSC)' : 'TRC-20 (TRON)'} transaction hash format detected.</span>
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Upload Transfer Screenshot / Receipt (Optional)
          </label>
          <label className="fintech-inset p-3 flex flex-col items-center justify-center border-dashed border-slate-300 hover:border-slate-400 cursor-pointer transition-all">
            <Upload className="w-5 h-5 text-slate-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700">
              {fileName || 'Tap to select image from device'}
            </span>
            <span className="text-[10px] text-slate-400">Supports JPG, PNG (Max 10MB)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {screenshotPreview && (
            <div className="mt-2 p-1.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 truncate">{fileName}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Attached
              </span>
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={!isValidHash || isSubmitting || parsedUsdt <= 0}
          whileHover={(!isValidHash || isSubmitting || parsedUsdt <= 0) ? {} : { scale: 1.01 }}
          whileTap={(!isValidHash || isSubmitting || parsedUsdt <= 0) ? {} : { scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none ${
            (!isValidHash || isSubmitting || parsedUsdt <= 0)
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none'
              : 'fintech-btn-emerald cursor-pointer shadow-xs'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting Verification...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Submit USDT Crypto Deposit</span>
            </>
          )}
        </motion.button>
      </form>

    </div>
  );
};
