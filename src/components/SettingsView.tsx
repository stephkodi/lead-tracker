'use strict';
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  FileSpreadsheet,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  HelpCircle,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  Globe,
} from 'lucide-react';
import { AppSettings } from '@/types';
import { saveStoredSettings, INITIAL_VENDORS, saveStoredVendors } from '@/lib/storage';
import { copyToClipboard } from '@/lib/whatsapp';
import { useTheme, Theme } from '@/context/ThemeContext';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onReloadVendors: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onReloadVendors,
}) => {
  const { theme, setTheme } = useTheme();
  const [scriptUrl, setScriptUrl] = useState<string>(settings.googleScriptUrl || '');
  const [sheetUrl, setSheetUrl] = useState<string>(
    settings.googleSheetViewUrl || 'https://docs.google.com/spreadsheets'
  );
  const [companyName, setCompanyName] = useState<string>(settings.companyName || '');

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [showCodeGuide, setShowCodeGuide] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const sampleCodeSnippet = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = ["Lead ID", "Timestamp", "Date", "Customer Name", "Phone", "Email", "Location", "Services", "Requirements", "Status", "Assigned Vendor"];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "create";

    // 1. UPDATE EXISTING LEAD STATUS
    if (action === "update_status") {
      var leadId = data.leadId;
      var newStatus = data.status;
      var values = sheet.getDataRange().getValues();
      var idCol = values[0].indexOf("Lead ID");
      var phoneCol = values[0].indexOf("Phone");
      var statusCol = values[0].indexOf("Status");
      var vendorCol = values[0].indexOf("Assigned Vendor");
      for (var i = 1; i < values.length; i++) {
        var matchById = (idCol !== -1 && String(values[i][idCol]) === String(leadId));
        var matchByPhone = (phoneCol !== -1 && data.phone && String(values[i][phoneCol]) === String(data.phone));
        if (matchById || matchByPhone) {
          if (statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
          if (data.vendorAssigned && vendorCol !== -1) sheet.getRange(i + 1, vendorCol + 1).setValue(data.vendorAssigned);
          return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: true, newStatus: newStatus })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // 2. APPEND NEW LEAD
    sheet.appendRow([
      data.leadId || ("lead-" + Date.now()),
      data.timestamp || new Date().toISOString(),
      data.date,
      data.customerName,
      data.phone,
      data.email || "",
      data.location || "",
      data.services || "",
      data.requirements || "",
      data.status || "Captured",
      data.vendorAssigned || "Unassigned"
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      googleScriptUrl: scriptUrl.trim(),
      googleSheetViewUrl: sheetUrl.trim() || 'https://docs.google.com/spreadsheets',
      companyName: companyName.trim() || 'Service Lead Tracker',
    };
    saveStoredSettings(updated);
    onUpdateSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!scriptUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Please paste a Google Apps Script Web App URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          customerName: 'System Diagnostic Test',
          phone: '+1 000-000-0000',
          location: 'HQ Test Location',
          services: ['General'],
          requirements: 'Verifying Google Sheets webhook connection from Settings.',
          vendorAssigned: 'Diagnostic Bot',
          googleScriptUrl: scriptUrl.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.syncedToSheet) {
        setTestResult({
          success: true,
          message: 'Connection verified! Test row successfully written to Google Sheets.',
        });
      } else if (res.ok && !data.syncedToSheet) {
        setTestResult({
          success: false,
          message: data.warning || 'Script reached but did not return confirmation. Check permissions.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to communicate with the Web App URL.',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network test error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(sampleCodeSnippet);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleResetSampleData = () => {
    if (confirm('Reset vendors to original 5 default service partners?')) {
      saveStoredVendors(INITIAL_VENDORS);
      onReloadVendors();
      alert('Sample vendors re-seeded successfully!');
    }
  };

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Title */}
      <div className="px-1 pt-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Configuration</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Appearance, Google Sheets connection, and hosting setup
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* APPEARANCE / THEME CARD */}
        <div className="liquid-glass-card p-4 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Appearance & Theme</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {[
              { id: 'light', label: 'Light', icon: Sun, desc: 'Crisp Glass' },
              { id: 'dark', label: 'Dark', icon: Moon, desc: 'Obsidian' },
              { id: 'system', label: 'System', icon: Laptop, desc: 'Automatic' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id as Theme)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'liquid-glass text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium border-white/50 dark:border-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.desc}</span>

                  {isSelected && (
                    <motion.div
                      layoutId="themeSelectedDot"
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-xs"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* GOOGLE SHEETS WEBHOOK CARD */}
        <div className="liquid-glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Google Sheets Integration</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCodeGuide(!showCodeGuide)}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showCodeGuide ? 'Hide Setup' : 'How to Setup'}</span>
            </button>
          </div>

          {/* Webhook URL Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Google Apps Script Web App URL
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Every captured lead is automatically posted and appended to this spreadsheet webhook.
            </p>
          </div>

          {/* Target Sheet Browser Link */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Google Sheet Direct Link
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Action Row */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <a
              href={sheetUrl || 'https://docs.google.com/spreadsheets'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs py-2.5 px-3 rounded-2xl border border-emerald-500/30 flex items-center justify-center space-x-1.5 transition-colors active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Open Sheet in Drive</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting || !scriptUrl.trim()}
              className="flex-1 liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-2xl border border-white/60 dark:border-white/15 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Diagnostic Test Result Banner */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-3 text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/30'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </motion.div>
          )}

          {/* Expandable Setup Instructions */}
          {showCodeGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.08] space-y-2 text-xs text-slate-600 dark:text-slate-400"
            >
              <p className="font-semibold text-slate-800 dark:text-slate-200">Quick 2-Minute Setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400">
                <li>Create a Google Sheet and click <b>Extensions &gt; Apps Script</b>.</li>
                <li>Paste the snippet below and click <b>Deploy &gt; New deployment</b>.</li>
                <li>Choose <b>Web app</b>, set <i>Who has access</i> to <b>Anyone</b>.</li>
                <li>Copy the Web App URL and paste it above!</li>
              </ol>

              <div className="relative bg-slate-900/95 dark:bg-black/90 text-slate-200 p-3 rounded-2xl text-[10px] font-mono overflow-x-auto border border-white/10">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute right-2.5 top-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md flex items-center space-x-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <pre>{sampleCodeSnippet}</pre>
              </div>
            </motion.div>
          )}
        </div>

        {/* GITHUB & VERCEL HOSTING GUIDE CARD */}
        <div className="liquid-glass-card p-4 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>GitHub & Vercel Deployment</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="liquid-glass p-3 rounded-2xl border border-white/40 dark:border-white/10 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <GithubIcon className="w-3.5 h-3.5" />
                <span>1. Push to GitHub</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Run these commands in your project terminal:
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[10px] space-y-1 select-text">
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m &quot;feat: iOS 26 liquid glass lead tracker&quot;</div>
                <div>git remote add origin https://github.com/YOUR_USER/lead-tracker.git</div>
                <div>git push -u origin main</div>
              </div>
            </div>

            <div className="liquid-glass p-3 rounded-2xl border border-white/40 dark:border-white/10 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Globe className="w-3.5 h-3.5" />
                <span>2. Host on Vercel</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline font-medium">vercel.com/new</a> and import your GitHub repository. It works zero-config with Next.js 16!
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Optional: Add <code>GOOGLE_SHEETS_WEBHOOK_URL</code> to Vercel Environment Variables.
              </p>
            </div>
          </div>
        </div>

        {/* GENERAL PREFERENCES CARD */}
        <div className="liquid-glass-card p-4 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            <Settings className="w-4 h-4 text-blue-500" />
            <span>App Preferences</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dispatch Organization / Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Service Pro Logistics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.08]">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Reset Demo Vendors</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Restore original pre-seeded partners</p>
            </div>
            <button
              type="button"
              onClick={handleResetSampleData}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1 transition-colors active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="relative">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:brightness-110 text-white font-semibold text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <span>Save Settings</span>
          </motion.button>

          {/* Toast */}
          <AnimatePresence>
            {savedToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-medium px-4 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 pointer-events-none backdrop-blur-md"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>Settings Saved!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
};
