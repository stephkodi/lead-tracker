'use strict';
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Send,
  ChevronDown,
} from 'lucide-react';
import { ServiceLead, LeadStatus } from '@/types';
import { sanitizeWhatsAppPhone } from '@/lib/whatsapp';
import { triggerHaptic } from '@/utils/haptics';

interface LeadHistoryViewProps {
  leads: ServiceLead[];
  onSelectLeadForDispatch: (lead: ServiceLead) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus) => void;
}

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: 'Captured',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
  dispatched: {
    label: 'Dispatched',
    bg: 'bg-zinc-200 dark:bg-zinc-700',
    text: 'text-zinc-900 dark:text-zinc-100',
    border: 'border-zinc-300 dark:border-zinc-600',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-zinc-200/80 dark:bg-zinc-800',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-black dark:bg-white',
    text: 'text-white dark:text-black font-semibold',
    border: 'border-black dark:border-white',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-100 dark:bg-zinc-900',
    text: 'text-zinc-400 dark:text-zinc-500',
    border: 'border-zinc-200 dark:border-zinc-800',
  },
};

const ALL_STATUSES: { id: 'all' | LeadStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'Captured' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const LeadHistoryView: React.FC<LeadHistoryViewProps> = ({
  leads,
  onSelectLeadForDispatch,
  onUpdateLeadStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.location.toLowerCase().includes(q) ||
      lead.services.some((s) => s.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    triggerHaptic('medium');
    if (onUpdateLeadStatus) {
      onUpdateLeadStatus(leadId, newStatus);
    }
  };

  const handleFilterClick = (statusId: 'all' | LeadStatus) => {
    triggerHaptic('selection');
    setStatusFilter(statusId);
  };

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Title & Count */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Leads History
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {leads.length} recorded service requests
          </p>
        </div>
      </div>

      {/* Classic Apple Search & Status Segmented Filters */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search customer, phone, location, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-xs focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Apple Segmented Status Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ALL_STATUSES.map((item) => {
            const count =
              item.id === 'all'
                ? leads.length
                : leads.filter((l) => l.status === item.id).length;

            const isSelected = statusFilter === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFilterClick(item.id)}
                className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all select-none border flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs border-transparent'
                    : 'bg-white dark:bg-[#1C1C1E] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2C2C2E] border-black/5 dark:border-white/10'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                      : 'bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads List (Apple Inset Grouped Table View) */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-8 text-center transition-colors duration-250">
          <History className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-black dark:text-white">No leads found</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
            {leads.length === 0
              ? 'Submit your first service lead from the "New Lead" tab.'
              : 'No leads match your current search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const currentStatus: LeadStatus = lead.status || 'new';
            const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.new;
            const customerWhatsAppUrl = `https://wa.me/${sanitizeWhatsAppPhone(lead.phone)}?text=${encodeURIComponent(
              `Hi ${lead.customerName}, following up regarding your service request for ${lead.services.join(', ')}.`
            )}`;

            return (
              <motion.div
                key={lead.id}
                layout
                className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-xs transition-colors duration-250"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
                        {lead.customerName}
                      </h3>

                      {/* Interactive Apple Monochrome Status Dropdown Pill */}
                      <div
                        className={`inline-flex items-center pl-2.5 pr-1.5 py-0.5 rounded-full border transition-colors shadow-2xs ${statusInfo.bg} ${statusInfo.border}`}
                        title="Change lead status"
                      >
                        <div className="relative inline-flex items-center">
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              handleStatusChange(lead.id, e.target.value as LeadStatus)
                            }
                            className={`appearance-none bg-transparent pr-4 text-[10px] font-semibold cursor-pointer focus:outline-none ${statusInfo.text}`}
                          >
                            <option value="new" className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                              Captured
                            </option>
                            <option value="dispatched" className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                              Dispatched
                            </option>
                            <option value="in_progress" className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                              In Progress
                            </option>
                            <option value="completed" className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                              Completed
                            </option>
                            <option value="cancelled" className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                              Cancelled
                            </option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-0 pointer-events-none opacity-60" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                        <span>{lead.date}</span>
                      </span>
                      <span>•</span>
                      <span>{lead.phone}</span>
                    </div>
                  </div>

                  {/* Dispatch to Vendor Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      triggerHaptic('medium');
                      onSelectLeadForDispatch(lead);
                    }}
                    className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-2.5 py-1.5 text-xs font-semibold flex items-center space-x-1 transition-opacity hover:opacity-90 active:scale-95 shrink-0 shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Dispatch</span>
                  </motion.button>
                </div>

                {/* Service Badges */}
                <div className="flex flex-wrap gap-1">
                  {lead.services.map((srv) => (
                    <span
                      key={srv}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-[#2C2C2E] text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10"
                    >
                      {srv}
                    </span>
                  ))}
                </div>

                {/* Location */}
                <div className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start space-x-1.5 bg-zinc-50 dark:bg-[#242426] p-2.5 rounded-xl border border-black/5 dark:border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">{lead.location}</span>
                </div>

                {/* Scope Notes if available */}
                {lead.requirements && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic px-0.5">
                    &ldquo;{lead.requirements}&rdquo;
                  </p>
                )}

                {/* 1-Tap Customer Action Row (Call & WhatsApp) */}
                <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Call Customer Button */}
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={() => triggerHaptic('light')}
                      className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-zinc-800 dark:text-zinc-200 transition-colors border border-black/5 dark:border-white/10 font-medium active:scale-95"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>

                    {/* WhatsApp Customer Button */}
                    <a
                      href={customerWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerHaptic('light')}
                      className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-zinc-800 dark:text-zinc-200 transition-colors border border-black/5 dark:border-white/10 font-medium active:scale-95"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Assigned Vendor or Sync Status */}
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {lead.assignedVendorName ? (
                      <span>
                        Vendor:{' '}
                        <strong className="text-black dark:text-white font-semibold">
                          {lead.assignedVendorName}
                        </strong>
                      </span>
                    ) : lead.sheetSynced ? (
                      <span className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        <span>Sheet</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
