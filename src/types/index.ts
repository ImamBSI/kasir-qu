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
  units: ProductUnit[]; 
}

export interface CartItem {
  id: number;
  name: string;
  image: string;
  unit: ProductUnit;
  quantity: number;
}