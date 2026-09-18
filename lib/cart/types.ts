export interface CartLine {
  materialId: string;
  name: string;
  unit: string;
  category: string;
  catalogPrice: number;
  imageUrl: string | null;
  quantity: number;
}
