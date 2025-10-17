import { Hono } from 'hono'
import { createJWT, verifyJWT } from '../utils/auth'
import { authMiddleware } from '../middleware/auth'
import { DatabaseService } from '../utils/database'

const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

const admin = new Hono()

// Admin login with hardcoded credentials
admin.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    // Hardcoded admin credentials
    if (username !== 'admin' || password !== 'admin') {
      return c.json({ success: false, error: 'Invalid credentials' }, 401)
    }

    // Create admin JWT token
    const adminToken = await createJWT({
      userId: 0, // Special ID for admin
      email: 'admin@pcpartsshop.com',
      role: 'admin',
      username: 'admin'
    }, JWT_SECRET)

    return c.json({
      success: true,
      data: {
        user: {
          id: 0,
          username: 'admin',
          email: 'admin@pcpartsshop.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User'
        },
        token: adminToken
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return c.json({ success: false, error: 'Login failed' }, 500)
  }
})

// Middleware to verify admin role
const adminMiddleware = async (c: any, next: any) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No token provided' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token, JWT_SECRET)

    if (payload.role !== 'admin') {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    c.set('user', payload)
    await next()
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401)
  }
}

// ========== PRODUCT MANAGEMENT ==========

// Get all products with pagination
admin.get('/products', adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const search = c.req.query('search') || ''
    const category = c.req.query('category') || ''

    let query = `
      SELECT p.*, 
             COUNT(oi.product_id) as total_orders,
             SUM(oi.quantity) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE 1=1
    `
    
    const params: any[] = []

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    if (category) {
      query += ` AND p.category = ?`
      params.push(category)
    }

    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, (page - 1) * limit)

    const productsResult = await c.env.DB.prepare(query).bind(...params).all()
    const products = productsResult.results

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM products WHERE 1=1`
    const countParams: any[] = []

    if (search) {
      countQuery += ` AND (name LIKE ? OR description LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`)
    }

    if (category) {
      countQuery += ` AND category = ?`
      countParams.push(category)
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()
    const total = countResult?.total || 0

    return c.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get products error:', error)
    return c.json({ success: false, error: 'Failed to fetch products' }, 500)
  }
})

// Get single product
admin.get('/products/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    const query = `
      SELECT p.*, 
             COUNT(oi.product_id) as total_orders,
             SUM(oi.quantity) as total_sold,
             AVG(r.rating) as avg_rating,
             COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `

    const product = await c.env.DB.prepare(query).bind(id).first()

    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404)
    }

    return c.json({ success: true, data: product })
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({ success: false, error: 'Failed to fetch product' }, 500)
  }
})

// Create new product
admin.post('/products', adminMiddleware, async (c) => {
  try {
    const product = await c.req.json()

    const query = `
      INSERT INTO products (name, description, price, stock_quantity, category, brand, image_url, specs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await c.env.DB.prepare(query).bind(
      product.name,
      product.description,
      product.price,
      product.stock_quantity,
      product.category,
      product.brand,
      product.image_url,
      JSON.stringify(product.specs || {})
    ).run()

    return c.json({
      success: true,
      data: {
        id: result.meta?.last_row_id,
        ...product
      }
    })
  } catch (error) {
    console.error('Create product error:', error)
    return c.json({ success: false, error: 'Failed to create product' }, 500)
  }
})

// Update product
admin.put('/products/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const product = await c.req.json()

    const query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock_quantity = ?, 
          category = ?, brand = ?, image_url = ?, specs = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    await c.env.DB.prepare(query).bind(
      product.name,
      product.description,
      product.price,
      product.stock_quantity,
      product.category,
      product.brand,
      product.image_url,
      JSON.stringify(product.specs || {}),
      id
    ).run()

    return c.json({ success: true, data: { id, ...product } })
  } catch (error) {
    console.error('Update product error:', error)
    return c.json({ success: false, error: 'Failed to update product' }, 500)
  }
})

// Delete product
admin.delete('/products/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    // Check if product is in any orders
    const orderCheck = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?'
    ).bind(id).first()

    if (orderCheck?.count > 0) {
      return c.json({
        success: false,
        error: 'Cannot delete product with existing orders'
      }, 400)
    }

    await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()

    return c.json({ success: true, data: { deleted: id } })
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({ success: false, error: 'Failed to delete product' }, 500)
  }
})

// ========== ORDER MANAGEMENT ==========

// Get all orders with pagination
admin.get('/orders', adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const status = c.req.query('status') || ''
    const search = c.req.query('search') || ''

    let query = `
      SELECT o.*, 
             u.first_name, u.last_name, u.email,
             COUNT(oi.id) as item_count,
             SUM(oi.quantity * oi.price) as calculated_total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `
    
    const params: any[] = []

    if (status) {
      query += ` AND o.status = ?`
      params.push(status)
    }

    if (search) {
      query += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += `
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, (page - 1) * limit)

    const ordersResult = await c.env.DB.prepare(query).bind(...params).all()
    const orders = ordersResult.results

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT o.id) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1`
    const countParams: any[] = []

    if (status) {
      countQuery += ` AND o.status = ?`
      countParams.push(status)
    }

    if (search) {
      countQuery += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()
    const total = countResult?.total || 0

    return c.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return c.json({ success: false, error: 'Failed to fetch orders' }, 500)
  }
})

// Get single order with items
admin.get('/orders/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    const orderQuery = `
      SELECT o.*, u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `

    const itemsQuery = `
      SELECT oi.*, p.name_en as name, p.image_url, b.name as brand
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE oi.order_id = ?
    `

    const order = await c.env.DB.prepare(orderQuery).bind(id).first()
    const itemsResult = await c.env.DB.prepare(itemsQuery).bind(id).all()
    const items = itemsResult.results

    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404)
    }

    return c.json({
      success: true,
      data: {
        ...order,
        items
      }
    })
  } catch (error) {
    console.error('Get order error:', error)
    return c.json({ success: false, error: 'Failed to fetch order' }, 500)
  }
})

// Update order status
admin.put('/orders/:id/status', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json()

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: 'Invalid status' }, 400)
    }

    await c.env.DB.prepare(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, id).run()

    return c.json({ success: true, data: { id, status } })
  } catch (error) {
    console.error('Update order status error:', error)
    return c.json({ success: false, error: 'Failed to update order status' }, 500)
  }
})

// ========== USER MANAGEMENT ==========

// Get all users with pagination
admin.get('/users', adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const search = c.req.query('search') || ''
    const role = c.req.query('role') || ''

    let query = `
      SELECT u.*, 
             COUNT(DISTINCT o.id) as order_count,
             SUM(o.total_amount) as total_spent,
             MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE 1=1
    `
    
    const params: any[] = []

    if (search) {
      query += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (role) {
      query += ` AND u.role = ?`
      params.push(role)
    }

    query += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, (page - 1) * limit)

    const usersResult = await c.env.DB.prepare(query).bind(...params).all()
    const users = usersResult.results

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`
    const countParams: any[] = []

    if (search) {
      countQuery += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (role) {
      countQuery += ` AND role = ?`
      countParams.push(role)
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()
    const total = countResult?.total || 0

    return c.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ success: false, error: 'Failed to fetch users' }, 500)
  }
})

// Get single user with order history
admin.get('/users/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    const userQuery = `
      SELECT u.*, 
             COUNT(DISTINCT o.id) as order_count,
             SUM(o.total_amount) as total_spent,
             MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `

    const ordersQuery = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `

    const user = await c.env.DB.prepare(userQuery).bind(id).first()
    const ordersResult = await c.env.DB.prepare(ordersQuery).bind(id).all()
    const orders = ordersResult.results

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    return c.json({
      success: true,
      data: {
        ...user,
        recent_orders: orders
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ success: false, error: 'Failed to fetch user' }, 500)
  }
})

// Update user status (activate/deactivate)
admin.put('/users/:id/status', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const { is_active } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(is_active ? 1 : 0, id).run()

    return c.json({ success: true, data: { id, is_active } })
  } catch (error) {
    console.error('Update user status error:', error)
    return c.json({ success: false, error: 'Failed to update user status' }, 500)
  }
})

// Dashboard statistics
admin.get('/dashboard', adminMiddleware, async (c) => {
  try {
    // Start with simple queries first
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').first()
    const totalProducts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products').first()
    const totalOrders = await c.env.DB.prepare('SELECT COUNT(*) as count FROM orders').first()

    // Check if products have the right column names
    const sampleProduct = await c.env.DB.prepare('SELECT * FROM products LIMIT 1').first()
    console.log('Sample product columns:', Object.keys(sampleProduct || {}))

    // Use correct column names from the database
    const totalRevenue = await c.env.DB.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"').first()
    
    const recentOrders = await c.env.DB.prepare(`
      SELECT o.*, u.first_name, u.last_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `).all()

    // Use correct column name for stock
    const lowStockProducts = await c.env.DB.prepare('SELECT * FROM products WHERE inventory_quantity < 10 ORDER BY inventory_quantity ASC LIMIT 5').all()

    const monthlySales = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at, 'start of month') as month,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= date('now', '-12 months')
      GROUP BY DATE(created_at, 'start of month')
      ORDER BY month DESC
    `).all()

    return c.json({
      success: true,
      data: {
        total_users: totalUsers?.count || 0,
        total_products: totalProducts?.count || 0,
        total_orders: totalOrders?.count || 0,
        total_revenue: totalRevenue?.total || 0,
        recent_orders: recentOrders?.results || [],
        low_stock_products: lowStockProducts?.results || [],
        monthly_sales: monthlySales?.results || []
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return c.json({ success: false, error: 'Failed to fetch dashboard data' }, 500)
  }
})

export default admin