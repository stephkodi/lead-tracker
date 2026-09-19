'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Navigation, NavTab } from '@/components/Navigation';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { VendorDirectory } from '@/components/VendorDirectory';
import { SettingsView } from '@/components/SettingsView';
import { LeadHistoryView } from '@/components/LeadHistoryView';
import { WhatsAppDispatchModal } from '@/components/WhatsAppDispatchModal';
import { ServiceLead, Vendor, AppSettings } from '@/types';
import {
  getStoredVendors,
  saveStoredVendors,
  getStoredLeads,
  getStoredSettings,
} from '@/lib/storage';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>('capture');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [leads, setLeads] = useState<ServiceLead[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    googleScriptUrl: '',
    googleSheetViewUrl: 'https://docs.google.com/spreadsheets',
    companyName: 'Service Lead Tracker',
    defaultCountryCode: '+1',
  });

  // Active lead for WhatsApp modal
  const [dispatchLead, setDispatchLead] = useState<ServiceLead | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  // Load from local storage after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setVendors(getStoredVendors());
      setLeads(getStoredLeads());
      setSettings(getStoredSettings());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLeadCreated = (newLead: ServiceLead) => {
    setLeads((prev) => [newLead, ...prev]);
    setDispatchLead(newLead);
    setIsDispatchModalOpen(true);
  };

  const handleAddVendor = (vendor: Vendor) => {
    const updated = [...vendors, vendor];
    setVendors(updated);
    saveStoredVendors(updated);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const updated = vendors.map((v) =>
      v.id === updatedVendor.id ? updatedVendor : v
    );
    setVendors(updated);
    saveStoredVendors(updated);
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updated = vendors.filter((v) => v.id !== vendorId);
    setVendors(updated);
    saveStoredVendors(updated);
  };

  const handleReloadVendors = () => {
    setVendors(getStoredVendors());
  };

  const handleSelectLeadForDispatch = (lead: ServiceLead) => {
    setDispatchLead(lead);
    setIsDispatchModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#04060a] flex justify-center relative overflow-hidden transition-colors duration-300">
      {/* iOS 26 Ambient Liquid Aurora Orbs for authentic glass refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="liquid-orb-1 absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 dark:bg-blue-600/18 blur-[80px]" />
        <div className="liquid-orb-2 absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-purple-500/18 dark:bg-indigo-600/16 blur-[90px]" />
        <div className="liquid-orb-3 absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-teal-400/18 dark:bg-teal-500/14 blur-[75px]" />
      </div>

      {/* Mobile-first frame container with liquid glass boundaries */}
      <main className="w-full max-w-md min-h-screen bg-[#f2f2f7]/85 dark:bg-[#07090e]/85 backdrop-blur-xl flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.06)] dark:shadow-[0_0_100px_rgba(0,0,0,0.7)] border-x border-white/60 dark:border-white/10 transition-colors duration-300">
        {/* Top Header */}
        <Header
          settings={settings}
          leadsCount={leads.length}
          onOpenHistory={() => setCurrentTab('history')}
        />

        {/* Tab Content Container */}
        <div className="flex-1 px-4 pt-3 pb-28 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentTab === 'capture' && (
              <motion.div
                key="tab-capture"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.16 }}
              >
                <LeadCaptureForm
                  settings={settings}
                  onLeadCreated={handleLeadCreated}
                />
              </motion.div>
            )}

            {currentTab === 'vendors' && (
              <motion.div
                key="tab-vendors"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.16 }}
              >
                <VendorDirectory
                  vendors={vendors}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={handleUpdateVendor}
                  onDeleteVendor={handleDeleteVendor}
                />
              </motion.div>
            )}

            {currentTab === 'history' && (
              <motion.div
                key="tab-history"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.16 }}
              >
                <LeadHistoryView
                  leads={leads}
                  onSelectLeadForDispatch={handleSelectLeadForDispatch}
                />
              </motion.div>
            )}

            {currentTab === 'settings' && (
              <motion.div
                key="tab-settings"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.16 }}
              >
                <SettingsView
                  settings={settings}
                  onUpdateSettings={setSettings}
                  onReloadVendors={handleReloadVendors}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Bottom Navigation */}
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          leadsCount={leads.length}
        />

        {/* WhatsApp Dispatch Bottom Sheet Modal */}
        <WhatsAppDispatchModal
          lead={dispatchLead}
          vendors={vendors}
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          onViewHistory={() => setCurrentTab('history')}
        />
      </main>
    </div>
  );
}
