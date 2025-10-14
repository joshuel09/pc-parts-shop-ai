import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { DatabaseService } from '../utils/database';

const brands = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/brands - Get all brands
brands.get('/', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);

    const brandList = await db.getBrands();

    return c.json({
      success: true,
      data: brandList
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch brands'
    }, 500);
  }
});

export default brands;