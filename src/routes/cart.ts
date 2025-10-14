import { Hono } from 'hono';
import type { Bindings, Variables, CartSummary } from '../types';
import { DatabaseService } from '../utils/database';
import { generateSessionToken } from '../utils/auth';

const cart = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper function to get or create session token
function getSessionToken(c: any): string {
  const cookieToken = c.req.header('X-Session-Token') || c.req.query('sessionToken');
  
  if (cookieToken) {
    return cookieToken;
  }
  
  // Generate new session token
  return generateSessionToken();
}

// Helper function to calculate cart summary
function calculateCartSummary(items: any[]): CartSummary {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 10000 ? 0 : 800; // Free shipping over ¥10,000
  const discount = 0; // TODO: Implement coupon discounts
  const total = subtotal + tax + shipping - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    tax,
    shipping,
    discount,
    total,
    itemCount
  };
}

// GET /api/cart - Get cart contents
cart.get('/', async (c) => {
  try {
    const sessionToken = getSessionToken(c);
    const db = new DatabaseService(c.env.DB);

    const items = await db.getCartItems(sessionToken);
    const summary = calculateCartSummary(items);

    return c.json({
      success: true,
      data: summary,
      sessionToken
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch cart'
    }, 500);
  }
});

// POST /api/cart/items - Add item to cart
cart.post('/items', async (c) => {
  try {
    const { productId, variantId, quantity = 1 } = await c.req.json();
    
    if (!productId || quantity < 1) {
      return c.json({
        success: false,
        error: 'Invalid product ID or quantity'
      }, 400);
    }

    const sessionToken = getSessionToken(c);
    const db = new DatabaseService(c.env.DB);

    // Check if product exists and is available
    const product = await db.getProduct(productId);
    if (!product) {
      return c.json({
        success: false,
        error: 'Product not found'
      }, 404);
    }

    // Check inventory
    const availableQuantity = variantId 
      ? (product.variants?.find(v => v.id === variantId)?.inventory_quantity || 0)
      : product.inventory_quantity;

    if (availableQuantity < quantity) {
      return c.json({
        success: false,
        error: 'Insufficient inventory'
      }, 400);
    }

    await db.addToCart(sessionToken, productId, variantId, quantity);

    // Get updated cart
    const items = await db.getCartItems(sessionToken);
    const summary = calculateCartSummary(items);

    return c.json({
      success: true,
      message: 'Item added to cart',
      data: summary,
      sessionToken
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return c.json({
      success: false,
      error: 'Failed to add item to cart'
    }, 500);
  }
});

// PUT /api/cart/items/:id - Update cart item quantity
cart.put('/items/:id', async (c) => {
  try {
    const itemId = parseInt(c.req.param('id'));
    const { quantity } = await c.req.json();
    
    if (!itemId || quantity < 0) {
      return c.json({
        success: false,
        error: 'Invalid item ID or quantity'
      }, 400);
    }

    const sessionToken = getSessionToken(c);
    const db = new DatabaseService(c.env.DB);

    if (quantity === 0) {
      await db.removeCartItem(sessionToken, itemId);
    } else {
      await db.updateCartItem(sessionToken, itemId, quantity);
    }

    // Get updated cart
    const items = await db.getCartItems(sessionToken);
    const summary = calculateCartSummary(items);

    return c.json({
      success: true,
      message: 'Cart updated',
      data: summary
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return c.json({
      success: false,
      error: 'Failed to update cart'
    }, 500);
  }
});

// DELETE /api/cart/items/:id - Remove item from cart
cart.delete('/items/:id', async (c) => {
  try {
    const itemId = parseInt(c.req.param('id'));
    
    if (!itemId) {
      return c.json({
        success: false,
        error: 'Invalid item ID'
      }, 400);
    }

    const sessionToken = getSessionToken(c);
    const db = new DatabaseService(c.env.DB);

    await db.removeCartItem(sessionToken, itemId);

    // Get updated cart
    const items = await db.getCartItems(sessionToken);
    const summary = calculateCartSummary(items);

    return c.json({
      success: true,
      message: 'Item removed from cart',
      data: summary
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return c.json({
      success: false,
      error: 'Failed to remove item from cart'
    }, 500);
  }
});

// DELETE /api/cart - Clear cart
cart.delete('/', async (c) => {
  try {
    const sessionToken = getSessionToken(c);
    
    const query = `
      DELETE FROM cart_items 
      WHERE session_id = (
        SELECT id FROM shopping_sessions 
        WHERE session_token = ? AND expires_at > datetime('now')
      )
    `;

    await c.env.DB.prepare(query).bind(sessionToken).run();

    return c.json({
      success: true,
      message: 'Cart cleared',
      data: {
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return c.json({
      success: false,
      error: 'Failed to clear cart'
    }, 500);
  }
});

export default cart;