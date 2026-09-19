'use strict';
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { AppSettings } from '@/types';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  settings: AppSettings;
  leadsCount: number;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, leadsCount, onOpenHistory }) => {
  const isSheetConfigured = Boolean(settings.googleScriptUrl?.trim());
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-white/70 dark:bg-[#0c101a]/70 border-b border-white/60 dark:border-white/10 transition-colors duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* App Title & Brand with Liquid Glass Glow */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/25 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-xs pointer-events-none" />
            <Sparkles className="w-4 h-4 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
              Service Lead Tracker
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
              Internal Dispatch PWA
            </p>
          </div>
        </div>

        {/* Action Controls: Theme Toggle & Status Indicators */}
        <div className="flex items-center space-x-2">
          {/* Light / Dark Mode Liquid Toggle Button */}
          <motion.button
            type="button"
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center justify-center text-slate-700 dark:text-amber-300 transition-colors relative overflow-hidden shadow-xs border border-white/60 dark:border-white/15"
          >
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? (
                <Moon className="w-4 h-4 fill-amber-300/20 text-amber-300 stroke-[2.2]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 stroke-[2.2]" />
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
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
              isSheetConfigured
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}
          >
            {isSheetConfigured ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                <span>Live</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Local</span>
              </>
            )}
          </div>

          {/* Quick Leads Count */}
          {leadsCount > 0 && onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors active:scale-95"
            >
              <span className="font-bold text-blue-600 dark:text-blue-400">{leadsCount}</span>
              <span className="text-slate-400 dark:text-slate-500">leads</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
