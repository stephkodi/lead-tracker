'use strict';
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Send,
  Loader2,
  AlertCircle,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Sparkles,
} from 'lucide-react';
import { ServiceCategory, ServiceLead, AppSettings } from '@/types';
import { saveStoredLead } from '@/lib/storage';
import { triggerHaptic } from '@/utils/haptics';

interface LeadCaptureFormProps {
  settings: AppSettings;
  onLeadCreated: (lead: ServiceLead) => void;
}

const AVAILABLE_SERVICES: {
  name: ServiceCategory;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { name: 'General', icon: Wrench },
  { name: 'Electrical', icon: Zap },
  { name: 'Plumbing', icon: Droplets },
  { name: 'Carpentry', icon: Hammer },
  { name: 'Painting', icon: Paintbrush },
  { name: 'Other', icon: Sparkles },
];

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({
  settings,
  onLeadCreated,
}) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(getTodayString());
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<ServiceCategory[]>(['General']);
  const [requirements, setRequirements] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPhoneValid = phone.trim().replace(/[^0-9]/g, '').length >= 7;

  const toggleService = (service: ServiceCategory) => {
    triggerHaptic('light');
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleReset = () => {
    triggerHaptic('light');
    setDate(getTodayString());
    setCustomerName('');
    setPhone('');
    setEmail('');
    setLocation('');
    setSelectedServices(['General']);
    setRequirements('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      triggerHaptic('warning');
      setErrorMessage('Please enter the customer or company name.');
      return;
    }

    if (!phone.trim() || !isPhoneValid) {
      triggerHaptic('warning');
      setErrorMessage('Please enter a valid contact phone number with area code.');
      return;
    }

    if (!location.trim()) {
      triggerHaptic('warning');
      setErrorMessage('Please enter the service location or property address.');
      return;
    }

    if (selectedServices.length === 0) {
      triggerHaptic('warning');
      setErrorMessage('Please select at least one required service category.');
      return;
    }

    setIsSubmitting(true);

    const newLead: ServiceLead = {
      id: 'lead-' + Date.now(),
      date,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      location: location.trim(),
      services: selectedServices,
      requirements: requirements.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
      sheetSynced: false,
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...newLead,
          googleScriptUrl: settings.googleScriptUrl || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.syncedToSheet) {
        newLead.sheetSynced = true;
      }

      saveStoredLead(newLead);
      triggerHaptic('success');
      onLeadCreated(newLead);
      handleReset();
    } catch {
      saveStoredLead(newLead);
      triggerHaptic('success');
      onLeadCreated(newLead);
      handleReset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Intro Header */}
      <div className="px-1 pt-1 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Capture Lead
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
            Log request and dispatch immediately to vendor
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-zinc-600 dark:text-zinc-300 font-medium px-3 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors active:scale-95 border border-black/5 dark:border-white/10"
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: CUSTOMER DETAILS (Classic Apple Inset Grouped) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xs transition-colors duration-250">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-0.5">
            <User className="w-3.5 h-3.5" />
            <span>Customer Details</span>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Date of Service Request <span className="text-zinc-400 dark:text-zinc-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white font-medium focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Customer Name Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Customer / Company Name <span className="text-zinc-400 dark:text-zinc-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g., Sarah Jenkins or Acme Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Phone Number <span className="text-zinc-400 dark:text-zinc-500">*</span>
              </label>
              {phone && (
                <span
                  className={`text-[11px] font-medium ${
                    isPhoneValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {isPhoneValid ? '✓ Valid format' : 'Enter complete number'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="e.g., +1 555-019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Email Input (Optional) */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address <span className="text-zinc-400 dark:text-zinc-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="customer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* SECTION 2: SERVICE CATEGORIES & SCOPE */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xs transition-colors duration-250">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-0.5">
            <div className="flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Services Required</span>
              <span className="text-zinc-400 dark:text-zinc-500">*</span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium normal-case">
              {selectedServices.length} selected
            </span>
          </div>

          {/* Classic Apple Monochrome Multi-Select Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {AVAILABLE_SERVICES.map((srv) => {
              const Icon = srv.icon;
              const isSelected = selectedServices.includes(srv.name);

              return (
                <motion.button
                  key={srv.name}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleService(srv.name)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-semibold shadow-xs'
                      : 'bg-zinc-100/80 dark:bg-[#2C2C2E] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#38383A] font-medium border-black/5 dark:border-white/10'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-1 transition-transform duration-150 ${
                      isSelected ? 'scale-105 stroke-[2.2]' : 'text-zinc-500 dark:text-zinc-400 stroke-[1.8]'
                    }`}
                  />
                  <span className="text-xs leading-tight tracking-tight">{srv.name}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Location / Service Address */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Location / Service Address <span className="text-zinc-400 dark:text-zinc-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                required
                placeholder="e.g., 742 Evergreen Terrace, Apt 4B, Springfield"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Detailed Requirements Textarea */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Detailed Requirements & Notes
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Describe the issue, work scope, urgency, gate codes, or special instructions..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <FileText className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl p-3 flex items-start space-x-2 text-xs text-zinc-900 dark:text-zinc-100"
            >
              <AlertCircle className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary CTA Button: Classic Apple Monochrome Action Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-black dark:bg-white hover:opacity-90 active:scale-[0.98] text-white dark:text-black font-semibold text-base py-3.5 px-5 rounded-2xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:pointer-events-none select-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Logging Lead...</span>
            </>
          ) : (
            <>
              <span>Save & Dispatch Lead</span>
              <Send className="w-4 h-4 ml-0.5" />
            </>
          )}
        </motion.button>

        {/* Helper Footer Note */}
        <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 pt-1">
          Automatically logs to Google Sheets and opens WhatsApp dispatch
        </p>
      </form>
    </div>
  );
};
