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
} from 'lucide-react';
import { ServiceLead } from '@/types';

interface LeadHistoryViewProps {
  leads: ServiceLead[];
  onSelectLeadForDispatch: (lead: ServiceLead) => void;
}

export const LeadHistoryView: React.FC<LeadHistoryViewProps> = ({
  leads,
  onSelectLeadForDispatch,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    return (
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.location.toLowerCase().includes(q) ||
      lead.services.some((s) => s.toLowerCase().includes(q))
    );
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

      {/* Liquid Search Bar */}
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

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="liquid-glass-card p-8 text-center">
          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No leads found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            {leads.length === 0
              ? 'Submit your first service lead from the "New Lead" tab.'
              : 'No leads match your current search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              className="liquid-glass-card p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lead.customerName}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        lead.status === 'dispatched'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {lead.status === 'dispatched' ? 'Dispatched' : 'Captured'}
                    </span>
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
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs font-semibold flex items-center space-x-1 transition-colors active:scale-95"
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
          ))}
        </div>
      )}
    </div>
  );
};
