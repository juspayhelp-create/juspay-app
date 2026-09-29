import React from 'react';
import { motion } from 'motion/react';
import { Home, CreditCard, Wallet, BarChart3, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerSwitchSound } from '../utils/haptics';

export const BottomNavigation: React.FC = () => {
  const { activeScreen, setActiveScreen } = useApp();

  const handleNav = (screen: any) => {
    triggerSwitchSound();
    setActiveScreen(screen);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="fintech-nav-bar px-2 py-1.5 flex items-center justify-around border border-slate-300 shadow-md">
          
          {/* 1. Home */}
          <motion.button
            id="nav-home"
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => handleNav('home')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer select-none ${
              activeScreen === 'home'
                ? 'text-emerald-800 font-extrabold'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeScreen === 'home' ? 'bg-emerald-100 text-emerald-800 shadow-2xs' : ''}`}>
              <Home className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </motion.button>

          {/* 2. Payment / Cashback */}
          <motion.button
            id="nav-payment"
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => handleNav('payment')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer select-none ${
              activeScreen === 'payment'
                ? 'text-emerald-800 font-extrabold'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeScreen === 'payment' ? 'bg-emerald-100 text-emerald-800 shadow-2xs' : ''}`}>
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Cashback</span>
          </motion.button>

          {/* 3. Center Tool / Wallet */}
          <div className="relative -top-4 flex flex-col items-center">
            <motion.button
              id="nav-center-wallet"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              onClick={() => handleNav('tool')}
              className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-slate-800 cursor-pointer select-none ring-2 ring-emerald-500/20"
              aria-label="Tool and Wallet Management"
            >
              <Wallet className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
            </motion.button>
            <span className="text-[10px] font-extrabold text-slate-900 mt-0.5 tracking-tight">Tools</span>
          </div>

          {/* 4. Statistics */}
          <motion.button
            id="nav-statistics"
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => handleNav('statistics')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer select-none ${
              activeScreen === 'statistics'
                ? 'text-emerald-800 font-extrabold'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeScreen === 'statistics' ? 'bg-emerald-100 text-emerald-800 shadow-2xs' : ''}`}>
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Stats</span>
          </motion.button>

          {/* 5. My Profile */}
          <motion.button
            id="nav-profile"
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => handleNav('profile')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer select-none ${
              activeScreen === 'profile'
                ? 'text-emerald-800 font-extrabold'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeScreen === 'profile' ? 'bg-emerald-100 text-emerald-800 shadow-2xs' : ''}`}>
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Profile</span>
          </motion.button>

        </div>
      </div>
    </nav>
  );
};
