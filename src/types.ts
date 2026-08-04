export interface MenuItem {
  id: number;
  name: string;
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

