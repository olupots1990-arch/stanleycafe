
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export enum OrderStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: string; // Simulates customer's WhatsApp name/number
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface HomePageContent {
  id: string;
  type: 'image' | 'video';
  url: string; // base64 or external url
  voiceover?: string; // base64 audio data
}
