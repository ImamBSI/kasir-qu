export interface ProductUnitInput {
  satuan: string;
  price: number;
  isi_dalam_satuan_dasar: number;
  cost_price: number;
}

export interface CreateProductInput {
  name: string;
  category: string;
  image: string;
  units: ProductUnitInput[];
}

export interface UpdateProductInput {
  productId: number;
  image: string;
  units: ProductUnitInput[];
}

export interface AddStockInput {
  productId: number;
  quantity: number;
  satuan: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  warning?: string;
}
