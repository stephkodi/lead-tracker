'use strict';
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Users, History, Settings2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

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

  const handleSelectTab = (tabId: NavTab) => {
    if (tabId !== currentTab) {
      triggerHaptic('selection');
    }
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe px-4 pb-4">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="backdrop-blur-2xl bg-white/85 dark:bg-[#161618]/90 border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.85)] rounded-3xl p-1.5 flex items-center justify-around relative overflow-hidden transition-colors duration-250">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`relative flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-2xl transition-colors duration-200 outline-none select-none active:scale-95 ${
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {/* Active fluid pill indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activePillIndicator"
                    className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10 border border-black/5 dark:border-white/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                  {/* Badge */}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[15px] h-[15px] flex items-center justify-center shadow-xs">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 font-medium tracking-tight transition-all duration-150 ${
                    isActive
                      ? 'font-semibold text-black dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400'
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
