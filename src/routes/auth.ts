import { Hono } from 'hono';
import type { Bindings, Variables, User, AuthUser } from '../types';
import { DatabaseService } from '../utils/database';
import { hashPassword, verifyPassword, createJWT } from '../utils/auth';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

// POST /api/auth/register - Register new user
auth.post('/register', async (c) => {
  try {
    const { email, password, firstName, lastName, phone, languagePreference = 'en' } = await c.req.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return c.json({
        success: false,
        error: 'Missing required fields'
      }, 400);
    }

    if (password.length < 6) {
      return c.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, 400);
    }

    const db = new DatabaseService(c.env.DB);

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return c.json({
        success: false,
        error: 'User already exists'
      }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone,
      role: 'customer',
      is_active: true,
      email_verified: false,
      language_preference: languagePreference,
      last_login_at: undefined
    };

    const userId = await db.createUser(userData);

    // Create JWT token
    const token = await createJWT({
      userId,
      email,
      role: 'customer'
    }, JWT_SECRET);

    const user: AuthUser = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
      language_preference: languagePreference
    };

    return c.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({
      success: false,
      error: 'Registration failed'
    }, 500);
  }
});

// POST /api/auth/login - Login user
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Email and password are required'
      }, 400);
    }

    const db = new DatabaseService(c.env.DB);

    // Get user
    const user = await db.getUserByEmail(email);
    if (!user) {
      return c.json({
        success: false,
        error: 'Invalid email or password'
      }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: 'Invalid email or password'
      }, 401);
    }

    if (!user.is_active) {
      return c.json({
        success: false,
        error: 'Account is deactivated'
      }, 401);
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = datetime("now") WHERE id = ?'
    ).bind(user.id).run();

    // Create JWT token
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    }, JWT_SECRET);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      language_preference: user.language_preference
    };

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: authUser,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: 'Login failed'
    }, 500);
  }
});

// GET /api/auth/me - Get current user info
auth.get('/me', async (c) => {
  try {
    const user = c.get('user') as AuthUser | null;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Not authenticated'
      }, 401);
    }

    return c.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return c.json({
      success: false,
      error: 'Authentication check failed'
    }, 500);
  }
});

// POST /api/auth/google - Google OAuth login
auth.post('/google', async (c) => {
  try {
    const { token, userInfo } = await c.req.json();

    if (!token || !userInfo || !userInfo.email) {
      return c.json({
        success: false,
        error: 'Invalid Google authentication data'
      }, 400);
    }

    const db = new DatabaseService(c.env.DB);
    const { email, name, given_name, family_name, picture } = userInfo;

    // Check if user exists
    let user = await db.getUserByEmail(email);

    if (!user) {
      // Create new user from Google data
      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email,
        password_hash: '', // No password for OAuth users
        first_name: given_name || name?.split(' ')[0] || 'User',
        last_name: family_name || name?.split(' ').slice(1).join(' ') || '',
        phone: null,
        role: 'customer',
        is_active: true,
        email_verified: true, // Google accounts are pre-verified
        language_preference: 'en',
        last_login_at: undefined
      };

      const userId = await db.createUser(userData);
      
      // Get the created user
      user = await db.getUserByEmail(email);
      if (!user) {
        throw new Error('Failed to create user');
      }
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = datetime("now") WHERE id = ?'
    ).bind(user.id).run();

    // Create JWT token
    const jwtToken = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    }, JWT_SECRET);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      language_preference: user.language_preference,
      avatar: picture // Add Google profile picture
    };

    return c.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: authUser,
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    return c.json({
      success: false,
      error: 'Google authentication failed'
    }, 500);
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
auth.post('/logout', async (c) => {
  return c.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default auth;