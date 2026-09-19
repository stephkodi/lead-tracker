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
} from 'lucide-react';
import { ServiceLead, Vendor } from '@/types';
import {
  formatLeadSummaryText,
  generateWhatsAppLink,
  copyToClipboard,
} from '@/lib/whatsapp';
import { updateStoredLead } from '@/lib/storage';
import { triggerHaptic } from '@/utils/haptics';

interface WhatsAppDispatchModalProps {
  lead: ServiceLead | null;
  vendors: Vendor[];
  isOpen: boolean;
  onClose: () => void;
  onViewHistory?: () => void;
  onLeadDispatched?: (leadId: string, vendorName?: string) => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  lead,
  vendors,
  isOpen,
  onClose,
  onViewHistory,
  onLeadDispatched,
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
    triggerHaptic('light');
    const success = await copyToClipboard(formattedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSendWhatsApp = () => {
    if (!effectivePhone.trim()) return;

    triggerHaptic('success');

    // Update lead status in localStorage and notify parent
    if (lead) {
      const vendorName = selectedVendor?.name || customPhone;
      updateStoredLead(lead.id, {
        status: 'dispatched',
        assignedVendorId: selectedVendor?.id,
        assignedVendorName: vendorName,
        dispatchedAt: new Date().toISOString(),
      });
      if (onLeadDispatched) {
        onLeadDispatched(lead.id, vendorName);
      }
    }

    // Open WhatsApp link in new tab or native app
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        />

        {/* Classic Apple Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-black/5 dark:border-white/10"
        >
          {/* iOS Grabber */}
          <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-black/5 dark:border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                  Lead Saved
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {lead.sheetSynced
                    ? '✓ Synced to Google Sheets'
                    : 'Ready for WhatsApp dispatch'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Vendor Picker Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Select Dispatch Vendor
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomPhone(!useCustomPhone)}
                  className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium"
                >
                  {useCustomPhone ? 'Choose from Directory' : '+ Custom phone'}
                </button>
              </div>

              {!useCustomPhone ? (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setCustomSelectedVendorId(e.target.value)}
                      className="w-full appearance-none bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white font-medium pr-9 focus:outline-none"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id} className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                          {v.name} ({v.category}) — {v.phone}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>

                  {/* Selected Vendor Preview */}
                  {selectedVendor && (
                    <div className="bg-zinc-50 dark:bg-[#242426] rounded-xl p-3 flex items-center justify-between border border-black/5 dark:border-white/10">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-bold text-black dark:text-white">
                            {selectedVendor.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold">
                            {selectedVendor.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {selectedVendor.company || selectedVendor.phone}
                        </p>
                      </div>
                      <div className="text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{selectedVendor.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="tel"
                    placeholder="Enter recipient phone (e.g., +15551234567)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Generated WhatsApp Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Dispatch Message Preview
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-zinc-50 dark:bg-[#151516] border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
                {formattedText}
              </div>
            </div>

            {/* Dispatch Action Buttons */}
            <div className="space-y-2 pt-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleSendWhatsApp}
                disabled={!effectivePhone.trim()}
                className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold text-sm py-3.5 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none select-none"
              >
                <span>Send via WhatsApp Business</span>
                <ExternalLink className="w-4 h-4 ml-0.5" />
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2.5 px-3 rounded-xl border border-black/5 dark:border-white/10 bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Message'}</span>
                </button>

                {onViewHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewHistory();
                    }}
                    className="py-2.5 px-3 rounded-xl border border-black/5 dark:border-white/10 bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>View in History</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
