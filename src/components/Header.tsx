'use strict';
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { AppSettings } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';

interface HeaderProps {
  settings: AppSettings;
  leadsCount: number;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, leadsCount, onOpenHistory }) => {
  const isSheetConfigured = Boolean(settings.googleScriptUrl?.trim());
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleToggleTheme = () => {
    triggerHaptic('light');
    toggleTheme();
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-white/85 dark:bg-[#161618]/90 border-b border-black/5 dark:border-white/10 transition-colors duration-250">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* App Title & Brand (Classic Apple Monochrome) */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-black dark:text-white leading-tight">
              Service Lead Tracker
            </h1>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-none">
              Internal Dispatch PWA
            </p>
          </div>
        </div>

        {/* Action Controls: Theme Toggle & Status Indicators */}
        <div className="flex items-center space-x-2">
          {/* Light / Dark Mode Toggle Button */}
          <motion.button
            type="button"
            onClick={handleToggleTheme}
            whileTap={{ scale: 0.9 }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full bg-zinc-200/70 dark:bg-zinc-800/80 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-100 transition-colors border border-black/5 dark:border-white/10"
          >
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-zinc-200 stroke-[2.2]" />
              ) : (
                <Sun className="w-4 h-4 text-zinc-800 stroke-[2.2]" />
              )}
            </motion.div>
          </motion.button>

          {/* Google Sheets Sync Pill */}
          <div
            title={
              isSheetConfigured
                ? 'Google Sheets Webhook Connected'
                : 'Google Sheets Webhook Not Configured'
            }
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
              isSheetConfigured
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSheetConfigured
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : 'bg-zinc-400 dark:bg-zinc-600'
              }`}
            />
            <span>{isSheetConfigured ? 'Synced' : 'Local'}</span>
          </div>

          {/* Quick Leads Count */}
          {leadsCount > 0 && onOpenHistory && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenHistory();
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-black dark:text-white text-[11px] font-medium transition-colors border border-black/5 dark:border-white/10 active:scale-95"
            >
              <span className="font-bold text-black dark:text-white">{leadsCount}</span>
              <span className="text-zinc-500 dark:text-zinc-400">leads</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
