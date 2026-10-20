export interface UserPermissions {
  properties: { create: boolean; read: boolean; update: boolean; delete: boolean };
  services: { create: boolean; read: boolean; update: boolean; delete: boolean };
  appointments: { create: boolean; read: boolean; update: boolean; delete: boolean };
}

export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  images: string[];
  description: string;
  type: 'Residential' | 'Commercial' | 'Land';
  coordinates: [number, number]; // [lat, lng]
  rooms?: number;
  status?: 'available' | 'reserved' | 'sold' | 'pending_review';
  views?: number;
  yearBuilt?: number;
  heatingSystem?: string;
  area?: number; // in square meters
  floors?: number;
  electricityType?: string;
  updatedAt?: string;
  isExclusive?: boolean;
  exclusiveStart?: string;
  exclusiveEnd?: string;
  exclusiveMarketingDetails?: string;
  governorate?: string;
  hasOffer?: boolean;
  offerExpiresAt?: string; // ISO 8601 string
  offerPriceOriginal?: string;
  classification?: 'under_construction' | 'ready_to_move' | 'investment_offer' | 'commercial_investment';
  isPremium?: boolean;
  isBlocked?: boolean;
  archived?: boolean;
  brokerId?: string;
  addedServices?: string[];
  toiletCount?: number;
  balconyCount?: number;
  isClientSubmitted?: boolean;
  clientName?: string;
  clientPhone?: string;
  finishingLevel?: string;
  deedsStatus?: string;
  createdAt?: string;
  priceHistory?: PriceChange[];
}

export interface PriceChange {
  id?: string;
  oldPrice: string;
  newPrice: string;
  changeDate: string;
  changedBy?: string;
  reason?: string;
  propertyTitle?: string;
  propertyId?: string;
}

export interface Service {
  id: string;
  title: string;
  price: string;
  description: string;
  category: 'legal' | 'internet' | 'construction';
  images: string[];
  createdAt: string;
  webhookUrl?: string;
  whatsappWebhookUrl?: string;
  webhookActive?: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  progress: number; // 0 to 100
  status: 'pending' | 'processing' | 'in_progress' | 'completed';
  updatedAt: string;
  photoNotes?: string;
}

export interface CorporateDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  totalUnits: number;
  retailPrice: string;
  corporatePrice: string;
  discountPercent: number;
  keyFeatures: string[];
  status: 'available' | 'sold';
  createdAt: string;
  digitalSignature?: DigitalSignature;
  governorate?: string;
}

export interface DigitalSignature {
  dataUrl: string;
  signedAt: string;
  signerName: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  propertyId?: string;
  serviceId?: string;
  departmentId?: string;
  serviceTitle?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  userId: string;
  emailReminder?: boolean;
  whatsappReminder?: boolean;
  clientPhone?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
  archived?: boolean;
  paymentMethod?: 'usd' | 'syp' | 'syriatel_cash' | 'bank' | 'free';
  syriatelSenderPhone?: string;
  syriatelTxId?: string;
  bankSenderName?: string;
  bankTxId?: string;
  bankNameFrom?: string;
  createdAt?: string;
  subTasks?: SubTask[];
  preferredBrokerId?: string;
  preferredBrokerName?: string;
  isCorporateTour?: boolean;
  companyName?: string;
  representativeName?: string;
  representativeRole?: string;
  corporateDealId?: string;
  corporateDealTitle?: string;
  sixHourManualReminder?: boolean;
  sixHourReminderSent?: boolean;
  sixHourReminderSentAt?: string;
  isSubTaskSchedule?: boolean;
  digitalSignature?: DigitalSignature;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  feedback: string;
  createdAt: string;
}

export interface Inquiry {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  status: 'unread' | 'read';
  type: 'appointment_accepted' | 'general' | 'property_alert' | 'price_drop' | 'broker_task' | 'system' | 'favorite_update' | string;
  appointmentId?: string;
  propertyId?: string;
  linkUrl?: string;
  createdAt: string;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'team';
  text: string;
  createdAt: string;
}

export interface SupportChat {
  id: string; // Typically the user's uid or a session ID
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  lastMessage: string;
  lastActive: string;
  status: 'open' | 'resolved';
  messages: SupportChatMessage[];
  tag?: string | null;
}

export interface BrokerTask {
  id: string;
  title: string;
  status: 'in_progress' | 'completed' | 'disabled';
  notes?: string;
  createdAt: string;
  completedAt?: string;
  appointmentId?: string;
  appointmentTitle?: string;
  appointmentDate?: string;
  dueDate?: string;
  dueTime?: string;
  workPhotos?: string[];
  categoryId?: string;
  reviewRequired?: boolean;
  reviewNotes?: string;
  reviewRequestedAt?: string;
  flaggedPhotos?: string[];
  departmentId?: string;
  departmentName?: string;
  subDepartmentId?: string;
  subDepartmentName?: string;
}

export interface Broker {
  id: string;
  name: string;
  phone: string;
  email: string;
  commissionRate: number; // e.g. 2.5%
  dealsCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  rating?: number;
  stars?: number;
  type?: 'broker' | 'sales_rep';
  specialties?: string[];
  features?: string[];
  recentReview?: string;
  governorate?: string;
  region?: string;
  subDistrict?: string;
  tasks?: BrokerTask[];
  avatarUrl?: string;
}

export interface PriceUpdateLog {
  id: string;
  propertyId: string;
  propertyTitle: string;
  governorate: string;
  oldPrice: number;
  newPrice: number;
  updatedAt: string;
}

export interface PropertyStatusLog {
  id: string;
  propertyId: string;
  propertyTitle: string;
  governorate: string;
  oldStatus?: string;
  newStatus: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  type: 'real_estate' | 'service' | 'both';
  createdAt: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface SubDepartment {
  id: string;
  name: string;
  supervisorName: string;
  supervisorPhone: string;
  supervisorEmail?: string;
  description?: string;
  permissions?: string[]; // e.g. ['manage_properties', 'manage_chats', 'finance_access', 'deal_approval', 'leads_followup']
  tasks?: { id: string; title: string; assignedTo: string; status: 'pending' | 'completed'; subCategoryId?: string }[];
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  supervisorName: string;
  supervisorPhone: string;
  supervisorEmail?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  icon?: string;
  subDepartments?: SubDepartment[];
  subCategories?: SubCategory[];
  webhookUrl?: string;
  whatsappWebhookUrl?: string;
  webhookActive?: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'client' | 'broker';
  broker?: string;
  createdAt: string;
  phone?: string;
  alertGovernorates?: string[];
  permissions?: Record<string, boolean>;
  blocked?: boolean;
  blockReason?: string;
  notes?: string;
  notesUpdatedAt?: string;
  notesUpdatedBy?: string;
  emailVerified?: boolean;
  referralCount?: number;
  referralEarnings?: number;
  vipRequestStatus?: 'pending' | 'approved' | 'rejected';
}




