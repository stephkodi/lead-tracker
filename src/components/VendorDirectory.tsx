'use strict';
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Phone,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  Building,
  Search,
} from 'lucide-react';
import { Vendor, ServiceCategory } from '@/types';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { triggerHaptic } from '@/utils/haptics';

interface VendorDirectoryProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
}

const CATEGORIES: ServiceCategory[] = [
  'General',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Painting',
  'Other',
];

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [category, setCategory] = useState<ServiceCategory>('General');
  const [company, setCompany] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const openAddModal = () => {
    triggerHaptic('light');
    setEditingVendor(null);
    setName('');
    setPhone('');
    setCategory('General');
    setCompany('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    triggerHaptic('light');
    setEditingVendor(vendor);
    setName(vendor.name);
    setPhone(vendor.phone);
    setCategory(vendor.category);
    setCompany(vendor.company || '');
    setNotes(vendor.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingVendor) {
      onUpdateVendor({
        ...editingVendor,
        name: name.trim(),
        phone: phone.trim(),
        category,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      const newVendor: Vendor = {
        id: 'v-' + Date.now(),
        name: name.trim(),
        phone: phone.trim(),
        category,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
        active: true,
      };
      onAddVendor(newVendor);
    }

    triggerHaptic('success');
    setIsModalOpen(false);
  };

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      v.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery) ||
      (v.company && v.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full pb-24 space-y-4">
      {/* Title & Action Bar */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Vendor Directory
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {vendors.length} active service partners
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </motion.button>
      </div>

      {/* Search & Filter Pills */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by vendor name, company, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-xs focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Category Segmented Pills Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSelectedCategory(cat);
              }}
              className={`text-xs px-3.5 py-1 rounded-full font-medium whitespace-nowrap transition-all select-none border ${
                selectedCategory === cat
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs border-transparent'
                  : 'bg-white dark:bg-[#1C1C1E] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2C2C2E] border-black/5 dark:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List (Classic Apple Inset Cards) */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-8 text-center transition-colors duration-250">
          <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-black dark:text-white">No vendors found</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
            Try adjusting your search query or add a new vendor to the directory.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredVendors.map((vendor) => {
            const directWaLink = generateWhatsAppLink(
              vendor.phone,
              `Hello ${vendor.name}, we have new service requests in your area.`
            );

            return (
              <motion.div
                key={vendor.id}
                layout
                className="bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-2xl p-3.5 space-y-2 shadow-xs transition-colors duration-250"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
                        {vendor.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-[#2C2C2E] text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10">
                        {vendor.category}
                      </span>
                    </div>

                    {vendor.company && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span>{vendor.company}</span>
                      </p>
                    )}

                    <div className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center space-x-1 pt-0.5">
                      <Phone className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                      <span>{vendor.phone}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-1.5">
                    {/* Direct WhatsApp Chat */}
                    <a
                      href={directWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerHaptic('light')}
                      title="Open WhatsApp Business Chat"
                      className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-black dark:text-white flex items-center justify-center transition-colors active:scale-90 border border-black/5 dark:border-white/10"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(vendor)}
                      title="Edit vendor details"
                      className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors active:scale-90 border border-black/5 dark:border-white/10"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('warning');
                        if (confirm(`Remove ${vendor.name} from vendors?`)) {
                          onDeleteVendor(vendor.id);
                        }
                      }}
                      title="Delete vendor"
                      className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-zinc-400 hover:text-rose-500 flex items-center justify-center transition-colors active:scale-90 border border-black/5 dark:border-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {vendor.notes && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[#242426] p-2 rounded-xl text-[11px] border border-black/5 dark:border-white/10">
                    {vendor.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT VENDOR MODAL (Classic Apple Sheet) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 z-10 border border-black/5 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVendor} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Vendor / Contact Name <span className="text-zinc-400 dark:text-zinc-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mike Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    WhatsApp Phone Number <span className="text-zinc-400 dark:text-zinc-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., +1 555-234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Primary Trade
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                      className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-white dark:bg-[#1C1C1E] text-black dark:text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Company / Business
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Notes & Service Areas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., North District only, 24/7 availability..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-zinc-100/80 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-zinc-100 dark:bg-[#2C2C2E] text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
                  >
                    {editingVendor ? 'Save Changes' : 'Add to Directory'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
