export interface ProductUnit {
  satuan: string;
  isi_dalam_satuan_dasar: number;
  price: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  image: string;
  stock_pcs: number;
  cost_price?: number;
  min_stock?: number;
  units: ProductUnit[];
}

export interface CartItem {
  id: number;
  name: string;
  image: string;
  unit: ProductUnit;
  quantity: number;
}

export interface OrderItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_date: string;
  customer_name: string | null;
  total_price: number;
  items: OrderItem[];
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  transactions: number;
  items_sold: number;
  stock_in_pcs: number;
  stock_out_pcs: number;
  gross_profit: number;
}

export interface ProductMonthlyReport {
  month: string;
  sku: string;
  name: string;
  qty_pcs: number;
  revenue: number;
  sell_price: number;
  cost_price: number;
}