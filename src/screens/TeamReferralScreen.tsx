import React, { useState, useMemo, useEffect } from 'react';
import { formatISTTimestamp } from '../utils/time';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Award, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  QrCode, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Zap,
  Search,
  Filter,
  User,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useApp, calculateAffiliateCommissionDetails } from '../context/AppContext';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { Transaction, User as UserType } from '../types';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound } from '../utils/haptics';

export const TeamReferralScreen: React.FC = () => {
  const { currentUser, allUsers, transactions, stats, showToast, commissionStats, teamData, fetchTeamData } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    triggerSwitchSound();
    await fetchTeamData();
    showToast('Team statistics updated.');
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filter & Search states for Commission History Table
  const [selectedTierFilter, setSelectedTierFilter] = useState<'All' | 'Level A' | 'Level B' | 'Level C'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const referralCode = currentUser.referral_code || 'JUS7789';
  const referralLink = currentUser.referral_link || `${window.location.origin || 'https://juspay.io'}/?ref=${referralCode}`;

  const currentRefCode = (currentUser.referral_code || currentUser.referralCode || 'JUS7789').toLowerCase().trim();

  // Lookup maps for O(1) traversal
  const userByCode = useMemo(() => {
    const map = new Map<string, UserType>();
    (allUsers || []).forEach(u => {
      if (u.referral_code) map.set(u.referral_code.toLowerCase().trim(), u);
      if (u.referralCode) map.set(u.referralCode.toLowerCase().trim(), u);
      if (u.id) map.set(String(u.id).toLowerCase().trim(), u);
      if (u.email) map.set(u.email.toLowerCase().trim(), u);
      if (u.username) map.set(u.username.toLowerCase().trim(), u);
    });
    return map;
  }, [allUsers]);

  // All referral identifiers for logged in user
  const myCodes = useMemo(() => {
    const codes = new Set<string>();
    if (currentUser?.referral_code) codes.add(currentUser.referral_code.toLowerCase().trim());
    if (currentUser?.referralCode) codes.add(currentUser.referralCode.toLowerCase().trim());
    if (currentUser?.id) codes.add(String(currentUser.id).toLowerCase().trim());
    if (currentUser?.email) codes.add(currentUser.email.toLowerCase().trim());
    if (currentUser?.username) codes.add(currentUser.username.toLowerCase().trim());
    return codes;
  }, [currentUser]);

  // Level A Members: Users who directly registered with currentUser's code
  const directMembers = useMemo(() => {
    if (teamData?.level1 && teamData.level1.length > 0) {
      return teamData.level1.map(m => ({
        id: String(m.id),
        username: m.username,
        email: m.email,
        deposit_balance: Number(m.deposit_balance ?? m.total_deposit ?? 0),
        total_deposit: Number(m.total_deposit ?? m.deposit_balance ?? 0),
        vault_balance: Number(m.vault_balance ?? m.deposit_balance ?? 0),
        commission_balance: Number(m.commission_earned_inr || 0),
        total_commissions: Number(m.commission_earned_inr || 0),
        referral_code: m.referral_code || 'JUS7789',
        referred_by: m.referred_by || currentUser.referral_code,
        role: 'user' as const,
        status: (m.is_active ? 'Active' : 'Active') as any,
        created_at: m.created_at || new Date().toISOString().slice(0, 10),
      } as unknown as UserType));
    }
    return (allUsers || []).filter(u => {
      if (u.id === currentUser.id || String(u.id) === String(currentUser.id)) return false;
      const refBy = (u.referred_by || u.referredBy || u.upline_code || u.referrer_id || '').toLowerCase().trim();
      return refBy ? myCodes.has(refBy) || u.referrer_id === currentUser.id : false;
    });
  }, [teamData, allUsers, currentUser, myCodes]);

  const levelACodes = useMemo(() => {
    const codes = new Set<string>();
    directMembers.forEach(u => {
      if (u.referral_code) codes.add(u.referral_code.toLowerCase().trim());
      if (u.referralCode) codes.add(u.referralCode.toLowerCase().trim());
      if (u.id) codes.add(String(u.id).toLowerCase().trim());
      if (u.email) codes.add(u.email.toLowerCase().trim());
      if (u.username) codes.add(u.username.toLowerCase().trim());
    });
    return codes;
  }, [directMembers]);

  const levelAUserIds = useMemo(() => {
    const ids = new Set<string>();
    directMembers.forEach(u => {
      if (u.id) ids.add(String(u.id).toLowerCase());
      if (u.email) ids.add(u.email.toLowerCase());
      if (u.username) ids.add(u.username.toLowerCase());
    });
    return ids;
  }, [directMembers]);

  // Level B Members: Users who registered with a Level A member's code
  const indirectMembers = useMemo(() => {
    if (teamData?.level2 && teamData.level2.length > 0) {
      return teamData.level2.map(m => ({
        id: String(m.id),
        username: m.username,
        email: m.email,
        deposit_balance: Number(m.deposit_balance ?? m.total_deposit ?? 0),
        total_deposit: Number(m.total_deposit ?? m.deposit_balance ?? 0),
        vault_balance: Number(m.vault_balance ?? m.deposit_balance ?? 0),
        commission_balance: Number(m.commission_earned_inr || 0),
        total_commissions: Number(m.commission_earned_inr || 0),
        referral_code: m.referral_code || 'JUS7789',
        referred_by: m.referred_by,
        role: 'user' as const,
        status: (m.is_active ? 'Active' : 'Active') as any,
        created_at: m.created_at || new Date().toISOString().slice(0, 10),
      } as unknown as UserType));
    }
    return (allUsers || []).filter(u => {
      if (u.id === currentUser.id || String(u.id) === String(currentUser.id)) return false;
      if (levelAUserIds.has(String(u.id).toLowerCase()) || levelAUserIds.has(u.email?.toLowerCase() || '')) return false;

      const dbL2Code = (u.upline_l2_code || '').toLowerCase().trim();
      if (dbL2Code && myCodes.has(dbL2Code)) return true;

      const refBy = (u.referred_by || u.referredBy || u.upline_code || u.referrer_id || '').toLowerCase().trim();
      if (!refBy) return false;

      if (levelACodes.has(refBy)) return true;

      const parent = userByCode.get(refBy);
      return parent ? levelAUserIds.has(String(parent.id).toLowerCase()) || levelAUserIds.has(parent.email?.toLowerCase() || '') : false;
    });
  }, [teamData, allUsers, currentUser, levelAUserIds, levelACodes, userByCode, myCodes]);

  const levelBUserIds = useMemo(() => {
    const ids = new Set<string>();
    indirectMembers.forEach(u => {
      if (u.id) ids.add(String(u.id).toLowerCase());
      if (u.email) ids.add(u.email.toLowerCase());
      if (u.username) ids.add(u.username.toLowerCase());
    });
    return ids;
  }, [indirectMembers]);

  // Level C Members: Users who registered with a Level B member's code
  const levelBCodes = useMemo(() => {
    const codes = new Set<string>();
    indirectMembers.forEach(u => {
      if (u.referral_code) codes.add(u.referral_code.toLowerCase().trim());
      if (u.referralCode) codes.add(u.referralCode.toLowerCase().trim());
      if (u.id) codes.add(String(u.id).toLowerCase().trim());
      if (u.email) codes.add(u.email.toLowerCase().trim());
      if (u.username) codes.add(u.username.toLowerCase().trim());
    });
    return codes;
  }, [indirectMembers]);

  const levelCMembers = useMemo(() => {
    if (teamData?.level3 && teamData.level3.length > 0) {
      return teamData.level3.map(m => ({
        id: String(m.id),
        username: m.username,
        email: m.email,
        deposit_balance: Number(m.deposit_balance ?? m.total_deposit ?? 0),
        total_deposit: Number(m.total_deposit ?? m.deposit_balance ?? 0),
        vault_balance: Number(m.vault_balance ?? m.deposit_balance ?? 0),
        commission_balance: Number(m.commission_earned_inr || 0),
        total_commissions: Number(m.commission_earned_inr || 0),
        referral_code: m.referral_code || 'JUS7789',
        referred_by: m.referred_by,
        role: 'user' as const,
        status: (m.is_active ? 'Active' : 'Active') as any,
        created_at: m.created_at || new Date().toISOString().slice(0, 10),
      } as unknown as UserType));
    }
    return (allUsers || []).filter(u => {
      if (u.id === currentUser.id || String(u.id) === String(currentUser.id)) return false;
      if (levelAUserIds.has(String(u.id).toLowerCase()) || levelAUserIds.has(u.email?.toLowerCase() || '')) return false;
      if (levelBUserIds.has(String(u.id).toLowerCase()) || levelBUserIds.has(u.email?.toLowerCase() || '')) return false;

      // Match database column upline_l3_code if present
      const dbL3Code = (u.upline_l3_code || '').toLowerCase().trim();
      if (dbL3Code && myCodes.has(dbL3Code)) return true;

      const refBy = (u.referred_by || u.referredBy || u.upline_code || u.referrer_id || '').toLowerCase().trim();
      if (!refBy) return false;

      if (levelBCodes.has(refBy)) return true;

      const parent = userByCode.get(refBy);
      return parent ? levelBUserIds.has(String(parent.id).toLowerCase()) || levelBUserIds.has(parent.email?.toLowerCase() || '') : false;
    });
  }, [teamData, allUsers, currentUser, levelAUserIds, levelBUserIds, levelBCodes, userByCode, myCodes]);

  const levelCUserIds = useMemo(() => {
    const ids = new Set<string>();
    levelCMembers.forEach(u => {
      if (u.id) ids.add(String(u.id).toLowerCase());
      if (u.email) ids.add(u.email.toLowerCase());
      if (u.username) ids.add(u.username.toLowerCase());
    });
    return ids;
  }, [levelCMembers]);

  const totalActiveNetworkSize = (teamData?.total_count || (directMembers.length + indirectMembers.length + levelCMembers.length));
  const totalReferredFriends = (teamData?.l1_count || directMembers.length);

  // Helper to identify the team member who generated a given commission transaction
  const getGeneratingMember = (tx: Transaction): UserType | null => {
    if (tx.sourceUserId || tx.source_user_id || tx.from_user_id) {
      const srcId = tx.sourceUserId || tx.source_user_id || tx.from_user_id;
      const found = allUsers.find(u => u.id === srcId || String(u.id) === String(srcId));
      if (found) return found;
    }
    if (tx.sourceUserEmail || tx.source_user_email) {
      const srcEmail = (tx.sourceUserEmail || tx.source_user_email || '').toLowerCase();
      const found = allUsers.find(u => u.email.toLowerCase() === srcEmail);
      if (found) return found;
    }
    // Search in transaction notes or description
    const text = ((tx.notes || '') + ' ' + (tx.description || '')).toLowerCase();
    for (const u of allUsers) {
      if ((u.email && text.includes(u.email.toLowerCase())) || (u.username && text.includes(u.username.toLowerCase())) || (u.referral_code && text.includes(u.referral_code.toLowerCase()))) {
        return u;
      }
    }
    return null;
  };

  // Extract all referral commission transactions for current user
  const userCommissionTxs = useMemo(() => {
    let txs = transactions.filter(
      t => (
        t.user_id === currentUser.id || 
        t.userId === currentUser.id || 
        String(t.user_id) === String(currentUser.id) || 
        String(t.userId) === String(currentUser.id) ||
        (currentUser.email && (
          t.user_email?.toLowerCase() === currentUser.email.toLowerCase() || 
          t.userEmail?.toLowerCase() === currentUser.email.toLowerCase()
        ))
      ) && (
        t.type === 'commission' || 
        t.type === 'Referral Commission' || 
        t.type === 'REFERRAL_L1' ||
        t.type === 'REFERRAL_L2' ||
        t.type === 'REFERRAL_L3' ||
        t.tier === 'level_a' ||
        t.tier === 'level_b' ||
        t.tier === 'level_c' ||
        t.tier_info?.includes('Level A') || 
        t.tier_info?.includes('Level B') ||
        t.tier_info?.includes('Level C') ||
        t.tier_info?.includes('Level 1') || 
        t.tier_info?.includes('Level 2') ||
        t.tier_info?.includes('Level 3') ||
        (t.notes && (
          t.notes.toLowerCase().includes('referral') || 
          t.notes.toLowerCase().includes('affiliate') || 
          t.notes.toLowerCase().includes('commission')
        )) ||
        (t.description && (
          t.description.toLowerCase().includes('referral') || 
          t.description.toLowerCase().includes('affiliate') || 
          t.description.toLowerCase().includes('commission')
        ))
      ) &&
      !t.notes?.toLowerCase().includes('binding bonus') &&
      !t.notes?.toLowerCase().includes('task reward') &&
      !t.notes?.toLowerCase().includes('cashback') &&
      !t.description?.toLowerCase().includes('binding bonus')
    );

    return txs;
  }, [transactions, currentUser]);

  const settledDeposits = useMemo(() => {
    const raw = (transactions || []).filter(t => 
      ['deposit', 'recharge', 'crypto', 'crypto_deposit', 'crypto deposit'].includes(String(t.type || '').toLowerCase()) && 
      ['approved', 'completed', 'successful', 'settled'].includes(String(t.status || '').toLowerCase())
    );
    const seen = new Set<string>();
    const uniqueDeps: Transaction[] = [];
    for (const d of raw) {
      const key = String(d.order_id || d.id || d.utr_number || d.tx_id || `${d.amount}_${d.timestamp}`).toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueDeps.push(d);
    }
    return uniqueDeps;
  }, [transactions]);

  // Universal multi-field helper to check if a deposit belongs to any user in a target team list
  const isDepositFromTeam = (deposit: any, membersList: any[]) => {
    if (!Array.isArray(membersList) || membersList.length === 0) return false;
    return membersList.some(member => {
      const mId = String(member.id || '').toLowerCase();
      const mEmail = String(member.email || '').toLowerCase();
      const mUsername = String(member.username || '').toLowerCase();
      const mCode = String(member.referralCode || member.referral_code || '').toLowerCase();

      const dUserId = String(deposit.userId || deposit.user_id || '').toLowerCase();
      const dEmail = String(deposit.userEmail || deposit.user_email || '').toLowerCase();
      const dUsername = String(deposit.username || '').toLowerCase();
      const dRefCode = String(deposit.referralCode || deposit.referral_code || '').toLowerCase();

      return (
        (mId && (mId === dUserId || mId === dEmail)) ||
        (mEmail && (mEmail === dEmail || mEmail === dUserId)) ||
        (mUsername && (mUsername === dUsername || mUsername === dUserId)) ||
        (mCode && mCode === dRefCode)
      );
    });
  };

  // PURE COMPUTED REACTIVE COMMISSION LEDGER
  const computedCommissionRecords = useMemo(() => {
    const records: Transaction[] = [];
    const recordKeys = new Set<string>();
    const registeredDepositTiers = new Set<string>();

    const l1Rate = (stats.direct_referral_rate || 4.0) / 100;
    const l2Rate = (stats.indirect_referral_rate || 2.0) / 100;
    const l3Rate = (stats.level_3_referral_rate || 1.0) / 100;

    const normTier = (val: any): string => {
      if (!val) return '';
      const s = String(val).toLowerCase();
      if (s.includes('level_a') || s.includes('level a') || s.includes('level 1') || s.includes('l1') || s.includes('direct')) return 'level_a';
      if (s.includes('level_b') || s.includes('level b') || s.includes('level 2') || s.includes('l2') || s.includes('indirect')) return 'level_b';
      if (s.includes('level_c') || s.includes('level c') || s.includes('level 3') || s.includes('l3')) return 'level_c';
      return s;
    };

    const cleanDep = (val: any): string => {
      if (!val) return '';
      return String(val).trim().replace(/^COMM-/, '').replace(/-level_[abc]$/i, '').toLowerCase();
    };

    // 1. Include explicit stored commission transactions with deduplication & dynamic rate re-calculation
    (userCommissionTxs || []).forEach(tx => {
      const tier = normTier(tx.tier || tx.tier_info || tx.notes || tx.description);
      let activeRate = l1Rate;
      if (tier === 'level_b') activeRate = l2Rate;
      if (tier === 'level_c') activeRate = l3Rate;

      const depKey = cleanDep(tx.sourceDepositId || tx.source_deposit_id || tx.order_id || tx.id);

      // Check if there is an associated deposit for this stored transaction
      const matchingDep = settledDeposits.find(d => {
        const cId = cleanDep(d.id || d.order_id || d.tx_id);
        const cOrd = cleanDep(d.order_id);
        const cTx = cleanDep(d.tx_id);
        if (depKey && (cId === depKey || cOrd === depKey || cTx === depKey)) return true;
        const dUid = String(d.userId || d.user_id || '').toLowerCase();
        const tSrcUid = String(tx.sourceUserId || tx.source_user_id || '').toLowerCase();
        return Boolean(dUid && tSrcUid && dUid === tSrcUid);
      });

      let updatedTx = { ...tx };
      if (matchingDep && Number(matchingDep.amount || matchingDep.amount_inr || 0) > 0) {
        const depAmt = Number(matchingDep.amount || matchingDep.amount_inr || 0);
        const recalculatedAmt = Number((depAmt * activeRate).toFixed(2));
        updatedTx = {
          ...tx,
          amount: recalculatedAmt,
          amount_inr: recalculatedAmt,
          tier_info: tier === 'level_a' ? `Level A (${stats.direct_referral_rate || 4.0}%)` :
                     tier === 'level_b' ? `Level B (${stats.indirect_referral_rate || 2.0}%)` :
                     `Level C (${stats.level_3_referral_rate || 1.0}%)`
        };
      }

      const k1 = depKey ? `${depKey}_${tier}` : '';
      const kId = tx.id ? String(tx.id).toLowerCase() : '';
      const kOrder = tx.order_id ? String(tx.order_id).toLowerCase() : '';
      const kSrcUser = (tx.sourceUserId || tx.source_user_id) ? `${String(tx.sourceUserId || tx.source_user_id).toLowerCase()}_${tier}` : '';

      if ((k1 && recordKeys.has(k1)) || (kId && recordKeys.has(kId)) || (kOrder && recordKeys.has(kOrder)) || (kSrcUser && recordKeys.has(kSrcUser))) {
        return; // Skip duplicate stored commission
      }

      if (k1) {
        recordKeys.add(k1);
        registeredDepositTiers.add(k1);
      }
      if (kId) recordKeys.add(kId);
      if (kOrder) recordKeys.add(kOrder);
      if (kSrcUser) recordKeys.add(kSrcUser);

      // Register variations of depKey if order_id has COMM-
      if (tx.order_id) {
        const cleanedOrder = cleanDep(tx.order_id);
        if (cleanedOrder) {
          registeredDepositTiers.add(`${cleanedOrder}_${tier}`);
          recordKeys.add(`${cleanedOrder}_${tier}`);
        }
      }
      if (tx.sourceDepositId || tx.source_deposit_id) {
        const cleanedDep = cleanDep(tx.sourceDepositId || tx.source_deposit_id);
        if (cleanedDep) {
          registeredDepositTiers.add(`${cleanedDep}_${tier}`);
          recordKeys.add(`${cleanedDep}_${tier}`);
        }
      }
      const rawSrcOrder = (tx as any).sourceOrderId || (tx as any).source_order_id;
      if (rawSrcOrder) {
        const cleanedSrcOrder = cleanDep(rawSrcOrder);
        if (cleanedSrcOrder) {
          registeredDepositTiers.add(`${cleanedSrcOrder}_${tier}`);
          recordKeys.add(`${cleanedSrcOrder}_${tier}`);
        }
      }

      records.push(updatedTx);
    });

    // 2. Synthesize reactive commission records ONLY if not already present in stored records
    settledDeposits.forEach(dep => {
      const depUid = String(dep.user_id || dep.userId || '').toLowerCase();
      const depUemail = String(dep.user_email || dep.userEmail || '').toLowerCase();
      const depAmt = Number(dep.amount || dep.amount_inr || 0);
      const depId = String(dep.id || dep.order_id || dep.tx_id || `DEP_${dep.timestamp}`);
      const cleanId = cleanDep(dep.id || dep.order_id || dep.tx_id);
      const cleanDepOrderId = cleanDep(dep.order_id);
      const cleanDepTxId = cleanDep(dep.tx_id);

      if (depAmt <= 0) return;

      const isLevelA = isDepositFromTeam(dep, directMembers);
      const isLevelB = isDepositFromTeam(dep, indirectMembers);
      const isLevelC = isDepositFromTeam(dep, levelCMembers);

      const checkAlreadyPresent = (tier: string, targetCommAmt: number, depositorUser: any) => {
        // Direct deposit key check
        const kDep = cleanId ? `${cleanId}_${tier}` : '';
        const kDepOrder = cleanDepOrderId ? `${cleanDepOrderId}_${tier}` : '';
        const kDepTx = cleanDepTxId ? `${cleanDepTxId}_${tier}` : '';
        const kRaw = `${depId.toLowerCase()}_${tier}`;

        if (
          (kDep && registeredDepositTiers.has(kDep)) || 
          (kDepOrder && registeredDepositTiers.has(kDepOrder)) || 
          (kDepTx && registeredDepositTiers.has(kDepTx)) || 
          registeredDepositTiers.has(kRaw)
        ) return true;

        if (
          (kDep && recordKeys.has(kDep)) || 
          (kDepOrder && recordKeys.has(kDepOrder)) || 
          (kDepTx && recordKeys.has(kDepTx)) || 
          recordKeys.has(kRaw)
        ) return true;

        if (depositorUser) {
          const dUid = String(depositorUser.id || '').toLowerCase();
          const dEmail = String(depositorUser.email || '').toLowerCase();
          if (dUid && recordKeys.has(`${dUid}_${tier}`)) return true;
          if (dEmail && recordKeys.has(`${dEmail}_${tier}`)) return true;
        }

        // Exhaustive check against existing records by deposit ID or depositor user
        return records.some(r => {
          const rTier = normTier(r.tier || r.tier_info || r.notes || r.description);
          if (rTier !== tier) return false;

          const rDeps = [
            cleanDep(r.sourceDepositId),
            cleanDep(r.source_deposit_id),
            cleanDep((r as any).sourceOrderId),
            cleanDep((r as any).source_order_id),
            cleanDep(r.order_id),
            cleanDep(r.id)
          ].filter(Boolean);

          const depRefs = [
            cleanId,
            cleanDep(dep.id),
            cleanDep(dep.order_id),
            cleanDep(dep.tx_id)
          ].filter(Boolean);

          if (rDeps.some(rd => depRefs.some(dd => rd === dd || rd.includes(dd) || dd.includes(rd)))) return true;
          if (rDeps.some(rd => String(dep.notes || dep.description || '').toLowerCase().includes(rd))) return true;
          if (depRefs.some(dd => String(r.notes || r.description || '').toLowerCase().includes(dd))) return true;

          if (depositorUser) {
            const dUid = String(depositorUser.id || '').toLowerCase();
            const dEmail = String(depositorUser.email || '').toLowerCase();
            const rSrcUid = String(r.sourceUserId || r.source_user_id || '').toLowerCase();
            const rSrcEmail = String(r.sourceUserEmail || r.source_user_email || '').toLowerCase();

            if (dUid && rSrcUid && (dUid === rSrcUid || rSrcUid.includes(dUid))) return true;
            if (dEmail && rSrcEmail && (dEmail === rSrcEmail || rSrcEmail.includes(dEmail))) return true;
          }

          return false;
        });
      };

      if (isLevelA) {
        const commA = Number((depAmt * l1Rate).toFixed(2));
        const depositorUser = directMembers.find(m => isDepositFromTeam(dep, [m])) || allUsers.find(u => String(u.id).toLowerCase() === depUid || u.email?.toLowerCase() === depUemail);
        const depositorLabel = depositorUser?.username || depositorUser?.email || depUemail || depUid;

        if (!checkAlreadyPresent('level_a', commA, depositorUser)) {
          const kDep = cleanId ? `${cleanId}_level_a` : '';
          const kDepOrder = cleanDepOrderId ? `${cleanDepOrderId}_level_a` : '';
          const kDepTx = cleanDepTxId ? `${cleanDepTxId}_level_a` : '';
          const kRaw = `${depId.toLowerCase()}_level_a`;
          if (kDep) {
            recordKeys.add(kDep);
            registeredDepositTiers.add(kDep);
          }
          if (kDepOrder) {
            recordKeys.add(kDepOrder);
            registeredDepositTiers.add(kDepOrder);
          }
          if (kDepTx) {
            recordKeys.add(kDepTx);
            registeredDepositTiers.add(kDepTx);
          }
          recordKeys.add(kRaw);
          registeredDepositTiers.add(kRaw);
          if (depUid) recordKeys.add(`${depUid}_level_a`);
          if (depUemail) recordKeys.add(`${depUemail}_level_a`);

          records.push({
            id: `COMM_A_${depId}`,
            user_id: currentUser.id,
            userId: currentUser.id,
            user_email: currentUser.email,
            userEmail: currentUser.email,
            type: 'commission',
            tier: 'level_a',
            amount: commA,
            amount_inr: commA,
            currency: 'INR',
            status: 'settled',
            sourceUserId: depositorUser?.id || depUid,
            source_user_id: depositorUser?.id || depUid,
            sourceUserEmail: depositorUser?.email || depUemail,
            source_user_email: depositorUser?.email || depUemail,
            sourceDepositId: depId,
            source_deposit_id: depId,
            description: `Level 1 Commission from ${depositorLabel}`,
            notes: `Level 1 Direct Referral Commission from ${depositorLabel} (Deposit: ₹${depAmt})`,
            tier_info: `Level A (${stats.direct_referral_rate || 4.0}%)`,
            createdAt: dep.timestamp || dep.created_at || new Date().toISOString(),
            created_at: dep.timestamp || dep.created_at || new Date().toISOString(),
            timestamp: dep.timestamp || new Date().toLocaleString('en-IN')
          });
        }
      } else if (isLevelB) {
        const commB = Number((depAmt * l2Rate).toFixed(2));
        const depositorUser = indirectMembers.find(m => isDepositFromTeam(dep, [m])) || allUsers.find(u => String(u.id).toLowerCase() === depUid || u.email?.toLowerCase() === depUemail);
        const depositorLabel = depositorUser?.username || depositorUser?.email || depUemail || depUid;

        if (!checkAlreadyPresent('level_b', commB, depositorUser)) {
          const kDep = cleanId ? `${cleanId}_level_b` : '';
          const kDepOrder = cleanDepOrderId ? `${cleanDepOrderId}_level_b` : '';
          const kDepTx = cleanDepTxId ? `${cleanDepTxId}_level_b` : '';
          const kRaw = `${depId.toLowerCase()}_level_b`;
          if (kDep) {
            recordKeys.add(kDep);
            registeredDepositTiers.add(kDep);
          }
          if (kDepOrder) {
            recordKeys.add(kDepOrder);
            registeredDepositTiers.add(kDepOrder);
          }
          if (kDepTx) {
            recordKeys.add(kDepTx);
            registeredDepositTiers.add(kDepTx);
          }
          recordKeys.add(kRaw);
          registeredDepositTiers.add(kRaw);
          if (depUid) recordKeys.add(`${depUid}_level_b`);
          if (depUemail) recordKeys.add(`${depUemail}_level_b`);

          records.push({
            id: `COMM_B_${depId}`,
            user_id: currentUser.id,
            userId: currentUser.id,
            user_email: currentUser.email,
            userEmail: currentUser.email,
            type: 'commission',
            tier: 'level_b',
            amount: commB,
            amount_inr: commB,
            currency: 'INR',
            status: 'settled',
            sourceUserId: depositorUser?.id || depUid,
            source_user_id: depositorUser?.id || depUid,
            sourceUserEmail: depositorUser?.email || depUemail,
            source_user_email: depositorUser?.email || depUemail,
            sourceDepositId: depId,
            source_deposit_id: depId,
            description: `Level 2 Commission from ${depositorLabel}`,
            notes: `Level 2 Indirect Referral Commission from ${depositorLabel} (Deposit: ₹${depAmt})`,
            tier_info: `Level B (${stats.indirect_referral_rate || 2.0}%)`,
            createdAt: dep.timestamp || dep.created_at || new Date().toISOString(),
            created_at: dep.timestamp || dep.created_at || new Date().toISOString(),
            timestamp: dep.timestamp || new Date().toLocaleString('en-IN')
          });
        }
      } else if (isLevelC) {
        const commC = Number((depAmt * l3Rate).toFixed(2));
        const depositorUser = levelCMembers.find(m => isDepositFromTeam(dep, [m])) || allUsers.find(u => String(u.id).toLowerCase() === depUid || u.email?.toLowerCase() === depUemail);
        const depositorLabel = depositorUser?.username || depositorUser?.email || depUemail || depUid;

        if (!checkAlreadyPresent('level_c', commC, depositorUser)) {
          const kDep = cleanId ? `${cleanId}_level_c` : '';
          const kDepOrder = cleanDepOrderId ? `${cleanDepOrderId}_level_c` : '';
          const kDepTx = cleanDepTxId ? `${cleanDepTxId}_level_c` : '';
          const kRaw = `${depId.toLowerCase()}_level_c`;
          if (kDep) {
            recordKeys.add(kDep);
            registeredDepositTiers.add(kDep);
          }
          if (kDepOrder) {
            recordKeys.add(kDepOrder);
            registeredDepositTiers.add(kDepOrder);
          }
          if (kDepTx) {
            recordKeys.add(kDepTx);
            registeredDepositTiers.add(kDepTx);
          }
          recordKeys.add(kRaw);
          registeredDepositTiers.add(kRaw);
          if (depUid) recordKeys.add(`${depUid}_level_c`);
          if (depUemail) recordKeys.add(`${depUemail}_level_c`);

          records.push({
            id: `COMM_C_${depId}`,
            user_id: currentUser.id,
            userId: currentUser.id,
            user_email: currentUser.email,
            userEmail: currentUser.email,
            type: 'commission',
            tier: 'level_c',
            amount: commC,
            amount_inr: commC,
            currency: 'INR',
            status: 'settled',
            sourceUserId: depositorUser?.id || depUid,
            source_user_id: depositorUser?.id || depUid,
            sourceUserEmail: depositorUser?.email || depUemail,
            source_user_email: depositorUser?.email || depUemail,
            sourceDepositId: depId,
            source_deposit_id: depId,
            description: `Level 3 Commission from ${depositorLabel}`,
            notes: `Level 3 Indirect Referral Commission from ${depositorLabel} (Deposit: ₹${depAmt})`,
            tier_info: `Level C (${stats.level_3_referral_rate || 1.0}%)`,
            createdAt: dep.timestamp || dep.created_at || new Date().toISOString(),
            created_at: dep.timestamp || dep.created_at || new Date().toISOString(),
            timestamp: dep.timestamp || new Date().toLocaleString('en-IN')
          });
        }
      }
    });

    // Final safety deduplication by canonical id
    const finalSeen = new Set<string>();
    const deduplicatedRecords: Transaction[] = [];
    for (const r of records) {
      const key = String(r.id || r.order_id || `${r.amount}_${r.createdAt}`).toLowerCase();
      if (finalSeen.has(key)) continue;
      finalSeen.add(key);
      deduplicatedRecords.push(r);
    }

    return deduplicatedRecords.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
  }, [userCommissionTxs, settledDeposits, directMembers, indirectMembers, levelCMembers, currentUser, allUsers, stats]);

  // Pure memoized calculation derived directly from the centralized calculation function
  const affiliateStats = useMemo(() => {
    const details = calculateAffiliateCommissionDetails(allUsers, transactions, currentUser.id, currentUser);

    const teamDepositsSum = settledDeposits
      .filter(d => isDepositFromTeam(d, directMembers) || isDepositFromTeam(d, indirectMembers) || isDepositFromTeam(d, levelCMembers))
      .reduce((sum, d) => sum + Number(d.amount || d.amount_inr || 0), 0);

    const teamBalancesSum = [...directMembers, ...indirectMembers, ...levelCMembers]
      .reduce((sum, u) => sum + Number(u.deposit_balance || u.total_deposit || u.total_inflow || 0), 0);

    return {
      levelA: details.levelA,
      levelB: details.levelB,
      levelC: details.levelC,
      total: details.total,
      teamDeposit: Math.max(teamDepositsSum, teamBalancesSum)
    };
  }, [allUsers, transactions, currentUser, settledDeposits, directMembers, indirectMembers, levelCMembers]);

  const levelACommissions = Math.max(Number(teamData?.level_a_earning_inr || 0), affiliateStats.levelA);
  const levelBCommissions = Math.max(Number(teamData?.level_b_earning_inr || 0), affiliateStats.levelB);
  const levelCCommissions = Math.max(Number(teamData?.level_c_earning_inr || 0), affiliateStats.levelC || 0);
  const totalTeamCommissions = Math.max(Number(teamData?.total_ref_earning_inr || 0), affiliateStats.total);
  
  const totalTeamDeposit = Math.max(
    Number(teamData?.total_team_deposit_inr ?? teamData?.team_deposit_inr ?? teamData?.team_deposit ?? 0),
    affiliateStats.teamDeposit
  );

  const levelADeposit = Math.max(
    Number(teamData?.level1_deposit_inr || 0),
    directMembers.reduce((sum, u) => sum + Number(u.deposit_balance || u.total_deposit || 0), 0)
  );

  const levelBDeposit = Math.max(
    Number(teamData?.level2_deposit_inr || 0),
    indirectMembers.reduce((sum, u) => sum + Number(u.deposit_balance || u.total_deposit || 0), 0)
  );

  const levelCDeposit = Math.max(
    Number(teamData?.level3_deposit_inr || 0),
    levelCMembers.reduce((sum, u) => sum + Number(u.deposit_balance || u.total_deposit || 0), 0)
  );

  // Filtered Commission Records for Table
  const filteredCommissions = useMemo(() => {
    return computedCommissionRecords.filter(tx => {
      const generatingUser = getGeneratingMember(tx);
      const rawTier = String(tx.tier || tx.tier_info || tx.notes || tx.description || '').toLowerCase();
      let explicitTier = '';
      if (rawTier.includes('level_a') || rawTier.includes('level a') || rawTier.includes('level 1') || rawTier.includes('direct') || tx.type === 'REFERRAL_L1') {
        explicitTier = 'level_a';
      } else if (rawTier.includes('level_b') || rawTier.includes('level b') || rawTier.includes('level 2') || rawTier.includes('indirect') || tx.type === 'REFERRAL_L2') {
        explicitTier = 'level_b';
      } else if (rawTier.includes('level_c') || rawTier.includes('level c') || rawTier.includes('level 3') || tx.type === 'REFERRAL_L3') {
        explicitTier = 'level_c';
      }

      const isLevelA = explicitTier ? explicitTier === 'level_a' : Boolean(generatingUser && levelAUserIds.has(String(generatingUser.id).toLowerCase()));
      const isLevelB = explicitTier ? explicitTier === 'level_b' : Boolean(generatingUser && levelBUserIds.has(String(generatingUser.id).toLowerCase()));
      const isLevelC = explicitTier ? explicitTier === 'level_c' : Boolean(generatingUser && levelCUserIds.has(String(generatingUser.id).toLowerCase()));

      // 1. Tier Filter
      if (selectedTierFilter === 'Level A' && !isLevelA) return false;
      if (selectedTierFilter === 'Level B' && !isLevelB) return false;
      if (selectedTierFilter === 'Level C' && !isLevelC) return false;

      // 2. Specific Member Filter
      if (selectedMemberId) {
        if (!generatingUser || generatingUser.id !== selectedMemberId) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const memberName = generatingUser?.username?.toLowerCase() || '';
        const memberEmail = generatingUser?.email?.toLowerCase() || '';
        const memberCode = generatingUser?.referral_code?.toLowerCase() || '';
        const notes = (tx.notes || '').toLowerCase();
        const txId = tx.id.toLowerCase();

        return (
          memberName.includes(query) ||
          memberEmail.includes(query) ||
          memberCode.includes(query) ||
          notes.includes(query) ||
          txId.includes(query)
        );
      }

      return true;
    });
  }, [computedCommissionRecords, selectedTierFilter, selectedMemberId, searchQuery, levelAUserIds, levelBUserIds, allUsers]);

  const selectedMemberObj = selectedMemberId ? allUsers.find(u => u.id === selectedMemberId) : null;

  const copyCode = () => {
    triggerConfirmSound();
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast(`Referral code ${referralCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    triggerConfirmSound();
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(
      `Join juspay to earn dynamic 4% cashback on orders and multi-tier affiliate rewards! Use my code: ${referralCode} at ${referralLink}`
    );
    let url = '';
    if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`;
    if (platform === 'whatsapp') url = `https://api.whatsapp.com/send?text=${text}`;
    if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;

    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-3.5 pb-24 animate-in fade-in duration-150">
      
      {/* 1. Overview Banner (Executive Navy Theme) */}
      <div className="fintech-card-navy p-5 space-y-4 relative overflow-hidden">
        {/* Ambient grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Total Referral Commissions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer border border-slate-700/60"
                title="Refresh live team metrics"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-700/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>3-Tier Active ({stats.direct_referral_rate || 4}% / {stats.indirect_referral_rate || 2}% / {stats.level_3_referral_rate || 1}%)</span>
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-400">₹</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono tabular-nums">
              {totalTeamCommissions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>

          {/* 5 Stat Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3.5 mt-3.5 border-t border-slate-700/60 text-center">
            <div>
              <span className="text-[10px] block text-slate-400 font-medium">Level 1 ({stats.direct_referral_rate || 4}%)</span>
              <strong className="text-xs font-bold font-mono text-emerald-400">
                ₹{levelACommissions.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </strong>
            </div>
            <div>
              <span className="text-[10px] block text-slate-400 font-medium">Level 2 ({stats.indirect_referral_rate || 2}%)</span>
              <strong className="text-xs font-bold font-mono text-purple-300">
                ₹{levelBCommissions.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </strong>
            </div>
            <div>
              <span className="text-[10px] block text-slate-400 font-medium">Level 3 ({stats.level_3_referral_rate || 1}%)</span>
              <strong className="text-xs font-bold font-mono text-blue-300">
                ₹{levelCCommissions.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </strong>
            </div>
            <div>
              <span className="text-[10px] block text-slate-400 font-medium">Network Size</span>
              <strong className="text-xs font-bold font-mono text-white">
                {totalActiveNetworkSize} Members
              </strong>
            </div>
            <div>
              <span className="text-[10px] block text-slate-400 font-medium">Total Team Deposit</span>
              <strong className="text-xs font-bold font-mono text-emerald-400 truncate block">
                ₹{totalTeamDeposit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Invitation Card: Referral Code & Link */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Your Referral Invitation</h3>
          </div>
          <button
            onClick={() => {
              if (showQR) triggerCancelSound();
              else triggerSwitchSound();
              setShowQR(!showQR);
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showQR ? 'Hide QR' : 'View QR'}</span>
          </button>
        </div>

        {showQR && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center animate-in zoom-in-95 duration-150">
            <QRCodeDisplay value={referralLink} size={150} />
            <p className="text-[11px] text-slate-600 mt-2 font-medium">Scan to join under Sponsor: <strong className="font-mono text-slate-900">{referralCode}</strong></p>
          </div>
        )}

        {/* Code & Link Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          
          <div className="p-3 fintech-inset flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Referral Code</span>
              <span className="text-base font-extrabold font-mono text-emerald-700 tracking-wider">
                {referralCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="p-2 bg-white rounded-lg shadow-xs border border-slate-200 hover:bg-slate-50 text-slate-800 active:scale-90 transition-all cursor-pointer"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3 fintech-inset flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Invite Link</span>
              <span className="text-xs font-mono text-slate-700 truncate block font-medium">
                {referralLink}
              </span>
            </div>
            <button
              onClick={copyLink}
              className="fintech-btn-emerald p-2 rounded-lg text-white shadow-xs active:scale-90 transition-all flex-shrink-0 cursor-pointer"
              title="Copy Link"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Quick Social Sharing Buttons */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
            Share To Social Channels
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleShare('telegram')}
              className="py-2 px-1 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-[#229ED9]/30 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <span>Telegram</span>
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="py-2 px-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-[#25D366]/30 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="py-2 px-1 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-[#1877F2]/30 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <span>Facebook</span>
            </button>
            <button
              onClick={copyLink}
              className="py-2 px-1 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-slate-200 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <span>Copy Link</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. 3-Tier Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1 flex items-center justify-between">
          <span>Multi-Tier Network Structure</span>
          <span className="text-[10px] font-normal text-slate-500">Auto Distributed</span>
        </h3>

        {/* Level A Card */}
        <div className="fintech-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-xs flex items-center justify-center border border-emerald-200">
                A
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Level 1 (Direct Referrals)</h4>
                <p className="text-[10px] text-slate-500">Rate: {stats.direct_referral_rate || 4.0}% on deposits & order claims</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-extrabold font-mono text-emerald-700 block">
                ₹{levelACommissions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">{directMembers.length} Members</span>
              <span className="text-[10px] text-emerald-700 font-bold block">Inflow: ₹{levelADeposit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Direct Members List Preview with Quick Filter Action */}
          {directMembers.length > 0 ? (
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Direct Team (Click to filter commission history)
              </span>
              {directMembers.map((m, idx) => (
                <div 
                  key={`${m.id || m.email || 'dm'}-${idx}`} 
                  onClick={() => {
                    setSelectedMemberId(selectedMemberId === m.id ? null : m.id);
                    showToast(selectedMemberId === m.id ? 'Filter cleared' : `Filtered commissions by ${m.username}`);
                  }}
                  className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedMemberId === m.id 
                      ? 'bg-emerald-100/70 border-emerald-300 ring-1 ring-emerald-400' 
                      : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {m.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">{m.username}</span>
                      <span className="text-[9px] font-mono text-slate-400">Code: {m.referral_code}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="font-mono text-slate-700 text-xs font-bold block">₹{m.deposit_balance.toLocaleString()}</span>
                      <span className="text-[9px] text-emerald-700 font-semibold">Deposit</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedMemberId === m.id ? 'rotate-90 text-emerald-600' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No direct referrals yet. Share your code to earn {stats.direct_referral_rate || 4.0}% commissions.</p>
          )}
        </div>

        {/* Level B Card */}
        <div className="fintech-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 font-extrabold text-xs flex items-center justify-center border border-purple-200">
                B
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Level 2 (Indirect Referrals)</h4>
                <p className="text-[10px] text-slate-500">Rate: {stats.indirect_referral_rate || 2.0}% on indirect team turnover</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-extrabold font-mono text-purple-800 block">
                ₹{levelBCommissions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">{indirectMembers.length} Members</span>
              <span className="text-[10px] text-purple-700 font-bold block">Inflow: ₹{levelBDeposit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Indirect Members Preview with Quick Filter */}
          {indirectMembers.length > 0 ? (
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Indirect Team (Click to filter commission history)
              </span>
              {indirectMembers.map((m, idx) => (
                <div 
                  key={`${m.id || m.email || 'im'}-${idx}`} 
                  onClick={() => {
                    setSelectedMemberId(selectedMemberId === m.id ? null : m.id);
                    showToast(selectedMemberId === m.id ? 'Filter cleared' : `Filtered commissions by ${m.username}`);
                  }}
                  className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedMemberId === m.id 
                      ? 'bg-purple-100/70 border-purple-300 ring-1 ring-purple-400' 
                      : 'bg-slate-50 hover:bg-purple-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {m.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">{m.username}</span>
                      <span className="text-[9px] font-mono text-slate-400">Code: {m.referral_code}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="font-mono text-slate-700 text-xs font-bold block">₹{m.deposit_balance.toLocaleString()}</span>
                      <span className="text-[9px] text-purple-700 font-semibold">Deposit</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedMemberId === m.id ? 'rotate-90 text-purple-600' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No indirect referrals yet. They appear when Level A members invite friends.</p>
          )}
        </div>

        {/* Level C Card */}
        <div className="fintech-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 font-extrabold text-xs flex items-center justify-center border border-blue-200">
                C
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Level 3 (3rd Tier Referrals)</h4>
                <p className="text-[10px] text-slate-500">Rate: {stats.level_3_referral_rate || 1.0}% on 3rd tier team turnover</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-extrabold font-mono text-blue-800 block">
                ₹{levelCCommissions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">{levelCMembers.length} Members</span>
              <span className="text-[10px] text-blue-700 font-bold block">Inflow: ₹{levelCDeposit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Level C Members Preview with Quick Filter */}
          {levelCMembers.length > 0 ? (
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Level 3 Team (Click to filter commission history)
              </span>
              {levelCMembers.map((m, idx) => (
                <div 
                  key={`${m.id || m.email || 'cm'}-${idx}`} 
                  onClick={() => {
                    setSelectedMemberId(selectedMemberId === m.id ? null : m.id);
                    showToast(selectedMemberId === m.id ? 'Filter cleared' : `Filtered commissions by ${m.username}`);
                  }}
                  className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedMemberId === m.id 
                      ? 'bg-blue-100/70 border-blue-300 ring-1 ring-blue-400' 
                      : 'bg-slate-50 hover:bg-blue-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {m.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">{m.username}</span>
                      <span className="text-[9px] font-mono text-slate-400">Code: {m.referral_code}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="font-mono text-slate-700 text-xs font-bold block">₹{m.deposit_balance.toLocaleString()}</span>
                      <span className="text-[9px] text-blue-700 font-semibold">Deposit</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedMemberId === m.id ? 'rotate-90 text-blue-600' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No level 3 referrals yet. They appear when Level B members invite friends.</p>
          )}
        </div>

      </div>

      {/* 4. Detailed Commission Transaction History Table & Ledger */}
      <div id="referral-commission-history" className="fintech-card p-4 space-y-4">
        
        {/* Header with Title and Real-time Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Individual Commission History</h3>
              <p className="text-[10px] text-slate-500">Track exact rewards generated by each team member</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Live Settlement
          </span>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-2.5">
          
          {/* Tier Tabs (All / Level A / Level B / Level C) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(['All', 'Level A', 'Level B', 'Level C'] as const).map(tier => {
              const count = tier === 'All' 
                ? computedCommissionRecords.length
                : tier === 'Level A'
                  ? computedCommissionRecords.filter(t => t.tier === 'level_a' || t.tier_info?.includes('Level A') || t.tier_info?.includes('Level 1') || t.notes?.includes('Level A') || t.notes?.includes('Level 1') || t.notes?.includes('5%') || t.notes?.includes('4%')).length
                  : tier === 'Level B'
                    ? computedCommissionRecords.filter(t => t.tier === 'level_b' || t.tier_info?.includes('Level B') || t.tier_info?.includes('Level 2') || t.notes?.includes('Level B') || t.notes?.includes('Level 2') || t.notes?.includes('2.5%') || t.notes?.includes('2%')).length
                    : computedCommissionRecords.filter(t => t.tier === 'level_c' || t.tier_info?.includes('Level C') || t.tier_info?.includes('Level 3') || t.notes?.includes('Level C') || t.notes?.includes('Level 3') || t.notes?.includes('1%')).length;

              return (
                <button
                  key={tier}
                  onClick={() => {
                    triggerSwitchSound();
                    setSelectedTierFilter(tier);
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    selectedTierFilter === tier
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>
                    {tier === 'All' 
                      ? 'All Rewards' 
                      : tier === 'Level A' 
                        ? `Level 1 (${stats.direct_referral_rate || 4}%)` 
                        : tier === 'Level B' 
                          ? `Level 2 (${stats.indirect_referral_rate || 2}%)` 
                          : `Level 3 (${stats.level_3_referral_rate || 1}%)`}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTierFilter === tier ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search member name, referral code, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  triggerCancelSound();
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Member Filter Chip */}
          {selectedMemberObj && (
            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                <span>Showing rewards generated exclusively by: <strong>{selectedMemberObj.username}</strong> ({selectedMemberObj.referral_code})</span>
              </div>
              <button 
                onClick={() => {
                  triggerCancelSound();
                  setSelectedMemberId(null);
                }}
                className="p-1 hover:bg-emerald-100 rounded-md text-emerald-800 transition-colors cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Detailed Commission Items / Table */}
        <div className="space-y-2.5 pt-1">
          {filteredCommissions.length === 0 ? (
            <div className="py-8 text-center space-y-2 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <Users className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No referral commission records found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {searchQuery || selectedMemberId || selectedTierFilter !== 'All' 
                  ? 'Try changing your filter or search query.' 
                  : 'Commissions will automatically appear here whenever your direct or indirect team members deposit or trade.'}
              </p>
              {(searchQuery || selectedMemberId || selectedTierFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMemberId(null);
                    setSelectedTierFilter('All');
                  }}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            filteredCommissions.map((tx, idx) => {
              const member = getGeneratingMember(tx);
              const isDirect = tx.tier === 'level_a' || tx.tier_info?.includes('Level A') || tx.notes?.includes('Level A') || tx.notes?.includes('5%') || tx.notes?.includes('4%') || (member && directMembers.some(d => d.id === member.id));
              const isLevelC = tx.tier === 'level_c' || tx.tier_info?.includes('Level C') || tx.tier_info?.includes('Level 3') || tx.notes?.includes('Level C') || tx.notes?.includes('Level 3') || tx.notes?.includes('1%') || String(tx.type).toLowerCase() === 'referral_l3' || (member && levelCMembers.some(m => m.id === member.id));

              const badgeLabel = isDirect 
                ? `Level A (${stats.direct_referral_rate || 4}% Direct)`
                : isLevelC
                  ? `Level C (${stats.level_3_referral_rate || 1}% 3rd Tier)`
                  : `Level B (${stats.indirect_referral_rate || 2}% Indirect)`;

              const avatarStyle = isDirect
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : isLevelC
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-purple-100 text-purple-800 border-purple-200';

              const badgeStyle = isDirect
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isLevelC
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-purple-50 text-purple-800 border-purple-200';

              return (
                <div 
                  key={`${tx.id || tx.order_id || 'comm'}-${idx}`} 
                  className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 shadow-2xs space-y-2 transition-colors"
                >
                  {/* Top Line: Generating Member Identity + Tier Badge + Commission Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Member Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs border ${avatarStyle}`}>
                        {member?.username ? member.username.slice(0, 1).toUpperCase() : '👤'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {member?.username || 'Team Member'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide border ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {member?.email || (member?.referral_code ? `Ref: ${member.referral_code}` : 'Affiliate Partner')}
                        </span>
                      </div>
                    </div>

                    {/* Commission Credited */}
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black font-mono text-emerald-700 block">
                        +₹{tx.amount.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block">
                        Settled
                      </span>
                    </div>
                  </div>

                  {/* Bottom Line: Source Event & Timestamp */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 gap-2">
                    <span className="truncate text-slate-600 font-medium">
                      {tx.notes || `${isDirect ? '5% Direct' : '2.5% Indirect'} commission reward`}
                    </span>
                    <span className="shrink-0 font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatISTTimestamp(tx.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Aggregate Summary Footer */}
        {filteredCommissions.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Showing {filteredCommissions.length} commission {filteredCommissions.length === 1 ? 'entry' : 'entries'}</span>
            <div className="flex items-center gap-1">
              <span>Total Reward:</span>
              <strong className="font-mono text-emerald-700 font-bold">
                ₹{filteredCommissions.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)} INR
              </strong>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

