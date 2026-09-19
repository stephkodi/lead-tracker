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

interface LeadCaptureFormProps {
  settings: AppSettings;
  onLeadCreated: (lead: ServiceLead) => void;
}

const AVAILABLE_SERVICES: {
  name: ServiceCategory;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    name: 'General',
    icon: Wrench,
    color: 'text-slate-600 dark:text-slate-300',
    activeBg: 'bg-slate-800 dark:bg-slate-700 text-white',
    activeBorder: 'border-slate-800 dark:border-slate-600',
  },
  {
    name: 'Electrical',
    icon: Zap,
    color: 'text-amber-500',
    activeBg: 'bg-amber-500 text-white',
    activeBorder: 'border-amber-500',
  },
  {
    name: 'Plumbing',
    icon: Droplets,
    color: 'text-blue-500',
    activeBg: 'bg-blue-600 text-white',
    activeBorder: 'border-blue-600',
  },
  {
    name: 'Carpentry',
    icon: Hammer,
    color: 'text-orange-500',
    activeBg: 'bg-orange-600 text-white',
    activeBorder: 'border-orange-600',
  },
  {
    name: 'Painting',
    icon: Paintbrush,
    color: 'text-purple-500',
    activeBg: 'bg-purple-600 text-white',
    activeBorder: 'border-purple-600',
  },
  {
    name: 'Other',
    icon: Sparkles,
    color: 'text-emerald-500',
    activeBg: 'bg-emerald-600 text-white',
    activeBorder: 'border-emerald-600',
  },
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
      setErrorMessage('Please enter the customer or company name.');
      return;
    }

    if (!phone.trim() || !isPhoneValid) {
      setErrorMessage('Please enter a valid contact phone number with area code.');
      return;
    }

    if (!location.trim()) {
      setErrorMessage('Please enter the service location or property address.');
      return;
    }

    if (selectedServices.length === 0) {
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
          ...newLead,
          googleScriptUrl: settings.googleScriptUrl || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.syncedToSheet) {
        newLead.sheetSynced = true;
      }

      saveStoredLead(newLead);
      onLeadCreated(newLead);
      handleReset();
    } catch {
      saveStoredLead(newLead);
      onLeadCreated(newLead);
      handleReset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-24">
      {/* Intro Subtitle */}
      <div className="px-1 pt-1 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Capture Lead</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            Log request and dispatch immediately to vendor
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-blue-600 dark:text-blue-400 font-medium px-3 py-1 rounded-full liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors active:scale-95"
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: CUSTOMER DETAILS */}
        <div className="liquid-glass-card p-4 space-y-3.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
            <User className="w-3.5 h-3.5" />
            <span>Customer Details</span>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date of Service Request <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-medium"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Customer Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer / Company Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g., Sarah Jenkins or Acme Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              {phone && (
                <span
                  className={`text-[11px] font-medium ${
                    isPhoneValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
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
                className={`w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ${
                  phone && !isPhoneValid ? 'border-amber-400 dark:border-amber-500' : ''
                }`}
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Email Input (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="customer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* SECTION 2: SERVICE CATEGORIES & SCOPE */}
        <div className="liquid-glass-card p-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-1">
            <div className="flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Services Required</span>
              <span className="text-rose-500">*</span>
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium normal-case">
              {selectedServices.length} selected
            </span>
          </div>

          {/* Multi-Select Pills */}
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
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-150 select-none ${
                    isSelected
                      ? `${srv.activeBg} ${srv.activeBorder} shadow-sm font-semibold`
                      : 'liquid-glass text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium border-white/60 dark:border-white/10'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-1 transition-transform duration-150 ${
                      isSelected ? 'scale-110 text-white' : srv.color
                    }`}
                  />
                  <span className="text-xs leading-tight tracking-tight">{srv.name}</span>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white shadow-xs"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Location / Service Address */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Location / Service Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                required
                placeholder="e.g., 742 Evergreen Terrace, Apt 4B, Springfield"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Detailed Requirements Textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Detailed Requirements & Notes
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Describe the issue, work scope, urgency, gate codes, or special instructions..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
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
              className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3 flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary CTA Button: iOS Liquid Gradient Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:brightness-110 active:brightness-95 text-white font-semibold text-base py-3.5 px-5 rounded-2xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/40 flex items-center justify-center space-x-2 transition-all disabled:opacity-70 disabled:pointer-events-none relative overflow-hidden"
        >
          {/* Liquid highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-px bg-white/40 pointer-events-none" />

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
        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
          Automatically logs to Google Sheets and opens WhatsApp dispatch
        </p>
      </form>
    </div>
  );
};
