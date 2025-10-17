import type { D1Database } from '@cloudflare/workers-types';
import type { 
  Product, 
  Category, 
  Brand, 
  CartItem, 
  Order, 
  User, 
  ProductFilters,
  ProductSort,
  PaginationInfo,
  Language
} from '../types';

export class DatabaseService {
  constructor(private db: D1Database) {}

  // Product methods
  async getProducts(
    filters: ProductFilters = {}, 
    sort: ProductSort = { field: 'created_at', order: 'desc' },
    page: number = 1,
    limit: number = 20,
    lang: Language = 'en'
  ) {
    let query = `
      SELECT 
        p.*,
        c.name_${lang} as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
    `;

    const params: any[] = [];
    
    if (filters.category) {
      query += ` AND c.slug = ?`;
      params.push(filters.category);
    }
    
    if (filters.brand) {
      query += ` AND b.name = ?`;
      params.push(filters.brand);
    }
    
    if (filters.minPrice) {
      query += ` AND p.price >= ?`;
      params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(filters.maxPrice);
    }
    
    if (filters.inStock) {
      query += ` AND p.inventory_quantity > 0`;
    }
    
    if (filters.featured) {
      query += ` AND p.is_featured = 1`;
    }
    
    if (filters.search) {
      query += ` AND (p.name_${lang} LIKE ? OR p.description_${lang} LIKE ? OR p.sku LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add sorting
    const sortColumn = sort.field === 'name_en' || sort.field === 'name_jp' 
      ? `name_${lang}` 
      : sort.field;
    query += ` ORDER BY p.${sortColumn} ${sort.order.toUpperCase()}`;

    // Count total for pagination
    const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{total: number}>();
    const total = countResult?.total || 0;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db.prepare(query).bind(...params).all();
    
    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return {
      products: result.results as Product[],
      pagination
    };
  }

  async getProduct(id: number, lang: Language = 'en'): Promise<Product | null> {
    const query = `
      SELECT 
        p.*,
        c.name_${lang} as category_name,
        c.slug as category_slug,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ? AND p.status = 'active'
    `;
    
    const result = await this.db.prepare(query).bind(id).first<Product>();
    
    if (!result) return null;

    // Get product images
    const imagesQuery = `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order`;
    const images = await this.db.prepare(imagesQuery).bind(id).all();
    result.images = images.results as any[];

    // Get product variants
    const variantsQuery = `SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY sort_order`;
    const variants = await this.db.prepare(variantsQuery).bind(id).all();
    result.variants = variants.results as any[];

    return result;
  }

  async getFeaturedProducts(limit: number = 8, lang: Language = 'en'): Promise<Product[]> {
    const query = `
      SELECT 
        p.*,
        c.name_${lang} as category_name,
        b.name as brand_name,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active' AND p.is_featured = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;
    
    const result = await this.db.prepare(query).bind(limit).all();
    return result.results as Product[];
  }

  // Category methods
  async getCategories(lang: Language = 'en'): Promise<Category[]> {
    const query = `
      SELECT *,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.id AND status = 'active') as product_count
      FROM categories 
      WHERE is_active = 1 
      ORDER BY sort_order
    `;
    
    const result = await this.db.prepare(query).all();
    return result.results as Category[];
  }

  async getCategory(slug: string): Promise<Category | null> {
    const query = `SELECT * FROM categories WHERE slug = ? AND is_active = 1`;
    const result = await this.db.prepare(query).bind(slug).first<Category>();
    return result || null;
  }

  // Brand methods
  async getBrands(): Promise<Brand[]> {
    const query = `
      SELECT *,
        (SELECT COUNT(*) FROM products WHERE brand_id = brands.id AND status = 'active') as product_count
      FROM brands 
      WHERE is_active = 1 
      ORDER BY name
    `;
    
    const result = await this.db.prepare(query).all();
    return result.results as Brand[];
  }

  // Cart methods
  async getCartItems(sessionToken: string): Promise<CartItem[]> {
    const query = `
      SELECT 
        ci.*,
        p.name_en,
        p.name_jp,
        p.sku,
        p.inventory_quantity,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image_url,
        pv.name_en as variant_name_en,
        pv.name_jp as variant_name_jp
      FROM cart_items ci
      JOIN shopping_sessions ss ON ci.session_id = ss.id
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
      WHERE ss.session_token = ? AND ss.expires_at > datetime('now')
      ORDER BY ci.created_at DESC
    `;
    
    const result = await this.db.prepare(query).bind(sessionToken).all();
    return result.results as CartItem[];
  }

  async addToCart(sessionToken: string, productId: number, variantId?: number, quantity: number = 1): Promise<void> {
    // Get or create session
    let sessionId = await this.getSessionId(sessionToken);
    
    if (!sessionId) {
      sessionId = await this.createSession(sessionToken);
    }

    // Check if item already exists in cart
    const existingQuery = `
      SELECT id, quantity FROM cart_items 
      WHERE session_id = ? AND product_id = ? AND (product_variant_id = ? OR (product_variant_id IS NULL AND ? IS NULL))
    `;
    
    const existing = await this.db.prepare(existingQuery).bind(sessionId, productId, variantId || null, variantId || null).first<{id: number, quantity: number}>();

    // Get product price
    const priceQuery = variantId 
      ? `SELECT price FROM product_variants WHERE id = ?`
      : `SELECT price FROM products WHERE id = ?`;
    
    const priceResult = await this.db.prepare(priceQuery).bind(variantId || productId).first<{price: number}>();
    const price = priceResult?.price || 0;

    if (existing) {
      // Update quantity
      const updateQuery = `UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?`;
      await this.db.prepare(updateQuery).bind(existing.quantity + quantity, existing.id).run();
    } else {
      // Add new item
      const insertQuery = `
        INSERT INTO cart_items (session_id, product_id, product_variant_id, quantity, price, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      await this.db.prepare(insertQuery).bind(sessionId, productId, variantId || null, quantity, price).run();
    }
  }

  async updateCartItem(sessionToken: string, itemId: number, quantity: number): Promise<void> {
    const query = `
      UPDATE cart_items SET quantity = ?, updated_at = datetime('now')
      WHERE id = ? AND session_id = (
        SELECT id FROM shopping_sessions WHERE session_token = ? AND expires_at > datetime('now')
      )
    `;
    
    await this.db.prepare(query).bind(quantity, itemId, sessionToken).run();
  }

  async removeCartItem(sessionToken: string, itemId: number): Promise<void> {
    const query = `
      DELETE FROM cart_items 
      WHERE id = ? AND session_id = (
        SELECT id FROM shopping_sessions WHERE session_token = ? AND expires_at > datetime('now')
      )
    `;
    
    await this.db.prepare(query).bind(itemId, sessionToken).run();
  }

  // Session methods
  private async getSessionId(sessionToken: string): Promise<number | null> {
    const query = `SELECT id FROM shopping_sessions WHERE session_token = ? AND expires_at > datetime('now')`;
    const result = await this.db.prepare(query).bind(sessionToken).first<{id: number}>();
    return result?.id || null;
  }

  private async createSession(sessionToken: string, userId?: number): Promise<number> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    const query = `
      INSERT INTO shopping_sessions (session_token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;
    
    const result = await this.db.prepare(query).bind(sessionToken, userId, expiresAt).run();
    return result.meta.last_row_id as number;
  }

  // User methods
  async getUserByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE email = ?`;
    const result = await this.db.prepare(query).bind(email).first<User>();
    return result || null;
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified, language_preference, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = await this.db.prepare(query).bind(
      user.email,
      user.password_hash,
      user.first_name,
      user.last_name,
      user.phone,
      user.role,
      user.is_active,
      user.email_verified,
      user.language_preference
    ).run();
    
    return result.meta.last_row_id as number;
  }

  // Order methods
  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const query = `
      INSERT INTO orders (
        order_number, user_id, email, status, payment_status, shipping_status,
        subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency,
        shipping_first_name, shipping_last_name, shipping_company, shipping_address1, shipping_address2,
        shipping_city, shipping_province, shipping_country, shipping_zip, shipping_phone,
        billing_first_name, billing_last_name, billing_company, billing_address1, billing_address2,
        billing_city, billing_province, billing_country, billing_zip, billing_phone,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    await this.db.prepare(query).bind(
      orderData.order_number,
      orderData.user_id,
      orderData.email,
      orderData.status,
      orderData.payment_status,
      orderData.shipping_status,
      orderData.subtotal,
      orderData.tax_amount,
      orderData.shipping_amount,
      orderData.discount_amount,
      orderData.total_amount,
      orderData.currency,
      orderData.shipping_first_name,
      orderData.shipping_last_name,
      orderData.shipping_company,
      orderData.shipping_address1,
      orderData.shipping_address2,
      orderData.shipping_city,
      orderData.shipping_province,
      orderData.shipping_country,
      orderData.shipping_zip,
      orderData.shipping_phone,
      orderData.billing_first_name,
      orderData.billing_last_name,
      orderData.billing_company,
      orderData.billing_address1,
      orderData.billing_address2,
      orderData.billing_city,
      orderData.billing_province,
      orderData.billing_country,
      orderData.billing_zip,
      orderData.billing_phone,
      orderData.notes
    ).run();

    return orderData.order_number;
  }

  async getOrders(userId?: number, page: number = 1, limit: number = 20): Promise<{orders: Order[], pagination: PaginationInfo}> {
    let query = `SELECT * FROM orders`;
    const params: any[] = [];
    
    if (userId) {
      query += ` WHERE user_id = ?`;
      params.push(userId);
    }
    
    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{total: number}>();
    const total = countResult?.total || 0;
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const result = await this.db.prepare(query).bind(...params).all();
    
    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return {
      orders: result.results as Order[],
      pagination
    };
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    const orderQuery = `
      SELECT * FROM orders WHERE id = ?
    `;
    
    const order = await this.db.prepare(orderQuery).bind(orderId).first<Order>();
    if (!order) return null;

    // Get order items
    const itemsQuery = `
      SELECT oi.*, p.name_en, p.name_jp, p.sku, pi.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `;

    const itemsResult = await this.db.prepare(itemsQuery).bind(orderId).all();
    order.items = itemsResult.results as OrderItem[];

    return order;
  }

  async clearCart(sessionToken: string): Promise<void> {
    const query = `
      DELETE FROM cart_items 
      WHERE session_id = (
        SELECT id FROM shopping_sessions 
        WHERE session_token = ? AND expires_at > datetime('now')
      )
    `;

    await this.db.prepare(query).bind(sessionToken).run();
  }
}