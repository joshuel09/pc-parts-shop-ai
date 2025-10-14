import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { DatabaseService } from '../utils/database';

const categories = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/categories - Get all categories
categories.get('/', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const lang = c.get('lang') || 'en';

    const categoryList = await db.getCategories(lang);

    return c.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch categories'
    }, 500);
  }
});

// GET /api/categories/:slug - Get category by slug
categories.get('/:slug', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);
    const slug = c.req.param('slug');

    const category = await db.getCategory(slug);

    if (!category) {
      return c.json({
        success: false,
        error: 'Category not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch category'
    }, 500);
  }
});

export default categories;