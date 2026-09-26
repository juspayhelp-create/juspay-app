import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { GlobalChatbot } from './components/GlobalChatbot';
import { NotificationModal } from './components/NotificationModal';
import { EmailAuthModal } from './components/EmailAuthModal';
import { ForgotPinModal } from './components/ForgotPinModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { KycGateModal } from './components/KycGateModal';
import { ScreenBoundary } from './components/ScreenBoundary';
import { SecurityTrustFooter } from './components/SecurityTrustFooter';
import { InAppNotificationBanner } from './components/InAppNotificationBanner';
import { CheerPopup } from './components/CheerPopup';

// Screens
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { ToolWalletScreen } from './screens/ToolWalletScreen';
import { TaskRewardsScreen } from './screens/TaskRewardsScreen';
import { TeamReferralScreen } from './screens/TeamReferralScreen';
import { CustomerServiceScreen } from './screens/CustomerServiceScreen';
import { DepositScreen } from './screens/DepositScreen';
import { WithdrawalScreen } from './screens/WithdrawalScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminPanel } from './screens/AdminPanel';
import { DownloadScreen } from './screens/DownloadScreen';

const MainAppContent: React.FC = () => {
  const { 
    activeScreen, 
    setActiveScreen,
    switchUser,
    currentUser, 
    isAuthenticated,
    setIsAuthenticated,
    isSessionLoading,
    toastMessage, 
    showToast,
    isAuthModalOpen, 
    setIsAuthModalOpen,
    isKycGateModalOpen,
    setIsKycGateModalOpen,
    openKycModal,
    isForgotPinModalOpen,
    setIsForgotPinModalOpen,
    forgotPinEmail,
    isAdminPasswordModalOpen,
    setIsAdminPasswordModalOpen,
    openAdminPasswordModal,
    cheerPopupData,
    closeCheerPopup
  } = useApp();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const logoClicksRef = useRef<number[]>([]);

  // Secret trigger: Logo click 6 times within 1 second or URL ending with /admin
  const handleSecretAdminTrigger = () => {
    // ALWAYS clear existing admin session token so password prompt is strictly required
    localStorage.removeItem('juspay_admin_token');
    openAdminPasswordModal(() => {
      switchUser('admin');
      setIsAuthenticated(true);
      setActiveScreen('admin');
      showToast('Administrative panel unlocked successfully.');
    });
  };

  // Listen to global logo click event (6 clicks in 1 sec) and URL hash/query on load
  useEffect(() => {
    // 1. Clear old cached transaction items / local storage caches so old timestamps do not persist
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('transaction') || key.includes('tx_') || key.includes('payout') || key.includes('history') || key.includes('ledger'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }

    const checkUrlRoutes = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      
      if (pathname.endsWith('/admin') || pathname.endsWith('/admin/') || hash.endsWith('/admin') || hash.endsWith('/admin/') || hash.includes('admin') || search.includes('admin')) {
        handleSecretAdminTrigger();
        return;
      }

      if (pathname.endsWith('/download') || pathname.endsWith('/download/') || pathname.includes('/download') || hash.includes('download') || search.includes('download')) {
        setActiveScreen('download');
      }
    };
    checkUrlRoutes();

    window.addEventListener('popstate', checkUrlRoutes);
    window.addEventListener('hashchange', checkUrlRoutes);

    const handleGlobalLogoClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // STRICT RULE: Only trigger on actual logo clicks (.juspay-logo-trigger)
      if (target && target.closest('.juspay-logo-trigger')) {
        const now = Date.now();
        // Keep only clicks within the last 1000ms (1 second window)
        logoClicksRef.current = logoClicksRef.current.filter(t => now - t <= 1000);
        logoClicksRef.current.push(now);

        // Require strictly 6 clicks within 1 second
        if (logoClicksRef.current.length >= 6) {
          logoClicksRef.current = [];
          handleSecretAdminTrigger();
        }
      }
    };

    window.addEventListener('click', handleGlobalLogoClick);
    return () => {
      window.removeEventListener('popstate', checkUrlRoutes);
      window.removeEventListener('hashchange', checkUrlRoutes);
      window.removeEventListener('click', handleGlobalLogoClick);
    };
  }, [switchUser, setIsAuthenticated, setActiveScreen, openAdminPasswordModal, showToast]);

  // If session is verifying with server, display secure loader to prevent flash of stale data
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-5">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 animate-pulse">
              <div className="w-full h-full bg-[#0F172A] rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-black text-emerald-400 tracking-tighter">J</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Verifying Secure Session...
          </p>
        </div>
      </div>
    );
  }

  // If activeScreen is admin, render AdminPanel
  if (activeScreen === 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <AdminPanel />
        <AdminPasswordModal
          isOpen={isAdminPasswordModalOpen}
          onClose={() => setIsAdminPasswordModalOpen(false)}
          onSuccess={() => {
            switchUser('admin');
            setIsAuthenticated(true);
            setActiveScreen('admin');
          }}
        />
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-150">
            <div className="bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold backdrop-blur-md flex items-center gap-2 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If the user is NOT authenticated, show AuthScreen (or DownloadScreen if route/state is 'download')
  if (!isAuthenticated || currentUser.id === 'guest') {
    return (
      <div className="min-h-screen bg-[#EDF2F7] text-slate-800 font-sans antialiased flex flex-col justify-start items-center selection:bg-emerald-500/20 selection:text-emerald-800">
        <div className="w-full max-w-md min-h-screen bg-[#FAFBFD] shadow-[0_10px_35px_rgba(15,23,42,0.06)] relative flex flex-col border-x border-slate-200/80">
          <main className="flex-1 overflow-x-hidden p-3.5">
            {activeScreen === 'download' || activeScreen === 'about' || activeScreen === 'guidelines' || activeScreen === 'terms' ? (
              <DownloadScreen 
                initialTab={activeScreen === 'guidelines' || activeScreen === 'terms' ? 'guidelines' : activeScreen === 'about' ? 'about' : 'download'} 
                onBack={() => setActiveScreen('home')} 
              />
            ) : (
              <AuthScreen />
            )}
          </main>
          <GlobalChatbot />
          <EmailAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
          <ForgotPinModal isOpen={isForgotPinModalOpen} onClose={() => setIsForgotPinModalOpen(false)} initialEmail={forgotPinEmail || currentUser?.email} />
          <AdminPasswordModal
            isOpen={isAdminPasswordModalOpen}
            onClose={() => setIsAdminPasswordModalOpen(false)}
            onSuccess={() => {
              switchUser('admin');
              setIsAuthenticated(true);
              setActiveScreen('admin');
            }}
          />
          <CheerPopup data={cheerPopupData} onClose={closeCheerPopup} />
          {toastMessage && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold backdrop-blur-md flex items-center gap-2 border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen onOpenNotifications={() => setIsNotificationOpen(true)} />;
      case 'download':
        return <DownloadScreen initialTab="download" onBack={() => setActiveScreen('home')} />;
      case 'about':
        return <DownloadScreen initialTab="about" onBack={() => setActiveScreen('home')} />;
      case 'guidelines':
      case 'terms':
        return <DownloadScreen initialTab="guidelines" onBack={() => setActiveScreen('home')} />;
      case 'payment':
        return <PaymentScreen />;
      case 'tool':
        return <ToolWalletScreen />;
      case 'statistics':
        return <StatisticsScreen />;
      case 'profile':
        return <ProfileScreen onOpenNotifications={() => setIsNotificationOpen(true)} />;
      case 'deposit':
        return <DepositScreen />;
      case 'withdraw':
        return <WithdrawalScreen />;
      case 'task':
        return <TaskRewardsScreen />;
      case 'team':
        return <TeamReferralScreen />;
      case 'service':
        return <CustomerServiceScreen />;
      default:
        return <HomeScreen onOpenNotifications={() => setIsNotificationOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF2F7] text-slate-800 font-sans antialiased flex flex-col justify-start items-center selection:bg-emerald-500/20 selection:text-emerald-800">
      <div className="w-full max-w-md min-h-screen bg-[#FAFBFD] shadow-[0_10px_35px_rgba(15,23,42,0.06)] relative flex flex-col border-x border-slate-200/80">
        <Header onOpenNotifications={() => setIsNotificationOpen(true)} />
        <main className="flex-1 p-3.5 overflow-x-hidden">
          <ScreenBoundary fallbackTitle="Screen Display Variance">
            {renderScreen()}
          </ScreenBoundary>
          {activeScreen !== 'download' && activeScreen !== 'tools' && <SecurityTrustFooter />}
        </main>
        <BottomNavigation />
        <GlobalChatbot />
        <InAppNotificationBanner onOpenNotifications={() => setIsNotificationOpen(true)} />
        <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
        <EmailAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <KycGateModal 
          isOpen={isKycGateModalOpen} 
          onClose={() => setIsKycGateModalOpen(false)} 
          kycStatus={currentUser?.kyc_status || 'NOT_SUBMITTED'} 
          onOpenKycForm={openKycModal} 
        />
        <ForgotPinModal isOpen={isForgotPinModalOpen} onClose={() => setIsForgotPinModalOpen(false)} initialEmail={forgotPinEmail || currentUser?.email} />
        <AdminPasswordModal
          isOpen={isAdminPasswordModalOpen}
          onClose={() => setIsAdminPasswordModalOpen(false)}
          onSuccess={() => {
            switchUser('admin');
            setIsAuthenticated(true);
            setActiveScreen('admin');
          }}
        />
        <CheerPopup data={cheerPopupData} onClose={closeCheerPopup} />
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-150">
            <div className="bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold backdrop-blur-md flex items-center gap-2 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
