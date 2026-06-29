export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  registeredAt: string;
  token?: string;
  password?: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerLocation: string;
  brand: string;
  model: string;
  mileage: number; // in km
  year: number; // Baujahr
  fuelType: 'Benzin' | 'Diesel' | 'Elektro' | 'Hybrid';
  transmission: 'Manuell' | 'Automatik';
  price: number; // in €
  description: string;
  images: string[];
  isApproved: boolean;
  status: 'active' | 'sold' | 'inactive';
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  listingId: string;
  listingBrand: string;
  listingModel: string;
  listingPrice: number;
  listingImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount?: {[userId: string]: number};
}

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  pendingApproval: number;
  registrationsByDay: {day: string; count: number}[];
}
