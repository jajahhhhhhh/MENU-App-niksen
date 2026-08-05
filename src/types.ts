export interface MenuItem {
  id: number;
  name: string;
  name_th?: string | null;
  name_ru?: string | null;
  description?: string | null;
  description_th?: string | null;
  description_ru?: string | null;
  category: string;
  price: number;
  available: boolean;
  image_url?: string;
  barcode?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  status: 'clocked_in' | 'clocked_out';
  current_shift_start?: string;
}

export interface StaffShift {
  id: number;
  staff_id: number;
  staff_name: string;
  role: string;
  clock_in: string;
  clock_out?: string;
  hours_worked?: number;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  points: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  total_spent: number;
  created_at: string;
}

export interface Order {
  id: number;
  table_number: number;
  status: 'open' | 'preparing' | 'ready' | 'paid' | 'cancelled';
  notes?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  member_id?: number;
  member_name?: string;
  points_earned?: number;
  points_redeemed?: number;
  order_type?: 'dine_in' | 'pickup' | 'delivery';
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  created_at: string;
  paid_at?: string;
  total?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  name?: string;
}

export interface DailyReport {
  summary: {
    total_orders: number;
    total_revenue: number;
  };
  categoryBreakdown: {
    category: string;
    revenue: number;
  }[];
  topItems: {
    name: string;
    total_quantity: number;
  }[];
}

