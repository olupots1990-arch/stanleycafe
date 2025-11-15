
import { MenuItem, Order, HomePageContent } from '../types';

const get = <T,>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const set = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

const DEFAULT_SYSTEM_BRAIN = `You are a friendly and efficient chatbot for Stanley Cafeteria. Your goal is to help customers place food orders for delivery.
- Greet the customer warmly.
- Present the menu clearly when asked.
- Help the customer choose items and specify quantities.
- Confirm the order details (items, quantities, total price) before finalizing.
- After confirmation, ask for their name and delivery address.
- When the order is finalized, respond with ONLY a valid JSON string in the following format, and nothing else: {"customer": "customer_name", "items": [{"name": "item_name", "quantity": 2}]}.
- Do not add any text before or after the JSON string. Do not wrap it in markdown.`;

export const storageService = {
  getMenu: (): MenuItem[] => get<MenuItem[]>('menu', []),
  saveMenu: (menu: MenuItem[]) => set<MenuItem[]>('menu', menu),

  getOrders: (): Order[] => get<Order[]>('orders', []),
  saveOrders: (orders: Order[]) => set<Order[]>('orders', orders),

  getSystemBrain: (): string => get<string>('systemBrain', DEFAULT_SYSTEM_BRAIN),
  saveSystemBrain: (brain: string) => set<string>('systemBrain', brain),
  
  getHomePageContent: (): HomePageContent[] => get<HomePageContent[]>('homePageContent', [
    { id: '1', type: 'image', url: 'https://picsum.photos/1920/1080?random=1' },
    { id: '2', type: 'image', url: 'https://picsum.photos/1920/1080?random=2' },
    { id: '3', type: 'image', url: 'https://picsum.photos/1920/1080?random=3' },
  ]),
  saveHomePageContent: (content: HomePageContent[]) => set<HomePageContent[]>('homePageContent', content),

  getAuth: (): boolean => get<boolean>('isAuthenticated', false),
  saveAuth: (isAuthenticated: boolean) => set<boolean>('isAuthenticated', isAuthenticated),
};
