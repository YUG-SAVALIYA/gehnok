export interface GemstoneDetails {
  type: string;
  cut: string;
  carat: number;
  clarity: string;
  color: string;
}

export interface CraftsmanshipStory {
  inspiration: string;
  artisanHours: number;
  techniques: string[];
}

export interface ProductMedia {
  mediaContentType: 'VIDEO' | 'MODEL_3D' | 'EXTERNAL_VIDEO' | 'IMAGE' | string;
  url?: string;
  format?: string;
  embeddedUrl?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  availableForSale: boolean;
  price: number;
  compareAtPrice?: number;
  selectedOptions: { name: string; value: string }[];
  image?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  isVerified: boolean;
}

export interface Product {
  id: string;
  name: string;
  collection: 'Rings' | 'Necklaces' | 'Earrings' | 'Bracelets' | 'Bespoke';
  price: number;
  metal: 'Champagne Gold' | 'Platinum' | 'Rose Gold' | 'Amethyst Purple Gold';
  purity: '18k' | '950 Platinum';
  images: string[];
  description: string;
  descriptionHtml?: string;
  story: string;
  gemstone: GemstoneDetails | null;
  craftsmanship: CraftsmanshipStory;
  certification: string;
  hallmark: string;
  careInstructions: string[];
  deliveryInfo: string;
  returnsInfo: string;
  rating?: number;
  ratingCount?: number;
  variants?: ProductVariant[];
  options?: {
    name: string;
    optionValues: {
      name: string;
      swatch?: { color: string } | null;
    }[];
  }[];
  reviews?: Review[];
  media?: ProductMedia[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedMetal?: string;
  selectedSize?: string;
}

export interface WishlistItem {
  product: Product;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  consultationType: 'Bespoke Design' | 'Private Viewing' | 'Heirloom Restoration' | 'General Inquiry';
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface JournalArticle {
  id: string;
  title: string;
  category: 'Craftsmanship' | 'Lookbook' | 'Heritage' | 'Exhibition';
  date: string;
  readTime: string;
  excerpt: string;
  content: string[];
  image: string;
}

export interface ChatMessage {
  id: string;
  sender: 'client' | 'concierge';
  text: string;
  timestamp: string;
  recommendedProducts?: string[]; // list of product IDs
}
