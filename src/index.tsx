import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings, Variables } from './types';

// Import routes
import products from './routes/products';
import categories from './routes/categories';
import brands from './routes/brands';
import cart from './routes/cart';
import auth from './routes/auth';
import admin from './routes/admin';
import orders from './routes/orders';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { i18nMiddleware } from './middleware/i18n';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));

app.use('*', i18nMiddleware);
app.use('*', authMiddleware);

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API routes
app.route('/api/products', products);
app.route('/api/categories', categories);
app.route('/api/brands', brands);
app.route('/api/cart', cart);
app.route('/api/auth', auth);
app.route('/api/admin', admin);
app.route('/api/orders', orders);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'PC Parts Shop API is running',
    timestamp: new Date().toISOString()
  });
});

// Main frontend route
app.get('*', (c) => {
  const lang = c.get('lang') || 'en';
  const t = c.get('t') || ((key: string) => key);
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="${lang}" data-theme="light">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t('PC Parts Shop')} - ${t('High Performance Computer Components')}</title>
        
        <!-- Meta tags -->
        <meta name="description" content="${t('Professional PC parts and components store. High-performance CPUs, GPUs, motherboards, memory, and more.')}">
        <meta name="keywords" content="PC parts, computer components, CPU, GPU, motherboard, memory, SSD, gaming">
        
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Material Icons -->
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- FontAwesome Icons -->
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Chart.js for admin dashboard -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        
        <!-- HTTP Client -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        <!-- Google OAuth -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        
        <!-- Custom styles -->
        <link href="/static/styles.css" rel="stylesheet">
        
        <script>
          // Configure Tailwind for Material Design
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  'sans': ['Inter', 'system-ui', 'sans-serif']
                },
                colors: {
                  primary: {
                    50: '#e3f2fd',
                    100: '#bbdefb',
                    200: '#90caf9',
                    300: '#64b5f6',
                    400: '#42a5f5',
                    500: '#2196f3',
                    600: '#1e88e5',
                    700: '#1976d2',
                    800: '#1565c0',
                    900: '#0d47a1'
                  },
                  secondary: {
                    50: '#fce4ec',
                    100: '#f8bbd9',
                    200: '#f48fb1',
                    300: '#f06292',
                    400: '#ec407a',
                    500: '#e91e63',
                    600: '#d81b60',
                    700: '#c2185b',
                    800: '#ad1457',
                    900: '#880e4f'
                  }
                },
                boxShadow: {
                  'material': '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)',
                  'material-lg': '0 4px 8px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.12)'
                }
              }
            }
          }
        </script>
        
        <style>
          .material-card {
            @apply bg-white rounded-lg shadow-material transition-all duration-200 hover:shadow-material-lg;
          }
          
          .btn-primary {
            @apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
          }
          
          .btn-secondary {
            @apply bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200;
          }
          
          .input-field {
            @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200;
          }
        </style>
    </head>
    <body class="bg-gray-50 font-sans">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 id="logoLink" class="text-2xl font-bold text-primary-600 cursor-pointer hover:text-primary-700 transition-colors duration-200">
                                <i class="fas fa-microchip mr-2 transition-transform duration-200 hover:rotate-12"></i>
                                PC Parts Shop
                            </h1>
                        </div>
                    </div>
                    
                    <!-- Search -->
                    <div class="hidden md:block flex-1 max-w-lg mx-8">
                        <div class="relative">
                            <input type="text" id="searchInput" placeholder="${t('Search products...')}" 
                                   class="input-field pl-10 pr-4">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-search text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Navigation items -->
                    <div class="flex items-center space-x-4">
                        <!-- Language Toggle -->
                        <div class="relative">
                            <select id="languageSelect" class="bg-transparent border-0 text-sm font-medium cursor-pointer">
                                <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
                                <option value="jp" ${lang === 'jp' ? 'selected' : ''}>JP</option>
                            </select>
                        </div>
                        
                        <!-- Cart -->
                        <div class="relative">
                            <button id="cartBtn" class="text-gray-600 hover:text-primary-600 relative">
                                <i class="fas fa-shopping-cart text-xl"></i>
                                <span id="cartCount" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center hidden min-w-5 animate-pulse">0</span>
                            </button>
                        </div>
                        
                        <!-- Account -->
                        <div class="relative" id="accountContainer">
                            <button id="accountBtn" class="text-gray-600 hover:text-primary-600 flex items-center space-x-2">
                                <div id="userAvatar" class="w-8 h-8 rounded-full bg-gray-300 hidden items-center justify-center text-sm font-medium text-gray-600">
                                    <i class="fas fa-user"></i>
                                </div>
                                <i id="defaultUserIcon" class="fas fa-user text-xl"></i>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </button>
                            
                            <!-- User Dropdown Menu -->
                            <div id="userDropdown" class="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-50">
                                <!-- Not logged in state -->
                                <div id="notLoggedInState" class="p-4">
                                    <div class="text-center mb-4">
                                        <i class="fas fa-user-circle text-4xl text-gray-400 mb-2"></i>
                                        <p class="text-sm text-gray-600">${t('Sign in to your account')}</p>
                                    </div>
                                    
                                    <!-- Google Sign In Button -->
                                    <div id="g_id_onload"
                                         data-client_id="YOUR_GOOGLE_CLIENT_ID"
                                         data-context="signin"
                                         data-ux_mode="popup"
                                         data-callback="handleGoogleLogin"
                                         data-auto_prompt="false">
                                    </div>
                                    
                                    <div class="g_id_signin mb-3"
                                         data-type="standard"
                                         data-shape="rectangular"
                                         data-theme="outline"
                                         data-text="signin_with"
                                         data-size="large"
                                         data-logo_alignment="left">
                                    </div>
                                    
                                    <div class="text-center text-sm text-gray-500 mb-3">${t('or')}</div>
                                    
                                    <!-- Quick Login for Demo -->
                                    <button id="demoLoginBtn" class="w-full btn-primary text-sm py-2 mb-2">
                                        <i class="fas fa-user-check mr-2"></i>
                                        ${t('Quick Demo Login')}
                                    </button>
                                    
                                    <div class="flex space-x-2">
                                        <button id="showLoginForm" class="flex-1 btn-secondary text-xs py-1">
                                            ${t('Sign In')}
                                        </button>
                                        <button id="showRegisterForm" class="flex-1 btn-secondary text-xs py-1">
                                            ${t('Register')}
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Logged in state -->
                                <div id="loggedInState" class="hidden">
                                    <div class="px-4 py-3 border-b border-gray-200">
                                        <div class="flex items-center space-x-3">
                                            <div id="loggedInAvatar" class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                <i class="fas fa-user text-primary-600"></i>
                                            </div>
                                            <div>
                                                <div id="userName" class="font-medium text-gray-900">User Name</div>
                                                <div id="userEmail" class="text-sm text-gray-600">user@example.com</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="py-2">
                                        <button id="profileBtn" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <i class="fas fa-user-cog mr-3 w-4"></i>
                                            ${t('Account Settings')}
                                        </button>
                                        <button onclick="app.navigateTo('/orders')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <i class="fas fa-box mr-3 w-4"></i>
                                            ${t('My Orders')}
                                        </button>
                                        <button id="wishlistBtn" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <i class="fas fa-heart mr-3 w-4"></i>
                                            ${t('Wishlist')}
                                        </button>
                                        <div class="border-t border-gray-200 my-2"></div>
                                        <button id="logoutBtn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                            <i class="fas fa-sign-out-alt mr-3 w-4"></i>
                                            ${t('Sign Out')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main id="app" class="min-h-screen">
            <!-- Loading indicator -->
            <div id="loading" class="flex justify-center items-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        </main>
        
        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-12 mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-lg font-semibold mb-4">PC Parts Shop</h3>
                        <p class="text-gray-300">${t('Your trusted source for high-performance PC components.')}</p>
                    </div>
                    <div>
                        <h4 class="text-md font-semibold mb-4">${t('Categories')}</h4>
                        <ul class="space-y-2 text-gray-300">
                            <li><a href="#" class="hover:text-white">${t('Processors')}</a></li>
                            <li><a href="#" class="hover:text-white">${t('Graphics Cards')}</a></li>
                            <li><a href="#" class="hover:text-white">${t('Motherboards')}</a></li>
                            <li><a href="#" class="hover:text-white">${t('Memory')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-md font-semibold mb-4">${t('Support')}</h4>
                        <ul class="space-y-2 text-gray-300">
                            <li><a href="#" class="hover:text-white">${t('Help Center')}</a></li>
                            <li><a href="#" class="hover:text-white">${t('Returns')}</a></li>
                            <li><a href="#" class="hover:text-white">${t('Shipping')}</a></li>
                            <li><a href="#" class="hover:text-white">${t('Contact Us')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-md font-semibold mb-4">${t('Follow Us')}</h4>
                        <div class="flex space-x-4">
                            <a href="#" class="text-gray-300 hover:text-white">
                                <i class="fab fa-facebook text-xl"></i>
                            </a>
                            <a href="#" class="text-gray-300 hover:text-white">
                                <i class="fab fa-twitter text-xl"></i>
                            </a>
                            <a href="#" class="text-gray-300 hover:text-white">
                                <i class="fab fa-instagram text-xl"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2024 PC Parts Shop. ${t('All rights reserved.')})</p>
                </div>
            </div>
        </footer>
        
        <!-- Scripts -->
        <script>
          // Global app configuration
          window.APP_CONFIG = {
            lang: '${lang}',
            apiBase: '/api',
            currency: '¥'
          };
          
          // Google OAuth callback
          function handleGoogleLogin(response) {
            if (window.app) {
              window.app.handleGoogleLogin(response);
            }
          }
        </script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;
