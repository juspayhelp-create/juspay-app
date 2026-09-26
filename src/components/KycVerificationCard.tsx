import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  X, 
  Eye, 
  ChevronRight,
  UserCheck, 
  FileCheck,
  Building,
  MapPin,
  Calendar,
  Phone,
  CreditCard,
  Lock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KycDocumentType, KycVerification } from '../types';

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

interface FileUploadState {
  file: File | null;
  previewUrl: string | null;
  fileName: string;
  fileSize: number;
  isPdf: boolean;
}

export interface KycVerificationCardProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideBannerWhenVerified?: boolean;
}

export const KycVerificationCard: React.FC<KycVerificationCardProps> = ({
  isOpen: externalIsOpen,
  onOpenChange,
  hideBannerWhenVerified = true
}) => {
  const { currentUser, isAuthenticated, showToast, refreshUserProfile } = useApp();

  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isKycModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleSetIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
    setInternalIsOpen(open);
  };

  const [kycData, setKycData] = useState<KycVerification | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [documentType, setDocumentType] = useState<KycDocumentType>('Aadhaar Card');
  const [documentNumber, setDocumentNumber] = useState<string>('');

  // Upload States
  const [frontImage, setFrontImage] = useState<FileUploadState>({
    file: null,
    previewUrl: null,
    fileName: '',
    fileSize: 0,
    isPdf: false
  });
  const [backImage, setBackImage] = useState<FileUploadState>({
    file: null,
    previewUrl: null,
    fileName: '',
    fileSize: 0,
    isPdf: false
  });

  // Client Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Fetch current KYC verification status from backend API
  const fetchKycStatus = async () => {
    if (!isAuthenticated || currentUser.id === 'guest') {
      setIsLoadingStatus(false);
      return;
    }

    try {
      setIsLoadingStatus(true);
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'x-user-id': String(currentUser.id),
        'x-user-email': currentUser.email,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`/api/kyc/status?userId=${encodeURIComponent(currentUser.id)}&email=${encodeURIComponent(currentUser.email)}`, {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.verification) {
          setKycData(data.verification);
        } else {
          setKycData(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load KYC status from server:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, [isAuthenticated, currentUser.id, currentUser.kyc_status]);

  // Handle Document Selector Change
  const handleDocumentTypeChange = (newType: KycDocumentType) => {
    setDocumentType(newType);
    setDocumentNumber('');
    setErrors(prev => ({ ...prev, documentNumber: '', frontImage: '', backImage: '' }));
    if (newType === 'PAN Card' || newType === 'Driving License') {
      if (backImage.previewUrl && !backImage.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(backImage.previewUrl);
      }
      setBackImage({
        file: null,
        previewUrl: null,
        fileName: '',
        fileSize: 0,
        isPdf: false
      });
    }
  };

  // Document Number Formatter & Input Handler
  const handleDocNumberChange = (val: string) => {
    let clean = val;
    if (documentType === 'Aadhaar Card') {
      const digitsOnly = val.replace(/\D/g, '').slice(0, 12);
      const parts = digitsOnly.match(/.{1,4}/g);
      clean = parts ? parts.join(' ') : digitsOnly;
    } else if (documentType === 'PAN Card') {
      clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else {
      clean = val.toUpperCase().slice(0, 20);
    }
    setDocumentNumber(clean);
    if (errors.documentNumber) {
      setErrors(prev => ({ ...prev, documentNumber: '' }));
    }
  };

  // File Upload Handler with Validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(fileExt)) {
      showToast('Unsupported format! Only PNG, JPG, JPEG, and PDF are allowed.');
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('File too large! Maximum allowed size is 5MB.');
      e.target.value = '';
      return;
    }

    const isPdf = fileExt === 'pdf' || file.type === 'application/pdf';
    const previewUrl = isPdf ? '' : URL.createObjectURL(file);

    const fileState: FileUploadState = {
      file,
      previewUrl,
      fileName: file.name,
      fileSize: file.size,
      isPdf
    };

    if (isFront) {
      if (frontImage.previewUrl && !frontImage.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(frontImage.previewUrl);
      }
      setFrontImage(fileState);
      setErrors(prev => ({ ...prev, frontImage: '' }));
    } else {
      if (backImage.previewUrl && !backImage.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(backImage.previewUrl);
      }
      setBackImage(fileState);
      setErrors(prev => ({ ...prev, backImage: '' }));
    }
  };

  const removeFile = (isFront: boolean) => {
    if (isFront) {
      if (frontImage.previewUrl && !frontImage.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(frontImage.previewUrl);
      }
      setFrontImage({ file: null, previewUrl: null, fileName: '', fileSize: 0, isPdf: false });
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else {
      if (backImage.previewUrl && !backImage.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(backImage.previewUrl);
      }
      setBackImage({ file: null, previewUrl: null, fileName: '', fileSize: 0, isPdf: false });
      if (backInputRef.current) backInputRef.current.value = '';
    }
  };

  // Client-Side Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      newErrors.fullName = 'Please enter your full name as printed on ID';
    }

    if (!dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dob = 'You must be at least 18 years of age to complete KYC';
      }
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      newErrors.mobileNumber = 'Enter a valid 10-digit Indian mobile number';
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobileNumber = 'Mobile number must start with 6, 7, 8, or 9';
    }

    if (!address.trim() || address.trim().length < 6) {
      newErrors.address = 'Please provide complete residential street/flat address';
    }

    if (!state) {
      newErrors.state = 'Please select your Indian State or Union Territory';
    }

    const cleanPincode = pincode.replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      newErrors.pincode = 'PIN Code must be exactly 6 numeric digits';
    }

    // Document Number Validation
    if (documentType === 'Aadhaar Card') {
      const aadhaarDigits = documentNumber.replace(/\s+/g, '');
      if (aadhaarDigits.length !== 12 || !/^\d{12}$/.test(aadhaarDigits)) {
        newErrors.documentNumber = 'Aadhaar Number must be 12 digits (XXXX XXXX XXXX)';
      }
      if (!frontImage.file) {
        newErrors.frontImage = 'Upload Aadhaar Front image';
      }
      if (!backImage.file) {
        newErrors.backImage = 'Upload Aadhaar Back image';
      }
    } else if (documentType === 'PAN Card') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(documentNumber.trim())) {
        newErrors.documentNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
      if (!frontImage.file) {
        newErrors.frontImage = 'Upload PAN Front image';
      }
    } else if (documentType === 'Driving License') {
      if (!documentNumber.trim() || documentNumber.trim().length < 8) {
        newErrors.documentNumber = 'Enter a valid Driving License Number';
      }
      if (!frontImage.file) {
        newErrors.frontImage = 'Upload Driving License Front image';
      }
    } else if (documentType === 'Passport') {
      const passportRegex = /^[A-Z]{1}[0-9]{7,8}$/;
      if (!passportRegex.test(documentNumber.trim())) {
        newErrors.documentNumber = 'Passport Number must be 1 letter followed by 7-8 digits (e.g. A1234567)';
      }
      if (!frontImage.file) {
        newErrors.frontImage = 'Upload Passport Bio Page';
      }
      if (!backImage.file) {
        newErrors.backImage = 'Upload Passport Address Page';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to submit KYC verification');
      return;
    }

    if (!validateForm()) {
      showToast('Please correct the highlighted errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('dob', dob);
      formData.append('mobile_number', mobileNumber.replace(/\D/g, ''));
      formData.append('address', address.trim());
      formData.append('state', state);
      formData.append('pincode', pincode.replace(/\D/g, ''));
      formData.append('document_type', documentType);
      formData.append('document_number', documentNumber.trim());

      if (frontImage.file) {
        formData.append('front_image', frontImage.file);
      }
      if (backImage.file) {
        formData.append('back_image', backImage.file);
      }

      const headers: Record<string, string> = {
        'x-user-id': String(currentUser.id),
        'x-user-email': currentUser.email,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('KYC documents submitted successfully! Verification is under review.');
        await refreshUserProfile();
        await fetchKycStatus();
      } else {
        showToast(data.message || data.error || 'Failed to submit KYC. Please try again.');
      }
    } catch (err: any) {
      console.error('KYC submission error:', err);
      showToast('Network error during KYC submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveStatus = (currentUser.kyc_status || kycData?.status || 'NOT_SUBMITTED').toUpperCase();
  const isVerified = effectiveStatus === 'VERIFIED' || effectiveStatus === 'APPROVED';
  const isPending = effectiveStatus === 'PENDING';
  const isRejected = effectiveStatus === 'REJECTED';
  const rejectionReason = currentUser.kyc_rejection_reason || kycData?.rejection_reason || 'Document verification could not be completed. Please re-submit clear documents.';

  // Mask Document Number helper
  const getMaskedDocNumber = (num?: string, type?: string) => {
    if (!num) return '•••• •••• ••••';
    const clean = num.replace(/\s+/g, '');
    if (type === 'Aadhaar Card' || clean.length === 12) {
      return `XXXX-XXXX-${clean.slice(-4)}`;
    }
    if (clean.length > 5) {
      return `${clean.slice(0, 3)}••••${clean.slice(-2)}`;
    }
    return '••••••••';
  };

  const showBanner = !isVerified || hideBannerWhenVerified === false;

  if (!showBanner && !isKycModalOpen) {
    return null;
  }

  return (
    <>
      {/* 1. THE TRIGGER KYC CARD (Clean, compact on Profile Screen) */}
      {showBanner && (
        <div 
          onClick={() => handleSetIsOpen(true)}
          className="fintech-card p-4 bg-gradient-to-br from-white via-slate-50/60 to-emerald-50/20 border border-slate-200 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group active:scale-[0.99] relative overflow-hidden"
        >
        <div className="flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform group-hover:scale-105 ${
              isVerified 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : isPending 
                  ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                  : isRejected 
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}>
              {isVerified ? (
                <ShieldCheck className="w-6 h-6" />
              ) : isPending ? (
                <Clock className="w-6 h-6" />
              ) : isRejected ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <FileCheck className="w-6 h-6" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-slate-900 truncate">
                  Identity KYC Verification
                </h3>
                
                {/* Status Badges */}
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300">
                    VERIFIED
                  </span>
                ) : isPending ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300 animate-pulse">
                    IN REVIEW
                  </span>
                ) : isRejected ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black border border-rose-300">
                    ACTION NEEDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200">
                    NOT SUBMITTED
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {isVerified
                  ? `Account #${currentUser.id} • ${kycData?.document_type || 'Aadhaar'} verified`
                  : isPending
                    ? 'Under compliance review (turnaround 2-4 hrs)'
                    : isRejected
                      ? 'Previous ID rejected • Tap to rectify & re-apply'
                      : 'Upload government ID to unlock institutional limits'}
              </p>
            </div>
          </div>

          {/* Right Action Trigger */}
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
              isVerified
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100'
                : isPending
                  ? 'bg-amber-50 text-amber-800 border-amber-200 group-hover:bg-amber-100'
                  : isRejected
                    ? 'bg-rose-50 text-rose-700 border-rose-200 group-hover:bg-rose-100'
                    : 'bg-emerald-600 text-white border-emerald-600 group-hover:bg-emerald-700 shadow-xs'
            }`}>
              <span>{isVerified ? 'View KYC' : isPending ? 'Check Status' : isRejected ? 'Fix & Re-submit' : 'Start KYC'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>
      </div>
      )}

      {/* 2. THE EXPANDED KYC OPTION (Interactive Modal / Dialog View) */}
      {isKycModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => handleSetIsOpen(false)}
        >
          <div 
            className="relative max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            
            {/* MODAL HEADER */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isVerified ? 'bg-emerald-500/20 text-emerald-400' : isPending ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-200'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Indian Identity KYC
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    Government Document Verification Desk
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    VERIFIED
                  </span>
                ) : isPending ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                    IN REVIEW
                  </span>
                ) : isRejected ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                    REJECTED
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleSetIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MODAL CONTENT CONTAINER */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* STATE 1: VERIFIED */}
              {isVerified && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-emerald-950">
                          Identity Verified & Approved
                        </h4>
                        <span className="px-2 py-0.2 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                          Tier 1 Verified
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1">
                        Your government document has been verified. High-volume deposits, withdrawals, and merchant tools are permanently unlocked for account <strong className="font-mono text-emerald-900 font-extrabold">#{currentUser.id}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* VERIFIED DETAILS CARD */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Verified Full Name</span>
                      <span className="font-bold text-slate-900">{kycData?.full_name || currentUser.username}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Document Type</span>
                      <span className="font-bold text-slate-900">{kycData?.document_type || 'Government ID'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Document ID</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {getMaskedDocNumber(kycData?.document_number, kycData?.document_type)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">State / Region</span>
                      <span className="font-bold text-slate-900">{kycData?.state || 'India'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Verification Status</span>
                      <span className="text-emerald-700 font-extrabold inline-flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked & Tamper-Proof
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSetIsOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Done / Close
                  </button>
                </div>
              )}

              {/* STATE 2: PENDING REVIEW LOCK */}
              {isPending && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-amber-950">
                        Verification In Progress
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Your submitted identity documents are actively undergoing verification by our compliance desk. Editing is locked during active review.
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Estimated review time: 2 - 4 business hours
                      </div>
                    </div>
                  </div>

                  {/* SUBMITTED SNAPSHOT */}
                  {kycData && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
                      <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>Submitted Details</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {kycData.created_at ? new Date(kycData.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Name on ID:</span>
                        <span className="font-bold text-slate-900">{kycData.full_name}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ID Type:</span>
                        <span className="font-bold text-slate-900">{kycData.document_type}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ID Number:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {getMaskedDocNumber(kycData.document_number, kycData.document_type)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State & PIN:</span>
                        <span className="font-bold text-slate-900">{kycData.state} - {kycData.pincode}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSetIsOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Done / Close
                  </button>
                </div>
              )}

              {/* STATE 3: NOT SUBMITTED OR REJECTED (SHOW SUBMISSION FORM) */}
              {(!isVerified && !isPending) && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* REJECTION REASON CALLOUT */}
                  {isRejected && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-rose-950">
                          Previous Submission Rejected
                        </h4>
                        <p className="text-xs text-rose-800 mt-0.5 leading-relaxed font-medium">
                          <strong>Reason:</strong> {rejectionReason}
                        </p>
                        <span className="text-[10px] font-bold text-rose-700 block mt-1">
                          Please update your information and re-upload clear photos to verify.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* INSTRUCTION NOTICE */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Please ensure your details match your government proof exactly. Supported files: <strong>PNG, JPG, JPEG, PDF</strong> (max 5MB).
                    </span>
                  </div>

                  {/* COMMON FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                        }}
                        placeholder="As per government ID card"
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                          errors.fullName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setDob(e.target.value);
                          if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                          errors.dob ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                        }`}
                      />
                      {errors.dob && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.dob}
                        </p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">
                        Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex">
                        <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-extrabold text-slate-600 flex items-center">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setMobileNumber(clean);
                            if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: '' }));
                          }}
                          placeholder="9876543210"
                          className={`w-full px-3.5 py-2.5 text-xs rounded-r-xl border bg-white focus:outline-none focus:ring-2 font-mono transition-all ${
                            errors.mobileNumber ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                      {errors.mobileNumber && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.mobileNumber}
                        </p>
                      )}
                    </div>

                    {/* State Selection */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">
                        State / Territory <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                          errors.state ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">-- Select State / UT (36) --</option>
                        {INDIAN_STATES_AND_UTS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.state}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Full Address */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                      Complete Residential Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      placeholder="House/Flat No, Apartment/Building, Street, Area/Landmark"
                      className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 resize-none transition-all ${
                        errors.address ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.address}
                      </p>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div className="w-full sm:w-1/2">
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                      PIN Code (6 Digits) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPincode(clean);
                        if (errors.pincode) setErrors(prev => ({ ...prev, pincode: '' }));
                      }}
                      placeholder="e.g. 560001"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 font-mono transition-all ${
                        errors.pincode ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                      }`}
                    />
                    {errors.pincode && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.pincode}
                      </p>
                    )}
                  </div>

                  {/* DOCUMENT SELECTOR */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-extrabold text-slate-800 mb-2">
                      Select Identity Document Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport'] as KycDocumentType[]).map(doc => (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => handleDocumentTypeChange(doc)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            documentType === doc 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <CreditCard className={`w-4 h-4 ${documentType === doc ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="truncate w-full text-[11px]">{doc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DYNAMIC DOCUMENT NUMBER INPUT */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                      {documentType === 'Aadhaar Card' && '12-digit Aadhaar Number'}
                      {documentType === 'PAN Card' && '10-character PAN Number (e.g. ABCDE1234F)'}
                      {documentType === 'Driving License' && 'Driving License Number'}
                      {documentType === 'Passport' && 'Passport Number (e.g. A1234567)'}
                      <span className="text-rose-500"> *</span>
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => handleDocNumberChange(e.target.value)}
                      placeholder={
                        documentType === 'Aadhaar Card' ? '1234 5678 9012' :
                        documentType === 'PAN Card' ? 'ABCDE1234F' :
                        documentType === 'Driving License' ? 'DL-1420110012345' : 'A1234567'
                      }
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 font-mono uppercase tracking-wider transition-all ${
                        errors.documentNumber ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-200 focus:border-emerald-500'
                      }`}
                    />
                    {errors.documentNumber && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.documentNumber}
                      </p>
                    )}
                  </div>

                  {/* DYNAMIC UPLOAD DROPZONES */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 mb-2">
                      Upload Document Images <span className="text-rose-500">*</span>
                    </h4>

                    <div className={`grid gap-3 ${
                      (documentType === 'Aadhaar Card' || documentType === 'Passport') 
                        ? 'grid-cols-1 sm:grid-cols-2' 
                        : 'grid-cols-1'
                    }`}>
                      
                      {/* DROPZONE 1: FRONT IMAGE */}
                      <div>
                        <span className="block text-[11px] font-bold text-slate-600 mb-1">
                          {documentType === 'Aadhaar Card' && 'Upload Aadhaar Front'}
                          {documentType === 'PAN Card' && 'Upload PAN Front'}
                          {documentType === 'Driving License' && 'Upload License Front'}
                          {documentType === 'Passport' && 'Upload Passport Bio Page'}
                          <span className="text-rose-500"> *</span>
                        </span>

                        <input
                          ref={frontInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          onChange={(e) => handleFileSelect(e, true)}
                          className="hidden"
                          id="modal-kyc-front-upload"
                        />

                        {!frontImage.file ? (
                          <label
                            htmlFor="modal-kyc-front-upload"
                            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all ${
                              errors.frontImage ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-slate-50/50'
                            }`}
                          >
                            <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                            <span className="text-xs font-bold text-slate-700">Click to upload document front</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF (Max 5MB)</span>
                          </label>
                        ) : (
                          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {frontImage.isPdf ? (
                                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  PDF
                                </div>
                              ) : frontImage.previewUrl ? (
                                <img
                                  src={frontImage.previewUrl}
                                  alt="Front Preview"
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                                  onClick={() => setLightboxUrl(frontImage.previewUrl)}
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-slate-500" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{frontImage.fileName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {(frontImage.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {frontImage.previewUrl && (
                                <button
                                  type="button"
                                  onClick={() => setLightboxUrl(frontImage.previewUrl)}
                                  className="p-1 text-slate-500 hover:text-slate-800"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(true)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                title="Remove file"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {errors.frontImage && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.frontImage}
                          </p>
                        )}
                      </div>

                      {/* DROPZONE 2: BACK IMAGE (IF AADHAAR OR PASSPORT) */}
                      {(documentType === 'Aadhaar Card' || documentType === 'Passport') && (
                        <div>
                          <span className="block text-[11px] font-bold text-slate-600 mb-1">
                            {documentType === 'Aadhaar Card' ? 'Upload Aadhaar Back' : 'Upload Passport Address Page'}
                            <span className="text-rose-500"> *</span>
                          </span>

                          <input
                            ref={backInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,application/pdf"
                            onChange={(e) => handleFileSelect(e, false)}
                            className="hidden"
                            id="modal-kyc-back-upload"
                          />

                          {!backImage.file ? (
                            <label
                              htmlFor="modal-kyc-back-upload"
                              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all ${
                                errors.backImage ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-slate-50/50'
                              }`}
                            >
                              <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                              <span className="text-xs font-bold text-slate-700">Click to upload document back</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF (Max 5MB)</span>
                            </label>
                          ) : (
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {backImage.isPdf ? (
                                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    PDF
                                  </div>
                                ) : backImage.previewUrl ? (
                                  <img
                                    src={backImage.previewUrl}
                                    alt="Back Preview"
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                                    onClick={() => setLightboxUrl(backImage.previewUrl)}
                                  />
                                ) : (
                                  <FileText className="w-6 h-6 text-slate-500" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{backImage.fileName}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {(backImage.fileSize / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {backImage.previewUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxUrl(backImage.previewUrl)}
                                    className="p-1 text-slate-500 hover:text-slate-800"
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeFile(false)}
                                  className="p-1 text-rose-500 hover:text-rose-700"
                                  title="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {errors.backImage && (
                            <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.backImage}
                            </p>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSubmitting 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Encrypted Documents...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit Identity for Verification</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                      🔒 256-bit SSL encrypted. Data strictly utilized for regulatory compliance.
                    </p>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Document Screenshot Preview</span>
              <button 
                onClick={() => setLightboxUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-100 max-h-[70vh] overflow-auto">
              <img src={lightboxUrl} alt="Document Preview" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
