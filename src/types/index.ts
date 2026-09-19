export type ServiceCategory =
  | 'General'
  | 'Electrical'
  | 'Plumbing'
  | 'Carpentry'
  | 'Painting'
  | 'Other';

export type LeadStatus =
  | 'new'
  | 'dispatched'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceLead {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  services: ServiceCategory[];
  requirements: string;
  status: LeadStatus;
  assignedVendorId?: string;
  assignedVendorName?: string;
  dispatchedAt?: string;
  createdAt: string;
  sheetSynced?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  category: ServiceCategory;
  company?: string;
  notes?: string;
  rating?: number;
  active: boolean;
}

export interface AppSettings {
  googleScriptUrl: string;
  googleSheetViewUrl: string;
  companyName: string;
  defaultCountryCode: string;
}

export interface LeadSubmissionPayload {
  date: string;
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  services: ServiceCategory[];
  requirements: string;
  vendorAssigned?: string;
  googleScriptUrl?: string;
}
