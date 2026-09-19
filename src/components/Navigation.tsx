'use strict';
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Users, History, Settings2 } from 'lucide-react';

export type NavTab = 'capture' | 'vendors' | 'history' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  leadsCount?: number;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  leadsCount = 0,
}) => {
  const tabs: TabItem[] = [
    { id: 'capture', label: 'New Lead', icon: PlusCircle },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'history', label: 'History', icon: History, badge: leadsCount },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe px-4 pb-4">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="backdrop-blur-3xl bg-white/75 dark:bg-[#101420]/80 border border-white/70 dark:border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl p-1.5 flex items-center justify-around relative overflow-hidden">
          {/* Subtle top specular sheen */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-2xl transition-colors duration-200 outline-none select-none active:scale-95 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {/* Active fluid pill indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activePillIndicator"
                    className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/15 rounded-2xl -z-10 shadow-xs border border-blue-500/25 dark:border-blue-400/25"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'
                    }`}
                  />
                  {/* Badge */}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-blue-600 dark:bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[15px] h-[15px] flex items-center justify-center shadow-xs">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 font-medium tracking-tight transition-all duration-150 ${
                    isActive
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
