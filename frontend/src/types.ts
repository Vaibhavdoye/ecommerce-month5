
export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  _id?: string;
  name: string;
  email?: string;
}

export interface Order {
  _id?: string;
  [key: string]: unknown;
}