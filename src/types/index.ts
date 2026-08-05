export interface ProductUnit {
  satuan: string;
  isi_dalam_satuan_dasar: number;
  price: number;
}

// Ubah dari 'Products' (jamak) menjadi 'Product' (tunggal) agar konsisten dengan pemanggilan di page
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