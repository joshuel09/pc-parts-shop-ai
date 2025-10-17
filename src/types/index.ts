// Type definitions for PC Parts E-commerce Shop

export interface Bindings {
  DB: D1Database;
}

export interface Variables {}

export interface Category {
  id: number;
  name_en: string;
  name_jp: string;
  slug: string;
  description_en?: string;
  description_jp?: string;
  image_url?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
  website_url?: string;
  description_en?: string;
  description_jp?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name_en: string;
  name_jp: string;
  description_en?: string;
  description_jp?: string;
  short_description_en?: string;
  short_description_jp?: string;
  specifications_json?: string;
  price: number;
  compare_price?: number;
  cost?: number;
  inventory_quantity: number;
  inventory_policy: string;
  weight?: number;
  category_id: number;
  brand_id?: number;
  status: string;
  is_featured: boolean;
  meta_title_en?: string;
  meta_title_jp?: string;
  meta_description_en?: string;
  meta_description_jp?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text_en?: string;
  alt_text_jp?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name_en: string;
  name_jp: string;
  price: number;
  compare_price?: number;
  inventory_quantity: number;
  weight?: number;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  language_preference: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  type: string;
  company?: string;
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
}

export interface ShoppingSession {
  id: number;
  session_token: string;
  user_id?: number;
  expires_at: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  session_id: number;
  product_id: number;
  product_variant_id?: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  email: string;
  status: string;
  payment_status: string;
  shipping_status: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_company?: string;
  shipping_address1?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_country?: string;
  shipping_zip?: string;
  shipping_phone?: string;
  billing_first_name?: string;
  billing_last_name?: string;
  billing_company?: string;
  billing_address1?: string;
  billing_address2?: string;
  billing_city?: string;
  billing_province?: string;
  billing_country?: string;
  billing_zip?: string;
  billing_phone?: string;
  notes?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_variant_id?: number;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id?: number;
  order_id?: number;
  rating: number;
  title?: string;
  comment?: string;
  reviewer_name: string;
  reviewer_email: string;
  is_verified_purchase: boolean;
  is_published: boolean;
  admin_reply?: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  name_en: string;
  name_jp: string;
  type: string;
  value: number;
  minimum_amount: number;
  maximum_discount?: number;
  usage_limit?: number;
  used_count: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  error?: string;
}

// Search and filter types
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

export interface ProductSort {
  field: 'price' | 'name_en' | 'name_jp' | 'created_at' | 'inventory_quantity';
  order: 'asc' | 'desc';
}

// Language context type
export type Language = 'en' | 'jp';

export interface I18nContext {
  lang: Language;
  t: (key: string) => string;
}

// Auth types
export interface AuthUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  language_preference: string;
  avatar?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

// Cart types
export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}