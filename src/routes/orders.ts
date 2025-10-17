import { Hono } from 'hono';
import type { Bindings, Variables, Order, OrderItem } from '../types';
import { DatabaseService } from '../utils/database';

const orders = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /api/orders - Create new order
orders.post('/', async (c) => {
  try {
    const {
      sessionToken,
      email,
      shipping,
      billing,
      paymentMethod,
      notes
    } = await c.req.json();

    if (!email || !shipping || !paymentMethod) {
      return c.json({
        success: false,
        error: 'Missing required fields'
      }, 400);
    }

    const db = new DatabaseService(c.env.DB);

    // Get cart items
    const cartItems = await db.getCartItems(sessionToken);
    if (!cartItems || cartItems.length === 0) {
      return c.json({
        success: false,
        error: 'Cart is empty'
      }, 400);
    }

    // Calculate order totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.1; // 10% tax
    const shippingAmount = subtotal > 10000 ? 0 : 800; // Free shipping over ¥10,000
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Generate order number
    const orderNumber = 'PC' + Date.now().toString().slice(-8);

    // Get user ID if authenticated
    const user = c.get('user');
    const userId = user?.id || null;

    // Create order
    const orderQuery = `
      INSERT INTO orders (
        order_number, user_id, email, status, payment_status, shipping_status,
        subtotal, tax_amount, shipping_amount, total_amount, currency,
        shipping_first_name, shipping_last_name, shipping_company,
        shipping_address1, shipping_address2, shipping_city, shipping_province,
        shipping_country, shipping_zip, shipping_phone,
        billing_first_name, billing_last_name, billing_company,
        billing_address1, billing_address2, billing_city, billing_province,
        billing_country, billing_zip, billing_phone,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const orderResult = await c.env.DB.prepare(orderQuery).bind(
      orderNumber, userId, email, 'pending', 'pending', 'pending',
      subtotal, taxAmount, shippingAmount, totalAmount, 'JPY',
      shipping.firstName, shipping.lastName, shipping.company || null,
      shipping.address1, shipping.address2 || null, shipping.city, shipping.province || null,
      shipping.country, shipping.zip, shipping.phone || null,
      billing?.firstName || shipping.firstName, billing?.lastName || shipping.lastName, billing?.company || null,
      billing?.address1 || shipping.address1, billing?.address2 || null, billing?.city || shipping.city, billing?.province || null,
      billing?.country || shipping.country, billing?.zip || shipping.zip, billing?.phone || null,
      notes || null
    ).run();

    const orderId = orderResult.meta.last_row_id as number;

    // Create order items
    for (const item of cartItems) {
      const itemQuery = `
        INSERT INTO order_items (
          order_id, product_id, product_variant_id, sku, name,
          quantity, price, total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      await c.env.DB.prepare(itemQuery).bind(
        orderId, item.product_id, item.product_variant_id,
        item.sku, item.name_en, item.quantity, item.price,
        item.price * item.quantity
      ).run();
    }

    // Process payment based on method
    let paymentStatus = 'pending';
    if (paymentMethod === 'cod') {
      paymentStatus = 'cod_pending';
    } else if (paymentMethod === 'credit_card') {
      // Demo payment processing
      paymentStatus = 'completed';
    }

    // Update order payment status
    await c.env.DB.prepare(
      'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?'
    ).bind(paymentStatus, paymentStatus === 'completed' ? 'confirmed' : 'pending', orderId).run();

    // Clear cart
    await db.clearCart(sessionToken);

    // Get the complete order
    const order = await db.getOrderById(orderId);

    return c.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return c.json({
      success: false,
      error: 'Failed to create order'
    }, 500);
  }
});

// GET /api/orders - Get user orders
orders.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    const ordersQuery = `
      SELECT o.*, 
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    const result = await c.env.DB.prepare(ordersQuery).bind(user.id).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return c.json({
      success: false,
      error: 'Failed to get orders'
    }, 500);
  }
});

// GET /api/orders/:id - Get specific order details
orders.get('/:id', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    const db = new DatabaseService(c.env.DB);
    const order = await db.getOrderById(orderId);

    if (!order || order.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'Order not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    return c.json({
      success: false,
      error: 'Failed to get order'
    }, 500);
  }
});

// PUT /api/orders/:id/status - Update order status (for tracking simulation)
orders.put('/:id/status', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const { status, shippingStatus } = await c.req.json();

    const updateQuery = `
      UPDATE orders 
      SET status = ?, shipping_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `;

    await c.env.DB.prepare(updateQuery).bind(status, shippingStatus, orderId).run();

    const db = new DatabaseService(c.env.DB);
    const order = await db.getOrderById(orderId);

    return c.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({
      success: false,
      error: 'Failed to update order status'
    }, 500);
  }
});

export default orders;