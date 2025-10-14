import { Hono } from 'hono';
import type { Bindings, Variables, Product, ProductFilters, ProductSort } from '../types';
import { DatabaseService } from '../utils/database';

const products = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/products - Get products with filtering, sorting, and pagination
products.get('/', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const lang = c.get('lang') || 'en';

    // Parse query parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const filters: ProductFilters = {
      category: c.req.query('category') || undefined,
      brand: c.req.query('brand') || undefined,
      minPrice: c.req.query('minPrice') ? parseFloat(c.req.query('minPrice')!) : undefined,
      maxPrice: c.req.query('maxPrice') ? parseFloat(c.req.query('maxPrice')!) : undefined,
      inStock: c.req.query('inStock') === 'true',
      featured: c.req.query('featured') === 'true',
      search: c.req.query('search') || undefined
    };

    const sort: ProductSort = {
      field: (c.req.query('sortBy') || 'created_at') as ProductSort['field'],
      order: (c.req.query('sortOrder') || 'desc') as 'asc' | 'desc'
    };

    const result = await db.getProducts(filters, sort, page, limit, lang);

    return c.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch products'
    }, 500);
  }
});

// GET /api/products/featured - Get featured products
products.get('/featured', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const lang = c.get('lang') || 'en';
    const limit = parseInt(c.req.query('limit') || '8');

    const featuredProducts = await db.getFeaturedProducts(limit, lang);

    return c.json({
      success: true,
      data: featuredProducts
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch featured products'
    }, 500);
  }
});

// GET /api/products/:id - Get single product
products.get('/:id', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const lang = c.get('lang') || 'en';
    const id = parseInt(c.req.param('id'));

    if (!id) {
      return c.json({
        success: false,
        error: 'Invalid product ID'
      }, 400);
    }

    const product = await db.getProduct(id, lang);

    if (!product) {
      return c.json({
        success: false,
        error: 'Product not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch product'
    }, 500);
  }
});

// GET /api/products/:id/reviews - Get product reviews
products.get('/:id/reviews', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    if (!id) {
      return c.json({
        success: false,
        error: 'Invalid product ID'
      }, 400);
    }

    const query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_published = 1
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM reviews 
      WHERE product_id = ? AND is_published = 1
    `;

    const [reviews, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(id, limit, offset).all(),
      c.env.DB.prepare(countQuery).bind(id).first<{ total: number }>()
    ]);

    const total = countResult?.total || 0;

    return c.json({
      success: true,
      data: reviews.results,
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
    console.error('Error fetching product reviews:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch reviews'
    }, 500);
  }
});

export default products;