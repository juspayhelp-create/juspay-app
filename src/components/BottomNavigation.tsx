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

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'payment', label: 'Cashback', icon: CreditCard },
    { id: 'tool', label: 'Tools', icon: Wallet, isCenter: true },
    { id: 'statistics', label: 'Stats', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pt-1 pointer-events-none"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-md mx-auto pointer-events-auto">
        <div className="glass-panel rounded-2xl px-2 py-1.5 flex items-center justify-around border border-slate-200/90 shadow-lg shadow-slate-900/5 backdrop-blur-md">
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            if (item.isCenter) {
              return (
                <div key={item.id} className="relative -top-4.5 flex flex-col items-center">
                  <motion.button
                    id={`nav-${item.id}`}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.90 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    onClick={() => handleNav(item.id)}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center border-2 border-white shadow-md shadow-slate-900/20 hover:shadow-lg cursor-pointer select-none ring-2 ring-emerald-500/20 group"
                    aria-label="Tool and Wallet Management"
                  >
                    <Icon className="w-5 h-5 text-emerald-400 stroke-[2.2] group-hover:rotate-12 transition-transform" />
                  </motion.button>
                  <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 tracking-tight">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <motion.button
                key={item.id}
                id={`nav-${item.id}`}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => handleNav(item.id)}
                className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-emerald-800 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <div className="relative p-1 z-10 flex items-center justify-center">
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-emerald-100/90 rounded-xl shadow-2xs border border-emerald-300/60 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 stroke-[2.2] transition-transform ${isActive ? 'scale-110 text-emerald-700' : ''}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
                  {item.label}
                </span>
              </motion.button>
            );
          })}

        </div>
      </div>
    </nav>
  );
};
