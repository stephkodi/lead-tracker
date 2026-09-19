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
  MessageCircle,
  Building,
  Search,
} from 'lucide-react';
import { Vendor, ServiceCategory } from '@/types';
import { generateWhatsAppLink } from '@/lib/whatsapp';

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
    setEditingVendor(null);
    setName('');
    setPhone('');
    setCategory('General');
    setCompany('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Vendor Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {vendors.length} active service partners
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/25 transition-all"
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
            className="w-full liquid-glass-input rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all select-none border ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm border-transparent'
                  : 'liquid-glass text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 border-white/50 dark:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <div className="liquid-glass-card p-8 text-center">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No vendors found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
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
                className="liquid-glass-card p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {vendor.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                        {vendor.category}
                      </span>
                    </div>

                    {vendor.company && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span>{vendor.company}</span>
                      </p>
                    )}

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1 pt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{vendor.phone}</span>
                    </div>
                  </div>

                  {/* Quick Action Icons */}
                  <div className="flex items-center space-x-1.5">
                    {/* Direct WhatsApp Business Chat */}
                    <a
                      href={directWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open WhatsApp Business Chat"
                      className="w-8 h-8 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] dark:text-emerald-400 flex items-center justify-center transition-colors active:scale-90 border border-emerald-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(vendor)}
                      title="Edit vendor details"
                      className="w-8 h-8 rounded-xl liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove ${vendor.name} from vendors?`)) {
                          onDeleteVendor(vendor.id);
                        }
                      }}
                      title="Delete vendor"
                      className="w-8 h-8 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors active:scale-90 border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {vendor.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-black/[0.02] dark:bg-white/[0.04] p-2 rounded-xl text-[11px]">
                    {vendor.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT VENDOR MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md bg-white/90 dark:bg-[#121622]/95 backdrop-blur-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 z-10 border border-white/60 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.08]">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVendor} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 555-234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                      className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="dark:bg-slate-900 dark:text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Company / Brand
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Pro"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Specialty / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Available 24/7, residential only"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 liquid-glass hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20"
                  >
                    {editingVendor ? 'Save Changes' : 'Create Vendor'}
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
