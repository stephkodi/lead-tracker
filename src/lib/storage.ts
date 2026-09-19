import { ServiceLead, Vendor, AppSettings } from '@/types';

const VENDORS_STORAGE_KEY = 'service_lead_tracker_vendors_v1';
const LEADS_STORAGE_KEY = 'service_lead_tracker_leads_v1';
const SETTINGS_STORAGE_KEY = 'service_lead_tracker_settings_v1';

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'v-1',
    name: 'Alex Rivera',
    phone: '+1 555-234-5678',
    category: 'Electrical',
    company: 'SparkLine Electric Co.',
    rating: 4.9,
    notes: 'Licensed Master Electrician. Emergency repairs & rewiring.',
    active: true,
  },
  {
    id: 'v-2',
    name: 'Marcus Vance',
    phone: '+1 555-876-5432',
    category: 'Plumbing',
    company: 'FlowMaster Plumbing',
    rating: 4.8,
    notes: 'Commercial & residential leak detection, pipe fitting, water heaters.',
    active: true,
  },
  {
    id: 'v-3',
    name: 'David Chen',
    phone: '+1 555-345-6789',
    category: 'Carpentry',
    company: 'TimberCraft Woodworks',
    rating: 4.9,
    notes: 'Custom cabinetry, structural framing, door & window repairs.',
    active: true,
  },
  {
    id: 'v-4',
    name: 'Elena Rostova',
    phone: '+1 555-901-2345',
    category: 'Painting',
    company: 'PrimeCoat Finishes',
    rating: 4.7,
    notes: 'Interior/exterior precision painting, drywall repair, texture coating.',
    active: true,
  },
  {
    id: 'v-5',
    name: 'Sam Taylor',
    phone: '+1 555-432-1098',
    category: 'General',
    company: 'Apex Pro Handyman Services',
    rating: 4.8,
    notes: 'All-around facilities maintenance, fixtures, assembly, drywall.',
    active: true,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  googleScriptUrl: '',
  googleSheetViewUrl: 'https://docs.google.com/spreadsheets',
  companyName: 'Service Lead Tracker',
  defaultCountryCode: '+1',
};

// Safe localStorage accessor for SSR/Next.js
export const getStoredVendors = (): Vendor[] => {
  if (typeof window === 'undefined') return INITIAL_VENDORS;
  try {
    const raw = localStorage.getItem(VENDORS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(INITIAL_VENDORS));
      return INITIAL_VENDORS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VENDORS;
  }
};

export const saveStoredVendors = (vendors: Vendor[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors));
  } catch (err) {
    console.error('Failed to save vendors to localStorage:', err);
  }
};

export const getStoredLeads = (): ServiceLead[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredLead = (lead: ServiceLead): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLeads();
    const updated = [lead, ...existing.filter((l) => l.id !== lead.id)];
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save lead to localStorage:', err);
  }
};

export const updateStoredLead = (id: string, updates: Partial<ServiceLead>): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLeads();
    const updated = existing.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead));
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update lead in localStorage:', err);
  }
};

export const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: AppSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
};
