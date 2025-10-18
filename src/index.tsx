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
        <!-- Retro 80s Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
          // Configure Tailwind for Retro 80s Design
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  'retro': ['Orbitron', 'monospace'],
                  'tech': ['Exo 2', 'sans-serif'],
                  'sans': ['Inter', 'system-ui', 'sans-serif']
                },
                colors: {
                  // Retro Neon Colors
                  neon: {
                    pink: '#ff00aa',
                    cyan: '#00ffff',
                    purple: '#8b00ff',
                    green: '#39ff14',
                    yellow: '#ffff00',
                    orange: '#ff6600'
                  },
                  // Dark theme colors
                  dark: {
                    900: '#0a0a0f',
                    800: '#141420',
                    700: '#1e1e2e',
                    600: '#28283c',
                    500: '#32324a',
                    400: '#3c3c58',
                    300: '#464666',
                    200: '#505074',
                    100: '#5a5a82'
                  },
                  primary: {
                    50: '#e6f3ff',
                    100: '#b3d9ff',
                    200: '#80bfff',
                    300: '#4da6ff',
                    400: '#1a8cff',
                    500: '#0073e6',
                    600: '#005cb3',
                    700: '#004580',
                    800: '#002e4d',
                    900: '#00171a'
                  },
                  secondary: {
                    50: '#ffe6f3',
                    100: '#ffb3d9',
                    200: '#ff80bf',
                    300: '#ff4da6',
                    400: '#ff1a8c',
                    500: '#e60073',
                    600: '#b3005c',
                    700: '#800045',
                    800: '#4d002e',
                    900: '#1a0017'
                  }
                },
                boxShadow: {
                  'neon-cyan': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
                  'neon-pink': '0 0 5px #ff00aa, 0 0 10px #ff00aa, 0 0 15px #ff00aa',
                  'neon-purple': '0 0 5px #8b00ff, 0 0 10px #8b00ff, 0 0 15px #8b00ff',
                  'neon-green': '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 15px #39ff14',
                  'retro': '0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,0,170,0.3)',
                  'material': '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)',
                  'material-lg': '0 4px 8px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.12)'
                },
                animation: {
                  'neon-pulse': 'neon-pulse 2s ease-in-out infinite alternate',
                  'retro-slide': 'retro-slide 0.5s ease-out',
                  'glitch': 'glitch 2s infinite'
                }
              }
            }
          }
        </script>
        
        <style>
          /* Retro 80s Animations */
          @keyframes neon-pulse {
            from { text-shadow: 0 0 5px #ff00aa, 0 0 10px #ff00aa, 0 0 15px #ff00aa, 0 0 20px #ff00aa; }
            to { text-shadow: 0 0 10px #ff00aa, 0 0 20px #ff00aa, 0 0 30px #ff00aa, 0 0 40px #ff00aa; }
          }
          
          @keyframes retro-slide {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes glitch {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
          }
          
          /* Retro Background */
          .retro-bg {
            background: linear-gradient(45deg, #0a0a0f 0%, #141420 25%, #1e1e2e 50%, #141420 75%, #0a0a0f 100%);
            background-size: 400% 400%;
            animation: gradient-shift 8s ease infinite;
          }
          
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          /* Grid Pattern Overlay */
          .retro-grid {
            background-image: 
              linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
          }
          
          /* Neon Text Effects */
          .neon-text-cyan {
            color: #00ffff;
            text-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff;
          }
          
          .neon-text-pink {
            color: #ff00aa;
            text-shadow: 0 0 5px #ff00aa, 0 0 10px #ff00aa, 0 0 15px #ff00aa;
          }
          
          .neon-text-green {
            color: #39ff14;
            text-shadow: 0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 15px #39ff14;
          }
          
          /* Retro Cards */
          .retro-card {
            background: linear-gradient(135deg, rgba(20,20,32,0.9) 0%, rgba(30,30,46,0.9) 100%);
            border: 2px solid #00ffff;
            border-radius: 0px;
            box-shadow: 0 0 20px rgba(0,255,255,0.3), inset 0 0 20px rgba(0,0,0,0.5);
            transition: all 0.3s ease;
          }
          
          .retro-card:hover {
            border-color: #ff00aa;
            box-shadow: 0 0 30px rgba(255,0,170,0.5), inset 0 0 20px rgba(0,0,0,0.5);
            transform: translateY(-5px);
          }
          
          /* Retro Buttons */
          .btn-neon {
            background: linear-gradient(45deg, rgba(0,255,255,0.1) 0%, rgba(255,0,170,0.1) 100%);
            border: 2px solid #00ffff;
            color: #00ffff;
            font-family: 'Orbitron', monospace;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 12px 24px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .btn-neon:hover {
            background: linear-gradient(45deg, rgba(0,255,255,0.2) 0%, rgba(255,0,170,0.2) 100%);
            border-color: #ff00aa;
            color: #ff00aa;
            box-shadow: 0 0 20px rgba(255,0,170,0.4);
            transform: translateY(-2px);
          }
          
          .btn-neon::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .btn-neon:hover::before {
            left: 100%;
          }
          
          /* Retro Input Fields */
          .input-retro {
            background: rgba(10,10,15,0.8);
            border: 2px solid #00ffff;
            color: #00ffff;
            font-family: 'Exo 2', sans-serif;
            padding: 12px 16px;
            transition: all 0.3s ease;
          }
          
          .input-retro:focus {
            border-color: #ff00aa;
            box-shadow: 0 0 15px rgba(255,0,170,0.3);
            outline: none;
          }
          
          .input-retro::placeholder {
            color: rgba(0,255,255,0.5);
          }
          
          /* Scanlines Effect */
          .scanlines::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(transparent 50%, rgba(0,255,255,0.03) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            animation: scanlines 0.1s linear infinite;
          }
          
          @keyframes scanlines {
            0% { background-position: 0 0; }
            100% { background-position: 0 4px; }
          }
          
          /* Compatibility - Keep existing classes for admin/other pages */
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
    <body class="retro-bg retro-grid font-tech min-h-screen relative scanlines">
        <!-- Navigation -->
        <nav class="bg-dark-800 bg-opacity-90 shadow-neon-cyan sticky top-0 z-50 border-b-2 border-neon-cyan backdrop-blur-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 id="logoLink" class="text-3xl font-retro font-black neon-text-cyan cursor-pointer hover:animate-neon-pulse transition-all duration-300 transform hover:scale-105">
                                <i class="fas fa-microchip mr-3 text-neon-pink animate-pulse"></i>
                                RETRO TECH
                            </h1>
                        </div>
                    </div>
                    
                    <!-- Search -->
                    <div class="hidden md:block flex-1 max-w-lg mx-8">
                        <div class="relative">
                            <input type="text" id="searchInput" placeholder="${t('SEARCH COMPONENTS...')}" 
                                   class="input-retro w-full pl-12 pr-4 bg-dark-700 font-retro text-sm uppercase tracking-wider">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i class="fas fa-search neon-text-cyan text-lg"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Navigation items -->
                    <div class="flex items-center space-x-6">
                        <!-- Language Toggle -->
                        <div class="relative">
                            <select id="languageSelect" class="bg-dark-700 border-2 border-neon-cyan text-neon-cyan font-retro text-sm font-bold px-3 py-2 cursor-pointer focus:border-neon-pink focus:text-neon-pink transition-all duration-300">
                                <option value="en" ${lang === 'en' ? 'selected' : ''} class="bg-dark-800">EN</option>
                                <option value="jp" ${lang === 'jp' ? 'selected' : ''} class="bg-dark-800">JP</option>
                            </select>
                        </div>
                        
                        <!-- Cart -->
                        <div class="relative">
                            <button id="cartBtn" class="neon-text-cyan hover:neon-text-pink relative transition-all duration-300 transform hover:scale-110">
                                <i class="fas fa-shopping-cart text-2xl"></i>
                                <span id="cartCount" class="absolute -top-2 -right-2 bg-neon-pink text-dark-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center hidden min-w-6 animate-pulse font-retro">0</span>
                            </button>
                        </div>
                        
                        <!-- Account -->
                        <div class="relative" id="accountContainer">
                            <button id="accountBtn" class="neon-text-cyan hover:neon-text-pink flex items-center space-x-3 transition-all duration-300 transform hover:scale-105">
                                <div id="userAvatar" class="w-10 h-10 border-2 border-neon-cyan bg-dark-700 hidden items-center justify-center text-sm font-medium neon-text-cyan">
                                    <i class="fas fa-user"></i>
                                </div>
                                <i id="defaultUserIcon" class="fas fa-user text-2xl"></i>
                                <i class="fas fa-chevron-down text-sm"></i>
                            </button>
                            
                            <!-- User Dropdown Menu -->
                            <div id="userDropdown" class="absolute right-0 top-full mt-3 w-72 bg-dark-800 border-2 border-neon-cyan shadow-neon-cyan hidden z-50">
                                <!-- Not logged in state -->
                                <div id="notLoggedInState" class="p-6">
                                    <div class="text-center mb-6">
                                        <i class="fas fa-user-circle text-5xl neon-text-pink mb-3"></i>
                                        <p class="text-sm neon-text-cyan font-retro uppercase tracking-wider">${t('SYSTEM LOGIN REQUIRED')}</p>
                                    </div>
                                    
                                    <!-- Google Sign In Button -->
                                    <div id="g_id_onload"
                                         data-client_id="YOUR_GOOGLE_CLIENT_ID"
                                         data-context="signin"
                                         data-ux_mode="popup"
                                         data-callback="handleGoogleLogin"
                                         data-auto_prompt="false">
                                    </div>
                                    
                                    <div class="g_id_signin mb-4"
                                         data-type="standard"
                                         data-shape="rectangular"
                                         data-theme="outline"
                                         data-text="signin_with"
                                         data-size="large"
                                         data-logo_alignment="left">
                                    </div>
                                    
                                    <div class="text-center text-xs neon-text-green mb-4 font-retro">${t('// OR //')}</div>
                                    
                                    <!-- Quick Login for Demo -->
                                    <button id="demoLoginBtn" class="w-full btn-neon text-xs py-3 mb-3">
                                        <i class="fas fa-user-check mr-2"></i>
                                        ${t('QUICK ACCESS')}
                                    </button>
                                    
                                    <div class="flex space-x-2">
                                        <button id="showLoginForm" class="flex-1 btn-neon text-xs py-2">
                                            ${t('LOGIN')}
                                        </button>
                                        <button id="showRegisterForm" class="flex-1 btn-neon text-xs py-2">
                                            ${t('REGISTER')}
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Logged in state -->
                                <div id="loggedInState" class="hidden">
                                    <div class="px-6 py-4 border-b-2 border-neon-cyan">
                                        <div class="flex items-center space-x-4">
                                            <div id="loggedInAvatar" class="w-12 h-12 border-2 border-neon-pink bg-dark-700 flex items-center justify-center">
                                                <i class="fas fa-user neon-text-pink"></i>
                                            </div>
                                            <div>
                                                <div id="userName" class="font-retro font-bold neon-text-cyan">User Name</div>
                                                <div id="userEmail" class="text-xs neon-text-green font-mono">user@example.com</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="py-3">
                                        <button id="profileBtn" class="w-full text-left px-6 py-3 text-sm neon-text-cyan hover:bg-dark-700 hover:neon-text-pink flex items-center transition-all duration-300 font-retro">
                                            <i class="fas fa-user-cog mr-4 w-4"></i>
                                            ${t('ACCOUNT SETTINGS')}
                                        </button>
                                        <button onclick="app.navigateTo('/orders')" class="w-full text-left px-6 py-3 text-sm neon-text-cyan hover:bg-dark-700 hover:neon-text-pink flex items-center transition-all duration-300 font-retro">
                                            <i class="fas fa-box mr-4 w-4"></i>
                                            ${t('MY ORDERS')}
                                        </button>
                                        <button id="wishlistBtn" class="w-full text-left px-6 py-3 text-sm neon-text-cyan hover:bg-dark-700 hover:neon-text-pink flex items-center transition-all duration-300 font-retro">
                                            <i class="fas fa-heart mr-4 w-4"></i>
                                            ${t('WISHLIST')}
                                        </button>
                                        <div class="border-t-2 border-neon-cyan my-2 mx-6"></div>
                                        <button id="logoutBtn" class="w-full text-left px-6 py-3 text-sm neon-text-green hover:bg-dark-700 hover:neon-text-pink flex items-center transition-all duration-300 font-retro">
                                            <i class="fas fa-sign-out-alt mr-4 w-4"></i>
                                            ${t('SIGN OUT')}
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
        <main id="app" class="min-h-screen relative">
            <!-- Loading indicator -->
            <div id="loading" class="flex justify-center items-center py-20">
                <div class="retro-loader">
                    <div class="neon-text-cyan font-retro text-lg animate-neon-pulse">LOADING SYSTEM...</div>
                    <div class="mt-4 w-32 h-2 bg-dark-700 border-2 border-neon-cyan">
                        <div class="h-full bg-gradient-to-r from-neon-cyan to-neon-pink animate-pulse"></div>
                    </div>
                </div>
            </div>
        </main>
        
        <!-- Footer -->
        <footer class="bg-dark-900 border-t-2 border-neon-cyan py-16 mt-20 relative">
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-dark-800 opacity-50"></div>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-xl font-retro font-bold neon-text-cyan mb-6">RETRO TECH</h3>
                        <p class="text-neon-green text-sm font-tech">${t('Your gateway to high-performance retro computing components.')}</p>
                    </div>
                    <div>
                        <h4 class="text-md font-retro font-bold neon-text-pink mb-6">${t('CATEGORIES')}</h4>
                        <ul class="space-y-3 text-neon-cyan font-tech text-sm">
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Processors')}</a></li>
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Graphics Cards')}</a></li>
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Motherboards')}</a></li>
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Memory')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-md font-retro font-bold neon-text-pink mb-6">${t('SUPPORT')}</h4>
                        <ul class="space-y-3 text-neon-cyan font-tech text-sm">
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Help Center')}</a></li>
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Returns')}</a></li>
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Shipping')}</a></li>
                            <li><a href="#" class="hover:neon-text-pink transition-all duration-300">${t('>> Contact Us')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-md font-retro font-bold neon-text-pink mb-6">${t('CONNECT')}</h4>
                        <div class="flex space-x-6">
                            <a href="#" class="neon-text-cyan hover:neon-text-pink transition-all duration-300 transform hover:scale-110">
                                <i class="fab fa-facebook text-2xl"></i>
                            </a>
                            <a href="#" class="neon-text-cyan hover:neon-text-pink transition-all duration-300 transform hover:scale-110">
                                <i class="fab fa-twitter text-2xl"></i>
                            </a>
                            <a href="#" class="neon-text-cyan hover:neon-text-pink transition-all duration-300 transform hover:scale-110">
                                <i class="fab fa-instagram text-2xl"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="border-t-2 border-neon-cyan mt-12 pt-8 text-center">
                    <p class="font-retro text-sm neon-text-green">© 2024 RETRO TECH SYSTEMS. ${t('ALL RIGHTS RESERVED.')} // POWERED BY NEON TECHNOLOGY</p>
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
