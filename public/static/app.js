// PC Parts Shop - Frontend Application

class PCPartsShop {
  constructor() {
    this.config = window.APP_CONFIG;
    this.currentUser = null;
    this.cart = { items: [], itemCount: 0, total: 0 };
    this.sessionToken = this.getSessionToken();
    this.translations = this.loadTranslations();
    
    // Update language from URL parameters if present
    this.updateLanguageFromURL();
    
    this.init();
  }

  async init() {
    // Initialize axios defaults
    axios.defaults.baseURL = this.config.apiBase;
    axios.defaults.headers.common['X-Session-Token'] = this.sessionToken;
    
    // Set up auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await this.checkAuth();
    }
    
    // Load cart
    await this.loadCart();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up browser back/forward button support
    window.addEventListener('popstate', () => {
      this.route();
    });
    
    // Route to appropriate page
    this.route();
  }

  setupEventListeners() {
    // Logo click handler - navigate to home
    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
      logoLink.addEventListener('click', () => {
        this.navigateToHome();
      });
    }

    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        const newLang = e.target.value;
        this.changeLanguage(newLang);
      });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchProducts(e.target.value);
        }, 500);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchProducts(e.target.value);
        }
      });
    }

    // Cart button
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        this.navigateTo('/cart');
      });
    }

    // Account button
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
      accountBtn.addEventListener('click', () => {
        if (this.currentUser) {
          this.showAccountMenu();
        } else {
          this.showLoginForm();
        }
      });
    }
  }

  route() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path === '/' || path === '/home') {
      this.showHomePage();
    } else if (path === '/products') {
      this.showProductsPage(params);
    } else if (path.startsWith('/product/')) {
      const productId = path.split('/')[2];
      this.showProductPage(productId);
    } else if (path === '/categories') {
      this.showCategoriesPage();
    } else if (path.startsWith('/category/')) {
      const categorySlug = path.split('/')[2];
      this.showCategoryPage(categorySlug, params);
    } else if (path === '/cart') {
      this.showCartPage();
    } else if (path === '/checkout') {
      this.showCheckoutPage();
    } else if (path === '/admin') {
      this.showAdminDashboard();
    } else {
      this.showHomePage();
    }
  }

  async showHomePage() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Hero Section -->
      <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            ${this.t('Build Your Dream PC')}
          </h1>
          <p class="text-xl mb-8 max-w-2xl mx-auto">
            ${this.t('High-performance components from trusted brands. Professional quality, competitive prices.')}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button onclick="app.showProductsPage()" class="btn btn-lg bg-white text-blue-600 hover:bg-gray-100">
              <i class="fas fa-rocket mr-2"></i>
              ${this.t('Shop Now')}
            </button>
            <button onclick="app.showCategoriesPage()" class="btn btn-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600">
              <i class="fas fa-th-large mr-2"></i>
              ${this.t('Browse Categories')}
            </button>
          </div>
        </div>
      </section>

      <!-- Featured Categories -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-4">${this.t('Shop by Category')}</h2>
            <p class="text-gray-600 mb-6">${this.t('Find the perfect components for your build')}</p>
          </div>
          <div id="categoriesGrid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            ${this.renderLoadingSkeleton(8, 'category')}
          </div>
          <div class="text-center mt-8">
            <button onclick="app.showCategoriesPage()" class="btn btn-outline">
              <i class="fas fa-th-large mr-2"></i>
              ${this.t('View All Categories')}
            </button>
          </div>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-center mb-12">${this.t('Featured Products')}</h2>
          <div id="featuredProducts" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${this.renderLoadingSkeleton(8, 'product')}
          </div>
        </div>
      </section>
    `;

    // Load data
    await Promise.all([
      this.loadCategories(),
      this.loadFeaturedProducts()
    ]);
  }

  async showProductsPage(params = new URLSearchParams()) {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">${this.t('All Products')}</h1>
          
          <!-- Filters and Sort -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-lg shadow-sm p-4">
            <div class="flex flex-wrap items-center space-x-4 mb-4 md:mb-0">
              <!-- Category Filter -->
              <select id="categoryFilter" class="form-input">
                <option value="">${this.t('All Categories')}</option>
              </select>
              
              <!-- Brand Filter -->
              <select id="brandFilter" class="form-input">
                <option value="">${this.t('All Brands')}</option>
              </select>
              
              <!-- Price Range -->
              <div class="flex items-center space-x-2">
                <input type="number" id="minPrice" placeholder="${this.t('Min Price')}" class="form-input w-24">
                <span>-</span>
                <input type="number" id="maxPrice" placeholder="${this.t('Max Price')}" class="form-input w-24">
              </div>
              
              <!-- Stock Filter -->
              <label class="flex items-center">
                <input type="checkbox" id="inStockOnly" class="mr-2">
                <span class="text-sm">${this.t('In Stock Only')}</span>
              </label>
            </div>
            
            <!-- Sort -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium">${this.t('Sort by:')}</label>
              <select id="sortSelect" class="form-input">
                <option value="created_at:desc">${this.t('Newest First')}</option>
                <option value="price:asc">${this.t('Price: Low to High')}</option>
                <option value="price:desc">${this.t('Price: High to Low')}</option>
                <option value="name_en:asc">${this.t('Name: A to Z')}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div id="productsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${this.renderLoadingSkeleton(12, 'product')}
        </div>

        <!-- Pagination -->
        <div id="pagination" class="mt-8 flex justify-center"></div>
      </div>
    `;

    // Set up filter event listeners
    this.setupProductFilters();
    
    // Load initial products
    await this.loadProducts(params);
    await this.loadFilterOptions();
  }

  async showProductPage(productId) {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="productDetails">
          ${this.renderLoadingSkeleton(1, 'product-detail')}
        </div>
      </div>
    `;

    try {
      const response = await axios.get(`/products/${productId}`);
      if (response.data.success) {
        this.renderProductDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      this.showError('Failed to load product');
    }
  }

  renderProductDetails(product) {
    const productDetails = document.getElementById('productDetails');
    const name = this.config.lang === 'jp' ? product.name_jp : product.name_en;
    const description = this.config.lang === 'jp' ? product.description_jp : product.description_en;
    const specs = product.specifications_json ? JSON.parse(product.specifications_json) : {};
    
    productDetails.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Product Images -->
        <div class="space-y-4">
          <div class="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
            <img src="${product.images?.[0]?.image_url || '/static/placeholder-product.jpg'}" 
                 alt="${name}" 
                 class="w-full h-full object-center object-cover">
          </div>
          
          <!-- Thumbnail Gallery -->
          <div class="grid grid-cols-4 gap-2">
            ${product.images?.map(img => `
              <img src="${img.image_url}" alt="${name}" 
                   class="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75"
                   onclick="this.parentElement.parentElement.querySelector('img').src='${img.image_url}'">
            `).join('') || ''}
          </div>
        </div>

        <!-- Product Info -->
        <div class="space-y-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">${name}</h1>
            <p class="text-lg text-gray-600 mt-2">SKU: ${product.sku}</p>
            
            ${product.brand_name ? `
              <div class="flex items-center mt-2">
                <span class="text-sm text-gray-500">${this.t('Brand')}:</span>
                <span class="ml-2 font-medium">${product.brand_name}</span>
              </div>
            ` : ''}
          </div>

          <!-- Price -->
          <div class="flex items-center space-x-4">
            <span class="text-3xl font-bold text-gray-900">
              ${this.config.currency}${product.price.toLocaleString()}
            </span>
            ${product.compare_price ? `
              <span class="text-lg text-gray-500 line-through">
                ${this.config.currency}${product.compare_price.toLocaleString()}
              </span>
            ` : ''}
          </div>

          <!-- Stock Status -->
          <div class="flex items-center">
            ${product.inventory_quantity > 0 ? `
              <div class="flex items-center text-green-600">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${this.t('In Stock')} (${product.inventory_quantity} ${this.t('available')})</span>
              </div>
            ` : `
              <div class="flex items-center text-red-600">
                <i class="fas fa-times-circle mr-2"></i>
                <span>${this.t('Out of Stock')}</span>
              </div>
            `}
          </div>

          <!-- Description -->
          <div>
            <h3 class="text-lg font-semibold mb-2">${this.t('Description')}</h3>
            <p class="text-gray-700">${description || this.t('No description available')}</p>
          </div>

          <!-- Specifications -->
          ${Object.keys(specs).length > 0 ? `
            <div>
              <h3 class="text-lg font-semibold mb-2">${this.t('Specifications')}</h3>
              <div class="bg-gray-50 rounded-lg p-4">
                <dl class="grid grid-cols-1 gap-2">
                  ${Object.entries(specs).map(([key, value]) => `
                    <div class="flex justify-between">
                      <dt class="font-medium text-gray-600">${key}:</dt>
                      <dd class="text-gray-900">${value}</dd>
                    </div>
                  `).join('')}
                </dl>
              </div>
            </div>
          ` : ''}

          <!-- Add to Cart -->
          <div class="flex space-x-4">
            <button onclick="app.addToCart(${product.id})" 
                    class="btn btn-primary flex-1" 
                    ${product.inventory_quantity === 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-cart mr-2"></i>
              ${this.t('Add to Cart')}
            </button>
            
            <button class="btn btn-secondary">
              <i class="fas fa-heart mr-2"></i>
              ${this.t('Wishlist')}
            </button>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold mb-6">${this.t('Customer Reviews')}</h2>
        <div id="reviewsSection">
          ${this.renderLoadingSkeleton(3, 'review')}
        </div>
      </div>
    `;

    // Load reviews
    this.loadProductReviews(product.id);
  }

  async showCategoriesPage() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">${this.t('Shop by Category')}</h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            ${this.t('Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.')}
          </p>
        </div>

        <!-- Categories Grid -->
        <div id="allCategoriesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          ${this.renderLoadingSkeleton(8, 'category')}
        </div>

        <!-- Back to Home -->
        <div class="text-center mt-12">
          <button onclick="app.showHomePage()" class="btn btn-secondary">
            <i class="fas fa-arrow-left mr-2"></i>
            ${this.t('Back to Home')}
          </button>
        </div>
      </div>
    `;

    // Load all categories
    await this.loadAllCategories();
  }

  async loadAllCategories() {
    try {
      const response = await axios.get('/categories');
      if (response.data.success) {
        this.renderAllCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading all categories:', error);
      this.showError('Failed to load categories');
    }
  }

  renderAllCategories(categories) {
    const grid = document.getElementById('allCategoriesGrid');
    if (!grid) return;

    // Category icons mapping
    const categoryIcons = {
      'processors': 'fas fa-microchip',
      'graphics-cards': 'fas fa-tv', 
      'motherboards': 'fas fa-memory',
      'memory': 'fas fa-hdd',
      'storage': 'fas fa-save',
      'power-supplies': 'fas fa-bolt',
      'cases': 'fas fa-cube',
      'cooling': 'fas fa-snowflake',
      'peripherals': 'fas fa-keyboard'
    };

    // Category color themes
    const categoryColors = {
      'processors': { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'hover:border-blue-300', gradient: 'from-blue-50 to-blue-100' },
      'graphics-cards': { bg: 'bg-green-100', icon: 'text-green-600', border: 'hover:border-green-300', gradient: 'from-green-50 to-green-100' },
      'motherboards': { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'hover:border-purple-300', gradient: 'from-purple-50 to-purple-100' },
      'memory': { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'hover:border-orange-300', gradient: 'from-orange-50 to-orange-100' },
      'storage': { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'hover:border-indigo-300', gradient: 'from-indigo-50 to-indigo-100' },
      'power-supplies': { bg: 'bg-yellow-100', icon: 'text-yellow-600', border: 'hover:border-yellow-300', gradient: 'from-yellow-50 to-yellow-100' },
      'cases': { bg: 'bg-gray-100', icon: 'text-gray-600', border: 'hover:border-gray-300', gradient: 'from-gray-50 to-gray-100' },
      'cooling': { bg: 'bg-cyan-100', icon: 'text-cyan-600', border: 'hover:border-cyan-300', gradient: 'from-cyan-50 to-cyan-100' },
      'peripherals': { bg: 'bg-pink-100', icon: 'text-pink-600', border: 'hover:border-pink-300', gradient: 'from-pink-50 to-pink-100' }
    };

    grid.innerHTML = categories.map(category => {
      const name = this.config.lang === 'jp' ? category.name_jp : category.name_en;
      const description = this.config.lang === 'jp' ? category.description_jp : category.description_en;
      const icon = categoryIcons[category.slug] || 'fas fa-microchip';
      const colors = categoryColors[category.slug] || { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'hover:border-blue-300', gradient: 'from-blue-50 to-blue-100' };
      
      return `
        <div class="category-card group cursor-pointer transform transition-all duration-500 hover:scale-105" 
             onclick="app.navigateToCategory('${category.slug}')">
          
          <!-- Enhanced Card Container -->
          <div class="material-card h-full border-2 border-transparent ${colors.border} hover:shadow-2xl relative overflow-hidden">
            
            <!-- Background Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Card Content -->
            <div class="relative z-10 p-8 text-center">
              
              <!-- Icon Section with Animation -->
              <div class="w-24 h-24 mx-auto mb-6 ${colors.bg} rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg">
                <i class="${icon} text-4xl ${colors.icon}"></i>
              </div>
              
              <!-- Title -->
              <h3 class="font-bold text-xl mb-3 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                ${name}
              </h3>
              
              <!-- Description -->
              ${description ? `
                <p class="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  ${description}
                </p>
              ` : ''}
              
              <!-- Product Count with Icon -->
              <div class="flex items-center justify-center space-x-2 text-sm font-medium mb-4">
                <i class="fas fa-cube text-gray-400"></i>
                <span class="text-gray-600">
                  ${category.product_count || 0} ${this.t('products')}
                </span>
              </div>
              
              <!-- Action Button -->
              <div class="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <div class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  ${this.t('Browse')}
                  <i class="fas fa-arrow-right ml-2"></i>
                </div>
              </div>
              
            </div>
            
          </div>
        </div>
      `;
    }).join('');
  }

  async loadCategories() {
    try {
      const response = await axios.get('/categories');
      if (response.data.success) {
        this.renderCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  renderCategories(categories) {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    // Category icons mapping
    const categoryIcons = {
      'processors': 'fas fa-microchip',
      'graphics-cards': 'fas fa-tv', 
      'motherboards': 'fas fa-memory',
      'memory': 'fas fa-hdd',
      'storage': 'fas fa-save',
      'power-supplies': 'fas fa-bolt',
      'cases': 'fas fa-cube',
      'cooling': 'fas fa-snowflake',
      'peripherals': 'fas fa-keyboard'
    };

    // Category color themes
    const categoryColors = {
      'processors': { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'hover:border-blue-300' },
      'graphics-cards': { bg: 'bg-green-100', icon: 'text-green-600', border: 'hover:border-green-300' },
      'motherboards': { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'hover:border-purple-300' },
      'memory': { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'hover:border-orange-300' },
      'storage': { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'hover:border-indigo-300' },
      'power-supplies': { bg: 'bg-yellow-100', icon: 'text-yellow-600', border: 'hover:border-yellow-300' },
      'cases': { bg: 'bg-gray-100', icon: 'text-gray-600', border: 'hover:border-gray-300' },
      'cooling': { bg: 'bg-cyan-100', icon: 'text-cyan-600', border: 'hover:border-cyan-300' },
      'peripherals': { bg: 'bg-pink-100', icon: 'text-pink-600', border: 'hover:border-pink-300' }
    };

    grid.innerHTML = categories.map(category => {
      const name = this.config.lang === 'jp' ? category.name_jp : category.name_en;
      const description = this.config.lang === 'jp' ? category.description_jp : category.description_en;
      const icon = categoryIcons[category.slug] || 'fas fa-microchip';
      const colors = categoryColors[category.slug] || { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'hover:border-blue-300' };
      
      return `
        <div class="category-card group cursor-pointer transform transition-all duration-300 hover:scale-105" 
             onclick="app.navigateToCategory('${category.slug}')">
          <!-- Card Container -->
          <div class="material-card p-6 text-center h-full border-2 border-transparent ${colors.border} hover:shadow-xl">
            
            <!-- Icon Section -->
            <div class="w-20 h-20 mx-auto mb-4 ${colors.bg} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i class="${icon} text-3xl ${colors.icon}"></i>
            </div>
            
            <!-- Title -->
            <h3 class="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
              ${name}
            </h3>
            
            <!-- Description -->
            ${description ? `
              <p class="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                ${description}
              </p>
            ` : ''}
            
            <!-- Product Count -->
            <div class="flex items-center justify-center space-x-1 text-xs font-medium">
              <i class="fas fa-cube text-gray-400"></i>
              <span class="text-gray-600">
                ${category.product_count || 0} ${this.t('products')}
              </span>
            </div>
            
            <!-- Hover Arrow -->
            <div class="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <i class="fas fa-arrow-right text-blue-500"></i>
            </div>
            
          </div>
        </div>
      `;
    }).join('');
  }

  async loadFeaturedProducts() {
    try {
      const response = await axios.get('/products/featured');
      if (response.data.success) {
        this.renderFeaturedProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  }

  renderFeaturedProducts(products) {
    const grid = document.getElementById('featuredProducts');
    if (!grid) return;

    grid.innerHTML = products.map(product => this.renderProductCard(product)).join('');
  }

  renderProductCard(product) {
    const name = this.config.lang === 'jp' ? product.name_jp : product.name_en;
    const shortDesc = this.config.lang === 'jp' ? product.short_description_jp : product.short_description_en;
    
    return `
      <div class="product-card relative">
        ${product.is_featured ? '<span class="product-badge badge-featured">Featured</span>' : ''}
        ${product.compare_price ? '<span class="product-badge badge-sale top-2 right-2">Sale</span>' : ''}
        
        <div class="relative cursor-pointer" onclick="app.navigateToProduct(${product.id})">
          <img src="${product.primary_image || '/static/placeholder-product.jpg'}" 
               alt="${name}" 
               class="product-image">
        </div>
        
        <div class="p-4">
          <div class="mb-2">
            <h3 class="font-semibold text-lg leading-tight hover:text-blue-600 cursor-pointer" 
                onclick="app.navigateToProduct(${product.id})"
              ${name}
            </h3>
            ${product.brand_name ? `<p class="text-sm text-gray-600">${product.brand_name}</p>` : ''}
          </div>
          
          ${shortDesc ? `<p class="text-sm text-gray-700 mb-3 line-clamp-2">${shortDesc}</p>` : ''}
          
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg font-bold text-gray-900">
                ${this.config.currency}${product.price.toLocaleString()}
              </span>
              ${product.compare_price ? `
                <span class="text-sm text-gray-500 line-through">
                  ${this.config.currency}${product.compare_price.toLocaleString()}
                </span>
              ` : ''}
            </div>
            
            <span class="text-xs ${product.inventory_quantity > 0 ? 'text-green-600' : 'text-red-600'}">
              ${product.inventory_quantity > 0 ? this.t('In Stock') : this.t('Out of Stock')}
            </span>
          </div>
          
          <button onclick="app.addToCart(${product.id})" 
                  class="btn btn-primary w-full btn-sm" 
                  ${product.inventory_quantity === 0 ? 'disabled' : ''}>
            <i class="fas fa-shopping-cart mr-2"></i>
            ${this.t('Add to Cart')}
          </button>
        </div>
      </div>
    `;
  }

  async addToCart(productId, variantId = null, quantity = 1) {
    try {
      console.log('Adding to cart:', { productId, variantId, quantity });
      console.log('Current session token:', this.sessionToken);
      console.log('Axios headers:', axios.defaults.headers.common);
      
      const response = await axios.post('/cart/items', {
        productId,
        variantId,
        quantity
      });

      console.log('Add to cart response:', response.data);

      if (response.data.success) {
        this.cart = response.data.data;
        this.sessionToken = response.data.sessionToken;
        this.saveSessionToken(this.sessionToken);
        this.updateCartUI();
        this.showNotification(this.t('Added to cart'), 'success');
      } else {
        console.error('Add to cart failed:', response.data);
        this.showNotification(response.data.error || this.t('Failed to add to cart'), 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      this.showNotification(error.response?.data?.error || this.t('Failed to add to cart'), 'error');
    }
  }

  async loadCart() {
    try {
      const response = await axios.get('/cart');
      if (response.data.success) {
        this.cart = response.data.data;
        this.sessionToken = response.data.sessionToken;
        this.saveSessionToken(this.sessionToken);
        this.updateCartUI();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      const itemCount = this.cart.itemCount || 0;
      cartCount.textContent = itemCount;
      
      // Show/hide badge based on item count
      if (itemCount === 0) {
        cartCount.classList.add('hidden');
        cartCount.classList.remove('animate-bounce');
      } else {
        cartCount.classList.remove('hidden');
        // Add bounce animation briefly when items are added
        cartCount.classList.add('animate-bounce');
        setTimeout(() => {
          cartCount.classList.remove('animate-bounce');
        }, 1000);
      }
    }
  }

  showCart() {
    const modal = this.createModal();
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${this.t('Shopping Cart')}</h3>
          <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          ${this.cart.items.length === 0 ? `
            <div class="text-center py-8">
              <i class="fas fa-shopping-cart text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">${this.t('Your cart is empty')}</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${this.cart.items.map(item => this.renderCartItem(item)).join('')}
            </div>
            
            <div class="border-t mt-4 pt-4">
              <div class="flex justify-between items-center mb-2">
                <span>${this.t('Subtotal')}:</span>
                <span>${this.config.currency}${this.cart.subtotal.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span>${this.t('Tax')}:</span>
                <span>${this.config.currency}${this.cart.tax.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span>${this.t('Shipping')}:</span>
                <span>${this.cart.shipping === 0 ? this.t('Free') : this.config.currency + this.cart.shipping.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>${this.t('Total')}:</span>
                <span>${this.config.currency}${this.cart.total.toLocaleString()}</span>
              </div>
            </div>
          `}
        </div>
        
        <div class="modal-footer">
          <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">
            ${this.t('Continue Shopping')}
          </button>
          ${this.cart.items.length > 0 ? `
            <button onclick="app.showCheckoutPage()" class="btn btn-primary">
              ${this.t('Checkout')}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async showCartPage() {
    const app = document.getElementById('app');
    
    // Ensure cart is loaded
    await this.loadCart();
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Breadcrumb -->
        <nav class="mb-8">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" onclick="app.navigateToHome(); return false;" class="hover:text-primary-600">${this.t('Home')}</a>
            <i class="fas fa-chevron-right text-xs"></i>
            <span class="text-gray-900">${this.t('Shopping Cart')}</span>
          </div>
        </nav>

        <!-- Cart Header -->
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-shopping-cart mr-3"></i>
            ${this.t('Shopping Cart')}
          </h1>
          <div class="text-gray-600">
            ${this.cart.itemCount} ${this.t('items')}
          </div>
        </div>

        ${this.cart.items.length === 0 ? `
          <!-- Empty Cart -->
          <div class="text-center py-16">
            <div class="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <i class="fas fa-shopping-cart text-4xl text-gray-400"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">${this.t('Your cart is empty')}</h2>
            <p class="text-gray-600 mb-6">${this.t('Looks like you haven\\'t added any items to your cart yet.')}</p>
            <button onclick="app.navigateToHome()" class="btn-primary inline-flex items-center">
              <i class="fas fa-arrow-left mr-2"></i>
              ${this.t('Continue Shopping')}
            </button>
          </div>
        ` : `
          <!-- Cart Content -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Cart Items -->
            <div class="lg:col-span-2">
              <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b">
                  <h2 class="text-lg font-semibold">${this.t('Cart Items')}</h2>
                </div>
                <div class="p-6">
                  <div class="space-y-6">
                    ${this.cart.items.map(item => this.renderCartPageItem(item)).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-lg shadow-sm sticky top-4">
                <div class="p-6 border-b">
                  <h2 class="text-lg font-semibold">${this.t('Order Summary')}</h2>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div class="flex justify-between">
                      <span>${this.t('Subtotal')} (${this.cart.itemCount} ${this.t('items')}):</span>
                      <span>${this.config.currency}${this.cart.subtotal.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>${this.t('Tax')}:</span>
                      <span>${this.config.currency}${this.cart.tax.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>${this.t('Shipping')}:</span>
                      <span>${this.cart.shipping === 0 ? this.t('Free') : this.config.currency + this.cart.shipping.toLocaleString()}</span>
                    </div>
                    <hr>
                    <div class="flex justify-between text-lg font-semibold">
                      <span>${this.t('Total')}:</span>
                      <span>${this.config.currency}${this.cart.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div class="mt-6 space-y-3">
                    <button onclick="app.navigateTo('/checkout')" class="btn-primary w-full">
                      <i class="fas fa-credit-card mr-2"></i>
                      ${this.t('Proceed to Checkout')}
                    </button>
                    <button onclick="app.navigateToHome()" class="btn-secondary w-full">
                      <i class="fas fa-arrow-left mr-2"></i>
                      ${this.t('Continue Shopping')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  }

  renderCartPageItem(item) {
    const name = this.config.lang === 'jp' ? item.name_jp : item.name_en;
    
    return `
      <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
        <!-- Product Image -->
        <div class="flex-shrink-0">
          <img src="${item.image_url || '/static/placeholder-product.jpg'}" 
               alt="${name}" 
               class="w-20 h-20 object-cover rounded-lg">
        </div>
        
        <!-- Product Info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-medium text-gray-900 truncate">${name}</h3>
          <p class="text-sm text-gray-600">SKU: ${item.sku}</p>
          <p class="text-lg font-semibold text-primary-600">${this.config.currency}${item.price.toLocaleString()}</p>
        </div>
        
        <!-- Quantity Controls -->
        <div class="flex items-center space-x-2">
          <button onclick="app.updateCartItem(${item.id}, ${item.quantity - 1})" 
                  class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                  ${item.quantity <= 1 ? 'disabled' : ''}>
            <i class="fas fa-minus text-xs"></i>
          </button>
          <span class="w-12 text-center font-medium">${item.quantity}</span>
          <button onclick="app.updateCartItem(${item.id}, ${item.quantity + 1})" 
                  class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50">
            <i class="fas fa-plus text-xs"></i>
          </button>
        </div>
        
        <!-- Item Total & Remove -->
        <div class="text-right">
          <p class="text-lg font-semibold text-gray-900">${this.config.currency}${(item.price * item.quantity).toLocaleString()}</p>
          <button onclick="app.removeCartItem(${item.id})" 
                  class="text-red-600 text-sm hover:underline mt-1">
            <i class="fas fa-trash mr-1"></i>${this.t('Remove')}
          </button>
        </div>
      </div>
    `;
  }

  renderCartItem(item) {
    const name = this.config.lang === 'jp' ? item.name_jp : item.name_en;
    
    return `
      <div class="cart-item">
        <img src="${item.image_url || '/static/placeholder-product.jpg'}" 
             alt="${name}" 
             class="cart-item-image">
        
        <div class="cart-item-info">
          <h4 class="cart-item-name">${name}</h4>
          <p class="cart-item-price">${this.config.currency}${item.price.toLocaleString()}</p>
        </div>
        
        <div class="quantity-controls">
          <button onclick="app.updateCartItem(${item.id}, ${item.quantity - 1})" 
                  class="quantity-btn" ${item.quantity <= 1 ? 'disabled' : ''}>
            <i class="fas fa-minus"></i>
          </button>
          <span class="px-3">${item.quantity}</span>
          <button onclick="app.updateCartItem(${item.id}, ${item.quantity + 1})" class="quantity-btn">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        
        <div class="text-right">
          <p class="font-medium">${this.config.currency}${(item.price * item.quantity).toLocaleString()}</p>
          <button onclick="app.removeCartItem(${item.id})" class="text-red-600 text-sm hover:underline">
            <i class="fas fa-trash mr-1"></i>${this.t('Remove')}
          </button>
        </div>
      </div>
    `;
  }

  async updateCartItem(itemId, quantity) {
    try {
      const response = await axios.put(`/cart/items/${itemId}`, { quantity });
      if (response.data.success) {
        this.cart = response.data.data;
        this.updateCartUI();
        
        // Refresh cart page if currently viewing it
        if (window.location.pathname === '/cart') {
          this.showCartPage();
        }
        
        // Refresh cart modal if open
        const cartModal = document.querySelector('.modal-overlay');
        if (cartModal) {
          cartModal.remove();
          this.showCart();
        }
        
        this.showNotification(this.t('Cart updated'), 'success');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      this.showNotification(this.t('Failed to update cart'), 'error');
    }
  }

  async removeCartItem(itemId) {
    try {
      const response = await axios.delete(`/cart/items/${itemId}`);
      if (response.data.success) {
        this.cart = response.data.data;
        this.updateCartUI();
        
        // Refresh cart page if currently viewing it
        if (window.location.pathname === '/cart') {
          this.showCartPage();
        }
        
        // Refresh cart modal if open
        const cartModal = document.querySelector('.modal-overlay');
        if (cartModal) {
          cartModal.remove();
          this.showCart();
        }
        
        this.showNotification(this.t('Item removed from cart'), 'success');
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      this.showNotification(this.t('Failed to remove item'), 'error');
    }
  }

  // Translation and utility methods
  loadTranslations() {
    return {
      en: {
        // Navigation
        'Home': 'Home',
        'Products': 'Products', 
        'Categories': 'Categories',
        'Cart': 'Cart',
        'Search products...': 'Search products...',
        
        // Categories
        'Processors (CPU)': 'Processors (CPU)',
        'Graphics Cards (GPU)': 'Graphics Cards (GPU)', 
        'Motherboards': 'Motherboards',
        'Memory (RAM)': 'Memory (RAM)',
        'Storage': 'Storage',
        'Power Supplies': 'Power Supplies',
        'Cases': 'Cases',
        'Cooling': 'Cooling',
        'Peripherals': 'Peripherals',
        
        // Common
        'products': 'products',
        'Build Your Dream PC': 'Build Your Dream PC',
        'High-performance components from trusted brands. Professional quality, competitive prices.': 'High-performance components from trusted brands. Professional quality, competitive prices.',
        'Shop Now': 'Shop Now',
        'Shop by Category': 'Shop by Category',
        'Featured Products': 'Featured Products',
        'All Products': 'All Products',
        'All Categories': 'All Categories',
        'All Brands': 'All Brands',
        'Min Price': 'Min Price',
        'Max Price': 'Max Price',
        'In Stock Only': 'In Stock Only',
        'Sort by:': 'Sort by:',
        'Newest First': 'Newest First',
        'Price: Low to High': 'Price: Low to High',
        'Price: High to Low': 'Price: High to Low',
        'Name: A to Z': 'Name: A to Z',
        'Add to Cart': 'Add to Cart',
        'In Stock': 'In Stock',
        'Out of Stock': 'Out of Stock',
        'available': 'available',
        'Brand': 'Brand',
        'Description': 'Description',
        'Specifications': 'Specifications',
        'No description available': 'No description available',
        'Wishlist': 'Wishlist',
        'No products found': 'No products found',
        'Try adjusting your filters or search terms': 'Try adjusting your filters or search terms',
        'Showing': 'Showing',
        'of': 'of',
        'results': 'results',
        'Added to cart': 'Added to cart',
        'Failed to add to cart': 'Failed to add to cart',
        'Shopping Cart': 'Shopping Cart',
        'Your cart is empty': 'Your cart is empty',
        'Subtotal': 'Subtotal',
        'Tax': 'Tax',
        'Shipping': 'Shipping',
        'Free': 'Free',
        'Total': 'Total',
        'Continue Shopping': 'Continue Shopping',
        'Checkout': 'Checkout',
        'Remove': 'Remove',
        'Item removed from cart': 'Item removed from cart',
        'Failed to remove item': 'Failed to remove item',
        'Failed to update cart': 'Failed to update cart',
        'Customer Reviews': 'Customer Reviews',
        'Go Home': 'Go Home',
        'Browse': 'Browse',
        'Browse Categories': 'Browse Categories',
        'View All Categories': 'View All Categories',
        'Find the perfect components for your build': 'Find the perfect components for your build',
        'Back to Home': 'Back to Home',
        'Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.': 'Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.'
      },
      jp: {
        // Navigation
        'Home': 'ホーム',
        'Products': '製品',
        'Categories': 'カテゴリー', 
        'Cart': 'カート',
        'Search products...': '製品を検索...',
        
        // Categories
        'Processors (CPU)': 'プロセッサー (CPU)',
        'Graphics Cards (GPU)': 'グラフィックスカード (GPU)',
        'Motherboards': 'マザーボード',
        'Memory (RAM)': 'メモリ (RAM)',
        'Storage': 'ストレージ',
        'Power Supplies': '電源ユニット',
        'Cases': 'PCケース',
        'Cooling': '冷却システム',
        'Peripherals': '周辺機器',
        
        // Common
        'products': '製品',
        'Build Your Dream PC': 'ドリームPCを構築',
        'High-performance components from trusted brands. Professional quality, competitive prices.': '信頼できるブランドの高性能コンポーネント。プロ品質、競争力のある価格。',
        'Shop Now': '今すぐ購入',
        'Shop by Category': 'カテゴリー別に購入',
        'Featured Products': 'おすすめ製品',
        'All Products': 'すべての製品',
        'All Categories': 'すべてのカテゴリー',
        'All Brands': 'すべてのブランド',
        'Min Price': '最低価格',
        'Max Price': '最高価格',
        'In Stock Only': '在庫ありのみ',
        'Sort by:': '並び替え:',
        'Newest First': '新しい順',
        'Price: Low to High': '価格: 安い順',
        'Price: High to Low': '価格: 高い順',
        'Name: A to Z': '名前: A-Z',
        'Add to Cart': 'カートに追加',
        'In Stock': '在庫あり',
        'Out of Stock': '在庫切れ',
        'available': '利用可能',
        'Brand': 'ブランド',
        'Description': '説明',
        'Specifications': '仕様',
        'No description available': '説明がありません',
        'Wishlist': 'ウィッシュリスト',
        'No products found': '製品が見つかりません',
        'Try adjusting your filters or search terms': 'フィルターや検索条件を調整してください',
        'Showing': '表示中',
        'of': '/',
        'results': '結果',
        'Added to cart': 'カートに追加しました',
        'Failed to add to cart': 'カートへの追加に失敗しました',
        'Shopping Cart': 'ショッピングカート',
        'Your cart is empty': 'カートは空です',
        'Subtotal': '小計',
        'Tax': '税金',
        'Shipping': '送料',
        'Free': '無料',
        'Total': '合計',
        'Continue Shopping': '買い物を続ける',
        'Checkout': 'チェックアウト',
        'Remove': '削除',
        'Item removed from cart': 'カートから商品を削除しました',
        'Failed to remove item': '商品の削除に失敗しました',
        'Failed to update cart': 'カートの更新に失敗しました',
        'Customer Reviews': 'カスタマーレビュー',
        'Go Home': 'ホームへ',
        'Browse': '閲覧',
        'Browse Categories': 'カテゴリーを閲覧',
        'View All Categories': 'すべてのカテゴリーを表示',
        'Find the perfect components for your build': 'あなたのビルドに最適なコンポーネントを見つけてください',
        'Back to Home': 'ホームに戻る',
        'Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.': 'PCコンポーネントと周辺機器の包括的な選択を発見してください。高性能プロセッサーから最先端のグラフィックスカードまで。'
      }
    };
  }

  // Update language from URL parameters
  updateLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam === 'en' || langParam === 'jp')) {
      this.config.lang = langParam;
    }
  }

  // Change language and reload page content
  changeLanguage(newLang) {
    // Update config
    this.config.lang = newLang;
    
    // Update URL with new language parameter
    const url = new URL(window.location);
    url.searchParams.set('lang', newLang);
    
    // Use replaceState to avoid adding to browser history
    window.history.replaceState({}, '', url);
    
    // Reload page content with new language
    this.reloadCurrentPage();
  }

  // Reload the current page content with updated language
  reloadCurrentPage() {
    // Re-route to current page to refresh content with new language
    this.route();
  }

  t(key) {
    const lang = this.config.lang || 'en';
    return this.translations[lang][key] || this.translations['en'][key] || key;
  }

  getSessionToken() {
    let token = localStorage.getItem('sessionToken');
    if (!token) {
      token = 'session_' + Math.random().toString(36).substring(2) + '_' + Date.now();
      this.saveSessionToken(token);
    }
    return token;
  }

  saveSessionToken(token) {
    localStorage.setItem('sessionToken', token);
    axios.defaults.headers.common['X-Session-Token'] = token;
  }

  renderLoadingSkeleton(count, type) {
    let template = '';
    
    switch (type) {
      case 'product':
        template = `
          <div class="material-card p-4">
            <div class="skeleton-image mb-4"></div>
            <div class="skeleton-title mb-2"></div>
            <div class="skeleton-text mb-4"></div>
            <div class="skeleton-text w-20"></div>
          </div>
        `;
        break;
      case 'category':
        template = `
          <div class="material-card p-6 text-center">
            <div class="w-16 h-16 skeleton rounded-full mx-auto mb-4"></div>
            <div class="skeleton-title mb-2"></div>
            <div class="skeleton-text w-16 mx-auto"></div>
          </div>
        `;
        break;
      default:
        template = `<div class="skeleton h-20 mb-4"></div>`;
    }
    
    return Array(count).fill(template).join('');
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay fade-in';
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    return modal;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-75 hover:opacity-100">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showError(message) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="max-w-md mx-auto mt-20 text-center">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          ${message}
        </div>
        <button onclick="app.showHomePage()" class="btn btn-primary mt-4">
          ${this.t('Go Home')}
        </button>
      </div>
    `;
  }

  // Auth methods (simplified for now)
  async checkAuth() {
    try {
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        this.currentUser = response.data.data;
      }
    } catch (error) {
      // Not authenticated
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  showLoginForm() {
    // Simplified - would show login modal
    this.showNotification('Login functionality - coming soon!', 'info');
  }

  showAccountMenu() {
    // Simplified - would show account dropdown
    this.showNotification('Account menu - coming soon!', 'info');
  }

  // Category page implementation
  async showCategoryPage(slug, params = new URLSearchParams()) {
    try {
      // First get category info
      const categoryResponse = await axios.get(`/categories/${slug}`);
      if (!categoryResponse.data.success) {
        this.showError('Category not found');
        return;
      }
      
      const category = categoryResponse.data.data;
      const categoryName = this.config.lang === 'jp' ? category.name_jp : category.name_en;
      const categoryDesc = this.config.lang === 'jp' ? category.description_jp : category.description_en;
      
      const app = document.getElementById('app');
      
      app.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Category Header -->
          <div class="mb-8">
            <nav class="text-sm breadcrumbs mb-4">
              <ol class="list-none p-0 inline-flex">
                <li class="flex items-center">
                  <button onclick="app.showHomePage()" class="text-blue-600 hover:text-blue-800">${this.t('Home')}</button>
                  <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
                </li>
                <li class="flex items-center">
                  <button onclick="app.showProductsPage()" class="text-blue-600 hover:text-blue-800">${this.t('Products')}</button>
                  <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
                </li>
                <li class="text-gray-600">${categoryName}</li>
              </ol>
            </nav>
            
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center mb-4">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <i class="fas fa-microchip text-2xl text-blue-600"></i>
                </div>
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">${categoryName}</h1>
                  ${categoryDesc ? `<p class="text-gray-600 mt-2">${categoryDesc}</p>` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Filters and Sort -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="flex flex-wrap items-center space-x-4 mb-4 md:mb-0">
              <!-- Brand Filter -->
              <select id="brandFilter" class="form-input">
                <option value="">${this.t('All Brands')}</option>
              </select>
              
              <!-- Price Range -->
              <div class="flex items-center space-x-2">
                <input type="number" id="minPrice" placeholder="${this.t('Min Price')}" class="form-input w-24">
                <span>-</span>
                <input type="number" id="maxPrice" placeholder="${this.t('Max Price')}" class="form-input w-24">
              </div>
              
              <!-- Stock Filter -->
              <label class="flex items-center">
                <input type="checkbox" id="inStockOnly" class="mr-2">
                <span class="text-sm">${this.t('In Stock Only')}</span>
              </label>
            </div>
            
            <!-- Sort -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium">${this.t('Sort by:')}</label>
              <select id="sortSelect" class="form-input">
                <option value="created_at:desc">${this.t('Newest First')}</option>
                <option value="price:asc">${this.t('Price: Low to High')}</option>
                <option value="price:desc">${this.t('Price: High to Low')}</option>
                <option value="name_en:asc">${this.t('Name: A to Z')}</option>
              </select>
            </div>
          </div>

          <!-- Products Grid -->
          <div id="categoryProductsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            ${this.renderLoadingSkeleton(8, 'product')}
          </div>

          <!-- Pagination -->
          <div id="categoryPagination" class="mt-8 flex justify-center"></div>
        </div>
      `;

      // Set up filter event listeners for category page
      this.setupCategoryFilters(slug);
      
      // Load category products
      await this.loadCategoryProducts(slug, params);
      await this.loadFilterOptions();
      
      // Update page URL without refresh
      window.history.pushState({}, '', `/category/${slug}`);
      
    } catch (error) {
      console.error('Error loading category page:', error);
      this.showError('Failed to load category');
    }
  }

  showCheckoutPage() {
    this.showNotification('Checkout page - coming soon!', 'info');
  }

  showAdminDashboard() {
    this.showNotification('Admin dashboard - coming soon!', 'info');
  }

  async loadProducts(params = new URLSearchParams()) {
    try {
      const page = params.get('page') || '1';
      const limit = params.get('limit') || '12';
      const category = params.get('category') || '';
      const brand = params.get('brand') || '';
      const minPrice = params.get('minPrice') || '';
      const maxPrice = params.get('maxPrice') || '';
      const inStock = params.get('inStock') || '';
      const search = params.get('search') || '';
      const sortBy = params.get('sortBy') || 'created_at';
      const sortOrder = params.get('sortOrder') || 'desc';

      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(category && { category }),
        ...(brand && { brand }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(inStock && { inStock }),
        ...(search && { search }),
        sortBy,
        sortOrder
      });

      const response = await axios.get(`/products?${queryParams}`);
      if (response.data.success) {
        this.renderProducts(response.data.data, 'productsGrid');
        this.renderPagination(response.data.pagination, 'pagination');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      this.showError('Failed to load products');
    }
  }

  async loadCategoryProducts(slug, params = new URLSearchParams()) {
    try {
      // Set category filter
      params.set('category', slug);
      
      const page = params.get('page') || '1';
      const limit = params.get('limit') || '12';
      const brand = params.get('brand') || '';
      const minPrice = params.get('minPrice') || '';
      const maxPrice = params.get('maxPrice') || '';
      const inStock = params.get('inStock') || '';
      const sortBy = params.get('sortBy') || 'created_at';
      const sortOrder = params.get('sortOrder') || 'desc';

      const queryParams = new URLSearchParams({
        page,
        limit,
        category: slug,
        ...(brand && { brand }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(inStock && { inStock }),
        sortBy,
        sortOrder
      });

      const response = await axios.get(`/products?${queryParams}`);
      if (response.data.success) {
        this.renderProducts(response.data.data, 'categoryProductsGrid');
        this.renderPagination(response.data.pagination, 'categoryPagination', (newPage) => {
          params.set('page', newPage);
          this.loadCategoryProducts(slug, params);
        });
      }
    } catch (error) {
      console.error('Error loading category products:', error);
      this.showError('Failed to load category products');
    }
  }

  renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-600 mb-2">${this.t('No products found')}</h3>
          <p class="text-gray-500">${this.t('Try adjusting your filters or search terms')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => this.renderProductCard(product)).join('');
  }

  renderPagination(pagination, containerId, onPageChange = null) {
    const container = document.getElementById(containerId);
    if (!container || pagination.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = [];
    const currentPage = pagination.page;
    const totalPages = pagination.totalPages;

    // Previous button
    if (pagination.hasPrev) {
      pages.push(`
        <button onclick="${onPageChange ? `(${onPageChange})(${currentPage - 1})` : `app.changePage(${currentPage - 1})`}" 
                class="px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50">
          <i class="fas fa-chevron-left"></i>
        </button>
      `);
    }

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      pages.push(`<button onclick="${onPageChange ? `(${onPageChange})(1)` : `app.changePage(1)`}" class="px-3 py-2 text-gray-500 bg-white border border-gray-300 hover:bg-gray-50">1</button>`);
      if (startPage > 2) {
        pages.push(`<span class="px-3 py-2 text-gray-500 bg-white border border-gray-300">...</span>`);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      pages.push(`
        <button onclick="${onPageChange ? `(${onPageChange})(${i})` : `app.changePage(${i})`}" 
                class="px-3 py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white hover:bg-gray-50'} border border-gray-300">
          ${i}
        </button>
      `);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(`<span class="px-3 py-2 text-gray-500 bg-white border border-gray-300">...</span>`);
      }
      pages.push(`<button onclick="${onPageChange ? `(${onPageChange})(${totalPages})` : `app.changePage(${totalPages})`}" class="px-3 py-2 text-gray-500 bg-white border border-gray-300 hover:bg-gray-50">${totalPages}</button>`);
    }

    // Next button
    if (pagination.hasNext) {
      pages.push(`
        <button onclick="${onPageChange ? `(${onPageChange})(${currentPage + 1})` : `app.changePage(${currentPage + 1})`}" 
                class="px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50">
          <i class="fas fa-chevron-right"></i>
        </button>
      `);
    }

    container.innerHTML = `
      <nav class="flex items-center justify-center">
        <div class="flex items-center">
          ${pages.join('')}
        </div>
        <div class="ml-4 text-sm text-gray-600">
          ${this.t('Showing')} ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} ${this.t('of')} ${pagination.total} ${this.t('results')}
        </div>
      </nav>
    `;
  }

  changePage(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    this.loadProducts(params);
  }

  async loadFilterOptions() {
    try {
      const [categoriesResponse, brandsResponse] = await Promise.all([
        axios.get('/categories'),
        axios.get('/brands')
      ]);

      // Populate category filter
      const categoryFilter = document.getElementById('categoryFilter');
      if (categoryFilter && categoriesResponse.data.success) {
        const categories = categoriesResponse.data.data;
        categoryFilter.innerHTML = `<option value="">${this.t('All Categories')}</option>` +
          categories.map(cat => {
            const name = this.config.lang === 'jp' ? cat.name_jp : cat.name_en;
            return `<option value="${cat.slug}">${name}</option>`;
          }).join('');
      }

      // Populate brand filter
      const brandFilter = document.getElementById('brandFilter');
      if (brandFilter && brandsResponse.data.success) {
        const brands = brandsResponse.data.data;
        brandFilter.innerHTML = `<option value="">${this.t('All Brands')}</option>` +
          brands.map(brand => `<option value="${brand.name}">${brand.name}</option>`).join('');
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  setupProductFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const brandFilter = document.getElementById('brandFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortSelect = document.getElementById('sortSelect');

    const applyFilters = () => {
      const params = new URLSearchParams();
      if (categoryFilter?.value) params.set('category', categoryFilter.value);
      if (brandFilter?.value) params.set('brand', brandFilter.value);
      if (minPrice?.value) params.set('minPrice', minPrice.value);
      if (maxPrice?.value) params.set('maxPrice', maxPrice.value);
      if (inStockOnly?.checked) params.set('inStock', 'true');
      if (sortSelect?.value) {
        const [sortBy, sortOrder] = sortSelect.value.split(':');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
      }
      this.loadProducts(params);
    };

    [categoryFilter, brandFilter, sortSelect].forEach(element => {
      element?.addEventListener('change', applyFilters);
    });

    [minPrice, maxPrice].forEach(element => {
      element?.addEventListener('input', this.debounce(applyFilters, 500));
    });

    inStockOnly?.addEventListener('change', applyFilters);
  }

  setupCategoryFilters(categorySlug) {
    const brandFilter = document.getElementById('brandFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const inStockOnly = document.getElementById('inStockOnly');
    const sortSelect = document.getElementById('sortSelect');

    const applyFilters = () => {
      const params = new URLSearchParams();
      params.set('category', categorySlug); // Always include category
      if (brandFilter?.value) params.set('brand', brandFilter.value);
      if (minPrice?.value) params.set('minPrice', minPrice.value);
      if (maxPrice?.value) params.set('maxPrice', maxPrice.value);
      if (inStockOnly?.checked) params.set('inStock', 'true');
      if (sortSelect?.value) {
        const [sortBy, sortOrder] = sortSelect.value.split(':');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
      }
      this.loadCategoryProducts(categorySlug, params);
    };

    [brandFilter, sortSelect].forEach(element => {
      element?.addEventListener('change', applyFilters);
    });

    [minPrice, maxPrice].forEach(element => {
      element?.addEventListener('input', this.debounce(applyFilters, 500));
    });

    inStockOnly?.addEventListener('change', applyFilters);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Navigation helpers
  navigateToCategory(slug) {
    window.history.pushState({}, '', `/category/${slug}`);
    this.showCategoryPage(slug);
  }

  navigateToProduct(id) {
    window.history.pushState({}, '', `/product/${id}`);
    this.showProductPage(id);
  }

  navigateToProducts(params = new URLSearchParams()) {
    const url = params.toString() ? `/products?${params}` : '/products';
    window.history.pushState({}, '', url);
    this.showProductsPage(params);
  }

  navigateToHome() {
    window.history.pushState({}, '', '/');
    this.showHomePage();
  }

  navigateTo(path) {
    window.history.pushState({}, '', path);
    this.route();
  }

  async searchProducts(query) {
    if (!query || query.trim().length === 0) {
      this.showProductsPage();
      return;
    }

    // Navigate to products page with search parameter
    const params = new URLSearchParams();
    params.set('search', query.trim());
    
    // Update URL and show products page
    window.history.pushState({}, '', `/products?${params}`);
    this.showProductsPage(params);
  }

  async loadProductReviews(productId) {
    // Load and render product reviews
    const reviewsSection = document.getElementById('reviewsSection');
    if (reviewsSection) {
      reviewsSection.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-star text-2xl mb-2"></i>
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      `;
    }
  }
}

// Initialize the application
const app = new PCPartsShop();

// Hide loading indicator
document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
});