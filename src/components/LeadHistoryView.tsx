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
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { ServiceLead, LeadStatus } from '@/types';

interface LeadHistoryViewProps {
  leads: ServiceLead[];
  onSelectLeadForDispatch: (lead: ServiceLead) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus) => void;
}

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  new: {
    label: 'Captured',
    bg: 'bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  dispatched: {
    label: 'Dispatched',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-purple-500/15',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
    dot: 'bg-purple-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
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

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Title & Count */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Leads History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {leads.length} recorded service requests
          </p>
        </div>
      </div>

      {/* Liquid Search & Status Filters */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search customer, phone, location, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full liquid-glass-input rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Status Filter Chips */}
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
                onClick={() => setStatusFilter(item.id)}
                className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all select-none border flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm border-transparent'
                    : 'liquid-glass text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 border-white/50 dark:border-white/10'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? 'bg-white/20 dark:bg-slate-800 text-white dark:text-slate-100'
                      : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="liquid-glass-card p-8 text-center">
          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No leads found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
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

            return (
              <motion.div
                key={lead.id}
                layout
                className="liquid-glass-card p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {lead.customerName}
                      </h3>

                      {/* Interactive Editable Status Badge Pill */}
                      <div
                        className={`inline-flex items-center pl-2 pr-1 py-0.5 rounded-full border transition-colors shadow-xs ${statusInfo.bg} ${statusInfo.border}`}
                        title="Click to change lead status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${statusInfo.dot}`} />
                        <div className="relative inline-flex items-center">
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              onUpdateLeadStatus &&
                              onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)
                            }
                            className={`appearance-none bg-transparent pr-4 text-[10px] font-semibold cursor-pointer focus:outline-none ${statusInfo.text}`}
                          >
                            <option value="new" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              Captured
                            </option>
                            <option value="dispatched" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              Dispatched
                            </option>
                            <option value="in_progress" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              In Progress
                            </option>
                            <option value="completed" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              Completed
                            </option>
                            <option value="cancelled" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                              Cancelled
                            </option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-0.5 pointer-events-none opacity-60" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{lead.date}</span>
                      </span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Dispatch Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onSelectLeadForDispatch(lead)}
                    className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs font-semibold flex items-center space-x-1 transition-colors active:scale-95 shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Dispatch</span>
                  </motion.button>
                </div>

                {/* Service Badges */}
                <div className="flex flex-wrap gap-1">
                  {lead.services.map((srv) => (
                    <span
                      key={srv}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg liquid-glass text-slate-700 dark:text-slate-300 border-white/40 dark:border-white/10"
                    >
                      {srv}
                    </span>
                  ))}
                </div>

                {/* Location */}
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-1.5 liquid-glass p-2.5 rounded-xl border border-white/40 dark:border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">{lead.location}</span>
                </div>

                {/* Scope Notes if available */}
                {lead.requirements && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic px-1">
                    &ldquo;{lead.requirements}&rdquo;
                  </p>
                )}

                {/* Assigned Vendor or status */}
                {lead.assignedVendorName && (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between">
                    <span>
                      Assigned:{' '}
                      <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                        {lead.assignedVendorName}
                      </strong>
                    </span>
                    {lead.sheetSynced && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Logged to Sheet</span>
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
