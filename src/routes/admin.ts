import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAdmin } from '../middleware/auth';
import { DatabaseService } from '../utils/database';

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply admin middleware to all routes
admin.use('*', requireAdmin());

// GET /api/admin/dashboard - Dashboard stats
admin.get('/dashboard', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);

    // Get dashboard statistics
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue
    ] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE status = "active"').first<{count: number}>(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM orders').first<{count: number}>(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').first<{count: number}>(),
      c.env.DB.prepare('SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "paid"').first<{total: number}>()
    ]);

    // Get recent orders
    const recentOrders = await c.env.DB.prepare(`
      SELECT id, order_number, email, total_amount, status, created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    // Get low stock products
    const lowStockProducts = await c.env.DB.prepare(`
      SELECT id, sku, name_en, inventory_quantity, category_id
      FROM products 
      WHERE inventory_quantity < 10 AND status = 'active'
      ORDER BY inventory_quantity ASC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: {
        stats: {
          totalProducts: totalProducts?.count || 0,
          totalOrders: totalOrders?.count || 0,
          totalUsers: totalUsers?.count || 0,
          totalRevenue: totalRevenue?.total || 0
        },
        recentOrders: recentOrders.results,
        lowStockProducts: lowStockProducts.results
      }
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return c.json({
      success: false,
      error: 'Failed to load dashboard'
    }, 500);
  }
});

// GET /api/admin/products - Get all products with admin details
admin.get('/products', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '25');
    const status = c.req.query('status') || 'all';
    
    let query = `
      SELECT 
        p.*,
        c.name_en as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
    `;
    
    const params: any[] = [];
    
    if (status !== 'all') {
      query += ' WHERE p.status = ?';
      params.push(status);
    }
    
    // Count total
    const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{total: number}>();
    const total = countResult?.total || 0;
    
    // Add pagination and sorting
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error loading products:', error);
    return c.json({
      success: false,
      error: 'Failed to load products'
    }, 500);
  }
});

// GET /api/admin/orders - Get all orders with admin details
admin.get('/orders', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '25');
    const status = c.req.query('status') || 'all';
    
    let query = `
      SELECT 
        o.*,
        u.first_name,
        u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
    `;
    
    const params: any[] = [];
    
    if (status !== 'all') {
      query += ' WHERE o.status = ?';
      params.push(status);
    }
    
    // Count total
    const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{total: number}>();
    const total = countResult?.total || 0;
    
    // Add pagination and sorting
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    return c.json({
      success: false,
      error: 'Failed to load orders'
    }, 500);
  }
});

// PUT /api/admin/products/:id - Update product
admin.put('/products/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();
    
    // Build update query dynamically
    const allowedFields = [
      'name_en', 'name_jp', 'description_en', 'description_jp',
      'short_description_en', 'short_description_jp', 'price',
      'compare_price', 'inventory_quantity', 'status', 'is_featured'
    ];
    
    const setClause = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (setClause.length === 0) {
      return c.json({
        success: false,
        error: 'No valid fields to update'
      }, 400);
    }
    
    setClause.push('updated_at = datetime("now")');
    params.push(id);
    
    const query = `UPDATE products SET ${setClause.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...params).run();
    
    return c.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json({
      success: false,
      error: 'Failed to update product'
    }, 500);
  }
});

// PUT /api/admin/orders/:id - Update order status
admin.put('/orders/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { status, paymentStatus, shippingStatus, notes } = await c.req.json();
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (paymentStatus) {
      updates.push('payment_status = ?');
      params.push(paymentStatus);
    }
    
    if (shippingStatus) {
      updates.push('shipping_status = ?');
      params.push(shippingStatus);
      
      // Set shipped_at timestamp if shipping status is 'shipped'
      if (shippingStatus === 'shipped') {
        updates.push('shipped_at = datetime("now")');
      }
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    if (updates.length === 0) {
      return c.json({
        success: false,
        error: 'No valid fields to update'
      }, 400);
    }
    
    updates.push('updated_at = datetime("now")');
    params.push(id);
    
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...params).run();
    
    return c.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return c.json({
      success: false,
      error: 'Failed to update order'
    }, 500);
  }
});

export default admin;