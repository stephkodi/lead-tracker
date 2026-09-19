'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  X,
  Copy,
  Check,
  Phone,
  ExternalLink,
  ChevronDown,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ServiceLead, Vendor } from '@/types';
import {
  formatLeadSummaryText,
  generateWhatsAppLink,
  copyToClipboard,
} from '@/lib/whatsapp';
import { updateStoredLead } from '@/lib/storage';

interface WhatsAppDispatchModalProps {
  lead: ServiceLead | null;
  vendors: Vendor[];
  isOpen: boolean;
  onClose: () => void;
  onViewHistory?: () => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  lead,
  vendors,
  isOpen,
  onClose,
  onViewHistory,
}) => {
  const [customSelectedVendorId, setCustomSelectedVendorId] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState<string>('');
  const [useCustomPhone, setUseCustomPhone] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute default matching vendor id based on lead categories
  const defaultMatchingVendorId = useMemo(() => {
    if (!lead || vendors.length === 0) return '';
    const matchingVendor = vendors.find((v) =>
      lead.services.some((srv) => srv.toLowerCase() === v.category.toLowerCase())
    );
    return matchingVendor ? matchingVendor.id : vendors[0].id;
  }, [lead, vendors]);

  const selectedVendorId = customSelectedVendorId || defaultMatchingVendorId;

  if (!isOpen || !lead) return null;

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  const effectivePhone = useCustomPhone
    ? customPhone
    : selectedVendor
    ? selectedVendor.phone
    : '';

  // Generate exact required formatted text
  const formattedText = formatLeadSummaryText({
    date: lead.date,
    customerName: lead.customerName,
    phone: lead.phone,
    services: lead.services,
    requirements: lead.requirements,
    location: lead.location,
  });

  const waLink = generateWhatsAppLink(effectivePhone, formattedText);

  const handleCopy = async () => {
    const success = await copyToClipboard(formattedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSendWhatsApp = () => {
    if (!effectivePhone.trim()) return;

    // Update lead status in localStorage
    if (lead) {
      updateStoredLead(lead.id, {
        status: 'dispatched',
        assignedVendorId: selectedVendor?.id,
        assignedVendorName: selectedVendor?.name || customPhone,
        dispatchedAt: new Date().toISOString(),
      });
    }

    // Open WhatsApp link in new tab or native app
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Liquid Glass Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="relative w-full max-w-md bg-white/90 dark:bg-[#121622]/90 backdrop-blur-3xl rounded-t-[36px] sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-white/60 dark:border-white/10"
        >
          {/* iOS Grabber for bottom sheet */}
          <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Header with iOS 26 Liquid Celebration Animation */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.08]">
            <div className="flex items-center space-x-3">
              {/* Liquid Checkmark with ripple wave (No confetti) */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: [0.8, 1.4, 1.8], opacity: [0.8, 0.3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-emerald-500/30 dark:bg-emerald-400/20 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 relative z-10"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Lead Saved!
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {lead.sheetSynced
                    ? '✓ Synced to Google Sheets'
                    : 'Ready for WhatsApp Business dispatch'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Vendor Picker Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Dispatch Vendor
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomPhone(!useCustomPhone)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {useCustomPhone ? 'Choose from Directory' : '+ Use custom phone'}
                </button>
              </div>

              {!useCustomPhone ? (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setCustomSelectedVendorId(e.target.value)}
                      className="w-full appearance-none liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-medium pr-9"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id} className="dark:bg-slate-900 dark:text-white">
                          {v.name} ({v.category}) — {v.phone}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>

                  {/* Selected Vendor Preview Card */}
                  {selectedVendor && (
                    <div className="liquid-glass rounded-2xl p-3 flex items-center justify-between border border-white/50 dark:border-white/10">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedVendor.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                            {selectedVendor.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedVendor.company || selectedVendor.phone}
                        </p>
                      </div>
                      <div className="text-right text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedVendor.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="tel"
                    placeholder="Enter recipient WhatsApp phone (e.g., +15551234567)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Live Formatted WhatsApp Message Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Live Dispatch Message Preview
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  Ready to send
                </span>
              </div>

              {/* Message Box */}
              <div className="bg-slate-900/90 dark:bg-black/80 text-slate-100 rounded-2xl p-3.5 font-mono text-xs shadow-inner relative border border-slate-800 dark:border-white/10 space-y-1">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200 select-text">
                  {formattedText}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Primary: Send via WhatsApp Business */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleSendWhatsApp}
                disabled={!effectivePhone.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-[#25D366] hover:from-emerald-600 hover:to-[#20bd5a] text-white font-semibold text-base py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="currentColor"
                  className="shrink-0"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.37C9.37 7.37 9.1 7.43 8.88 7.68C8.65 7.92 8.02 8.51 8.02 9.72C8.02 10.93 8.91 12.09 9.03 12.25C9.15 12.41 10.77 14.9 13.25 15.97C13.84 16.23 14.3 16.38 14.66 16.5C15.26 16.69 15.8 16.66 16.24 16.6C16.73 16.53 17.74 15.99 17.95 15.4C18.16 14.81 18.16 14.3 18.1 14.2C18.04 14.1 17.88 14.04 17.64 13.92C17.4 13.8 16.22 13.22 16 13.14C15.78 13.06 15.62 13.02 15.46 13.26C15.29 13.51 14.82 14.06 14.67 14.22C14.53 14.38 14.39 14.4 14.15 14.28C13.91 14.16 12.89 13.83 11.69 12.76C10.75 11.92 10.12 10.89 9.94 10.59C9.76 10.29 9.92 10.13 10.04 10.01C10.15 9.9 10.29 9.72 10.42 9.57C10.55 9.42 10.59 9.3 10.68 9.12C10.76 8.94 10.72 8.78 10.66 8.66C10.6 8.54 10.12 7.37 9.92 6.89C9.72 6.42 9.52 6.48 9.37 6.47H8.97L9.53 7.37Z" />
                </svg>
                <span>Send via WhatsApp Business</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
              </motion.button>

              {/* Secondary: Copy Formatted Text */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 font-semibold text-sm py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-98"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Copied to Clipboard!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Copy Formatted Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Post-Dispatch Navigation Link */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-black/[0.05] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
              >
                <span>+ Create Another Lead</span>
              </button>

              {onViewHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewHistory();
                  }}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium flex items-center space-x-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>View All Leads</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
