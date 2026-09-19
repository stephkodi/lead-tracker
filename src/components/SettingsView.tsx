'use strict';
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  Link2,
  Check,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Copy,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sun,
  Moon,
  Laptop,
  Globe,
  Settings,
} from 'lucide-react';
import { AppSettings } from '@/types';
import { saveStoredSettings, saveStoredVendors, INITIAL_VENDORS } from '@/lib/storage';
import { copyToClipboard } from '@/lib/whatsapp';
import { useTheme, Theme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';

// Custom inline SVG for GitHub icon
const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
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
  const [sheetUrl, setSheetUrl] = useState<string>(settings.googleSheetViewUrl || '');
  const [companyName, setCompanyName] = useState<string>(settings.companyName || '');

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [showCodeGuide, setShowCodeGuide] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Hardened Google Apps Script Webhook Snippet (Never creates duplicate rows on status update)
  const sampleCodeSnippet = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = [
      "Lead ID",
      "Timestamp",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Location",
      "Services",
      "Requirements",
      "Status",
      "Assigned Vendor"
    ];

    // Ensure header row exists if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#000000");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    var action = data.action || "create";

    // 1. UPDATE EXISTING LEAD STATUS (NEVER APPENDS A NEW ROW)
    if (action === "update_status") {
      var leadId = data.leadId ? String(data.leadId).trim() : "";
      var newStatus = data.status || "";
      var cleanPhone = data.phone ? String(data.phone).replace(/\\D/g, "") : "";

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "not_found",
          message: "Sheet contains no lead rows to update"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var values = sheet.getDataRange().getValues();
      var headerRow = values[0];

      var idCol = -1, phoneCol = -1, statusCol = -1, vendorCol = -1;
      for (var c = 0; c < headerRow.length; c++) {
        var h = String(headerRow[c]).toLowerCase().trim();
        if (h === "lead id" || h === "id") idCol = c;
        else if (h.indexOf("phone") !== -1) phoneCol = c;
        else if (h === "status") statusCol = c;
        else if (h.indexOf("vendor") !== -1) vendorCol = c;
      }

      if (idCol === -1) idCol = 0;       // Default Column A
      if (phoneCol === -1) phoneCol = 4; // Default Column E
      if (statusCol === -1) statusCol = 9; // Default Column J
      if (vendorCol === -1) vendorCol = 10; // Default Column K

      for (var i = 1; i < values.length; i++) {
        var rowId = String(values[i][idCol]).trim();
        var rowPhone = String(values[i][phoneCol]).replace(/\\D/g, "");

        var matchesId = leadId && rowId && (rowId === leadId || rowId.indexOf(leadId) !== -1 || leadId.indexOf(rowId) !== -1);
        var matchesPhone = cleanPhone && rowPhone && (rowPhone === cleanPhone || rowPhone.slice(-10) === cleanPhone.slice(-10));

        if (matchesId || matchesPhone) {
          if (statusCol !== -1) {
            sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
          }
          if (data.vendorAssigned && vendorCol !== -1) {
            sheet.getRange(i + 1, vendorCol + 1).setValue(data.vendorAssigned);
          }
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            action: "update_status",
            updatedRow: i + 1,
            newStatus: newStatus
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Explicitly return without creating a new row
      return ContentService.createTextOutput(JSON.stringify({
        status: "not_found",
        message: "No matching lead found. No new row was created."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. APPEND NEW LEAD (ONLY WHEN ACTION IS "CREATE")
    if (action === "create") {
      sheet.appendRow([
        data.leadId || ("lead-" + Date.now()),
        data.timestamp || new Date().toISOString(),
        data.date || "",
        data.customerName || "",
        data.phone || "",
        data.email || "",
        data.location || "",
        data.services || "",
        data.requirements || "",
        data.status || "Captured",
        data.vendorAssigned || "Unassigned"
      ]);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "create",
        row: sheet.getLastRow()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "invalid_action",
      message: "Unrecognized action: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Service Lead Tracker Webhook is ready"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic('success');
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
      triggerHaptic('warning');
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
          action: 'create',
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
        triggerHaptic('success');
        setTestResult({
          success: true,
          message: 'Connection verified! Test lead written to Google Sheets.',
        });
      } else if (res.ok && !data.syncedToSheet) {
        triggerHaptic('warning');
        setTestResult({
          success: false,
          message: data.warning || 'Script reached but did not confirm write. Check Google Apps Script permissions.',
        });
      } else {
        triggerHaptic('warning');
        setTestResult({
          success: false,
          message: data.error || 'Failed to communicate with Web App URL.',
        });
      }
    } catch (err: unknown) {
      triggerHaptic('warning');
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network test error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = async () => {
    triggerHaptic('light');
    const ok = await copyToClipboard(sampleCodeSnippet);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleResetSampleData = () => {
    triggerHaptic('warning');
    if (confirm('Reset vendors to original 5 default service partners?')) {
      saveStoredVendors(INITIAL_VENDORS);
      onReloadVendors();
      alert('Default vendors restored!');
    }
  };

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Title */}
      <div className="px-1 pt-1">
        <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">Configuration</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Appearance, Google Sheets connection, and hosting setup
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* APPEARANCE / THEME CARD (Classic Apple Inset Grouped) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-xs transition-colors duration-250">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
            <Sun className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span>Appearance & Theme</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {[
              { id: 'light', label: 'Light', icon: Sun, desc: 'Classic Light' },
              { id: 'dark', label: 'Dark', icon: Moon, desc: 'AMOLED Black' },
              { id: 'system', label: 'System', icon: Laptop, desc: 'Automatic' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setTheme(item.id as Theme);
                  }}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-semibold shadow-xs'
                      : 'bg-zinc-100/80 dark:bg-[#2C2C2E] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#38383A] font-medium border-black/5 dark:border-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'stroke-[2.2]' : 'text-zinc-500 dark:text-zinc-400 stroke-[1.8]'}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[10px] opacity-70">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GOOGLE SHEETS WEBHOOK CARD */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-xs transition-colors duration-250">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              <span>Google Sheets Integration</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowCodeGuide(!showCodeGuide);
              }}
              className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium hover:underline flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showCodeGuide ? 'Hide Setup' : 'How to Setup'}</span>
            </button>
          </div>

          {/* Webhook URL Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Google Apps Script Web App URL
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono focus:outline-none focus:border-black/30 dark:focus:border-white/30"
              />
              <Link2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Captured leads and status modifications are forwarded in real-time to this spreadsheet webhook.
            </p>
          </div>

          {/* Target Sheet Browser Link */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Google Sheet Direct Link
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30"
            />
          </div>

          {/* Action Row */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <a
              href={sheetUrl || 'https://docs.google.com/spreadsheets'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic('light')}
              className="flex-1 bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-black dark:text-white font-semibold text-xs py-2.5 px-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-center space-x-1.5 transition-colors active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Open Sheet in Drive</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting || !scriptUrl.trim()}
              className="flex-1 bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-black dark:text-white font-semibold text-xs py-2.5 px-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 active:scale-95"
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
              className={`rounded-xl p-3 text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </motion.div>
          )}

          {/* Expandable Setup Instructions */}
          {showCodeGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 space-y-2 text-xs text-zinc-600 dark:text-zinc-400"
            >
              <p className="font-semibold text-black dark:text-white">Quick Setup (With Status Updates):</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-400">
                <li>Open your Google Sheet and click <b>Extensions &gt; Apps Script</b>.</li>
                <li>Paste the script below into <code>Code.gs</code> and click <b>Save</b>.</li>
                <li>Click <b>Deploy &gt; New deployment</b> (or Manage deployments &gt; New version if updating).</li>
                <li>Choose <b>Web app</b>, set <i>Who has access</i> to <b>Anyone</b>.</li>
                <li>Copy the Web App URL and paste it above!</li>
              </ol>

              <div className="relative bg-zinc-950 text-zinc-200 p-3 rounded-xl text-[10px] font-mono overflow-x-auto border border-zinc-800">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute right-2.5 top-2.5 bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded-md flex items-center space-x-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <pre>{sampleCodeSnippet}</pre>
              </div>
            </motion.div>
          )}
        </div>

        {/* GITHUB & VERCEL HOSTING CARD */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-xs transition-colors duration-250">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span>GitHub & Vercel Deployment</span>
          </div>

          <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div className="bg-zinc-50 dark:bg-[#242426] p-3 rounded-xl border border-black/5 dark:border-white/10 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-black dark:text-white">
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Connected to <code>stephkodi/lead-tracker</code> on branch <code>main</code>.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-[#242426] p-3 rounded-xl border border-black/5 dark:border-white/10 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-black dark:text-white">
                <Globe className="w-3.5 h-3.5" />
                <span>Vercel Live URL</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Live at <a href="https://lead-tracker-mu-five.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-black dark:text-white underline font-medium">lead-tracker-mu-five.vercel.app</a>.
              </p>
            </div>
          </div>
        </div>

        {/* GENERAL PREFERENCES CARD */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-xs transition-colors duration-250">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
            <Settings className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span>App Preferences</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Dispatch Organization / Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Service Pro Logistics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/10">
            <div>
              <p className="text-xs font-semibold text-black dark:text-white">Reset Demo Vendors</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Restore original pre-seeded partners</p>
            </div>
            <button
              type="button"
              onClick={handleResetSampleData}
              className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#38383A] px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1 transition-colors active:scale-95 border border-black/5 dark:border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Save Button: Classic Apple Monochrome Button */}
        <div className="relative">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full bg-black dark:bg-white hover:opacity-90 active:scale-[0.98] text-white dark:text-black font-semibold text-sm py-3.5 px-4 rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2 select-none"
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
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-4 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 pointer-events-none"
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
