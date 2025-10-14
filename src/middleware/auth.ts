import type { Context, Next } from 'hono';
import type { Bindings, Variables, AuthUser, JWTPayload } from '../types';
import { verifyJWT } from '../utils/auth';

// JWT secret - in production, store this as a secret
const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

export async function authMiddleware(c: Context<{Bindings: Bindings}>, next: Next) {
  const authorization = c.req.header('Authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    c.set('user', null);
    return next();
  }

  const token = authorization.split(' ')[1];
  
  try {
    const payload = await verifyJWT(token, JWT_SECRET);
    
    if (payload) {
      // Get user from database
      const user = await c.env.DB.prepare(
        'SELECT id, email, first_name, last_name, role, language_preference FROM users WHERE id = ? AND is_active = 1'
      ).bind(payload.userId).first<AuthUser>();
      
      c.set('user', user);
    } else {
      c.set('user', null);
    }
  } catch (error) {
    c.set('user', null);
  }

  return next();
}

export function requireAuth(roles?: string[]) {
  return async (c: Context<{Bindings: Bindings}>, next: Next) => {
    const user = c.get('user') as AuthUser | null;
    
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    
    if (roles && !roles.includes(user.role)) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }
    
    return next();
  };
}

export function requireAdmin() {
  return requireAuth(['admin', 'manager']);
}