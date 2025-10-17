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

    // Account dropdown functionality
    this.setupAccountDropdown();
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
    } else if (path === '/checkout/success') {
      this.showOrderSuccessPage();
    } else if (path.startsWith('/orders/')) {
      const orderId = path.split('/')[2];
      this.showOrderDetailsPage(orderId);
    } else if (path === '/orders') {
      this.showOrdersPage();
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
      const response = await axios.post('/cart/items', {
        productId,
        variantId,
        quantity
      });

      if (response.data.success) {
        this.cart = response.data.data;
        this.sessionToken = response.data.sessionToken;
        this.saveSessionToken(this.sessionToken);
        this.updateCartUI();
        this.showNotification(this.t('Added to cart'), 'success');
      } else {
        this.showNotification(response.data.error || this.t('Failed to add to cart'), 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
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
            <p class="text-gray-600 mb-6">${this.t("Looks like you haven't added any items to your cart yet.")}</p>
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

  async showCheckoutPage() {
    // Ensure user is logged in
    if (!this.currentUser) {
      this.showNotification(this.t('Please sign in to proceed with checkout'), 'warning');
      this.navigateTo('/');
      return;
    }

    // Ensure cart is loaded and not empty
    await this.loadCart();
    if (!this.cart.items || this.cart.items.length === 0) {
      this.showNotification(this.t('Your cart is empty'), 'warning');
      this.navigateTo('/cart');
      return;
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Breadcrumb -->
        <nav class="mb-8">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" onclick="app.navigateToHome(); return false;" class="hover:text-primary-600">${this.t('Home')}</a>
            <i class="fas fa-chevron-right text-xs"></i>
            <a href="/cart" onclick="app.navigateTo('/cart'); return false;" class="hover:text-primary-600">${this.t('Cart')}</a>
            <i class="fas fa-chevron-right text-xs"></i>
            <span class="text-gray-900">${this.t('Checkout')}</span>
          </div>
        </nav>

        <!-- Checkout Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-credit-card mr-3"></i>
            ${this.t('Checkout')}
          </h1>
          <p class="text-gray-600 mt-2">${this.t('Complete your order')}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Checkout Form -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Contact Information -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">${this.t('Contact Information')}</h2>
              <div class="space-y-4">
                <div>
                  <label class="form-label">${this.t('Email Address')}</label>
                  <input type="email" id="checkoutEmail" value="${this.currentUser.email}" class="form-input" required>
                </div>
              </div>
            </div>

            <!-- Shipping Address -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">${this.t('Shipping Address')}</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">${this.t('First Name')}</label>
                  <input type="text" id="shippingFirstName" value="${this.currentUser.first_name || ''}" class="form-input" required>
                </div>
                <div>
                  <label class="form-label">${this.t('Last Name')}</label>
                  <input type="text" id="shippingLastName" value="${this.currentUser.last_name || ''}" class="form-input" required>
                </div>
                <div class="md:col-span-2">
                  <label class="form-label">${this.t('Company')} (${this.t('Optional')})</label>
                  <input type="text" id="shippingCompany" class="form-input">
                </div>
                <div class="md:col-span-2">
                  <label class="form-label">${this.t('Address')}</label>
                  <input type="text" id="shippingAddress1" placeholder="${this.t('Street address')}" class="form-input" required>
                </div>
                <div class="md:col-span-2">
                  <input type="text" id="shippingAddress2" placeholder="${this.t('Apartment, suite, etc.')}" class="form-input">
                </div>
                <div>
                  <label class="form-label">${this.t('City')}</label>
                  <input type="text" id="shippingCity" class="form-input" required>
                </div>
                <div>
                  <label class="form-label">${this.t('Postal Code')}</label>
                  <input type="text" id="shippingZip" class="form-input" required>
                </div>
                <div>
                  <label class="form-label">${this.t('Prefecture')}</label>
                  <select id="shippingProvince" class="form-input" required>
                    <option value="">${this.t('Select prefecture')}</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="Osaka">Osaka</option>
                    <option value="Kyoto">Kyoto</option>
                    <option value="Kanagawa">Kanagawa</option>
                    <option value="Chiba">Chiba</option>
                    <option value="Saitama">Saitama</option>
                    <option value="Other">${this.t('Other')}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">${this.t('Country')}</label>
                  <select id="shippingCountry" class="form-input" required>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="form-label">${this.t('Phone')} (${this.t('Optional')})</label>
                  <input type="tel" id="shippingPhone" class="form-input">
                </div>
              </div>
            </div>

            <!-- Billing Address -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold">${this.t('Billing Address')}</h2>
                <label class="flex items-center">
                  <input type="checkbox" id="sameAsShipping" class="mr-2" checked>
                  <span class="text-sm">${this.t('Same as shipping address')}</span>
                </label>
              </div>
              <div id="billingFields" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">${this.t('First Name')}</label>
                  <input type="text" id="billingFirstName" class="form-input">
                </div>
                <div>
                  <label class="form-label">${this.t('Last Name')}</label>
                  <input type="text" id="billingLastName" class="form-input">
                </div>
                <div class="md:col-span-2">
                  <label class="form-label">${this.t('Company')} (${this.t('Optional')})</label>
                  <input type="text" id="billingCompany" class="form-input">
                </div>
                <div class="md:col-span-2">
                  <label class="form-label">${this.t('Address')}</label>
                  <input type="text" id="billingAddress1" class="form-input">
                </div>
                <div class="md:col-span-2">
                  <input type="text" id="billingAddress2" placeholder="${this.t('Apartment, suite, etc.')}" class="form-input">
                </div>
                <div>
                  <label class="form-label">${this.t('City')}</label>
                  <input type="text" id="billingCity" class="form-input">
                </div>
                <div>
                  <label class="form-label">${this.t('Postal Code')}</label>
                  <input type="text" id="billingZip" class="form-input">
                </div>
                <div>
                  <label class="form-label">${this.t('Prefecture')}</label>
                  <select id="billingProvince" class="form-input">
                    <option value="">${this.t('Select prefecture')}</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="Osaka">Osaka</option>
                    <option value="Kyoto">Kyoto</option>
                    <option value="Kanagawa">Kanagawa</option>
                    <option value="Chiba">Chiba</option>
                    <option value="Saitama">Saitama</option>
                    <option value="Other">${this.t('Other')}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">${this.t('Country')}</label>
                  <select id="billingCountry" class="form-input">
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">${this.t('Payment Method')}</h2>
              <div class="space-y-4">
                <!-- Credit Card Option -->
                <label class="payment-option">
                  <input type="radio" name="paymentMethod" value="credit_card" class="mr-3" checked>
                  <div class="flex-1">
                    <div class="flex items-center">
                      <i class="fas fa-credit-card mr-2 text-primary-600"></i>
                      <span class="font-medium">${this.t('Credit Card')}</span>
                      <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">${this.t('DEMO')}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${this.t('Secure payment with your credit card')}</p>
                  </div>
                </label>

                <!-- Credit Card Form -->
                <div id="creditCardForm" class="ml-6 space-y-4">
                  <div>
                    <label class="form-label">${this.t('Card Number')}</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" class="form-input" maxlength="19">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="form-label">${this.t('Expiry Date')}</label>
                      <input type="text" id="expiryDate" placeholder="MM/YY" class="form-input" maxlength="5">
                    </div>
                    <div>
                      <label class="form-label">${this.t('CVV')}</label>
                      <input type="text" id="cvv" placeholder="123" class="form-input" maxlength="4">
                    </div>
                  </div>
                  <div>
                    <label class="form-label">${this.t('Cardholder Name')}</label>
                    <input type="text" id="cardholderName" value="${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}" class="form-input">
                  </div>
                </div>

                <!-- Cash on Delivery Option -->
                <label class="payment-option">
                  <input type="radio" name="paymentMethod" value="cod" class="mr-3">
                  <div class="flex-1">
                    <div class="flex items-center">
                      <i class="fas fa-money-bill-wave mr-2 text-green-600"></i>
                      <span class="font-medium">${this.t('Cash on Delivery')}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${this.t('Pay when you receive your order')}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Order Notes -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">${this.t('Order Notes')} (${this.t('Optional')})</h2>
              <textarea id="orderNotes" rows="3" class="form-input" placeholder="${this.t('Special instructions for your order...')}"></textarea>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm sticky top-4">
              <div class="p-6 border-b">
                <h2 class="text-lg font-semibold">${this.t('Order Summary')}</h2>
              </div>
              <div class="p-6">
                <div class="space-y-4 mb-6">
                  ${this.cart.items.map(item => this.renderCheckoutItem(item)).join('')}
                </div>

                <div class="space-y-3 py-4 border-t">
                  <div class="flex justify-between text-sm">
                    <span>${this.t('Subtotal')}:</span>
                    <span>${this.config.currency}${this.cart.subtotal.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span>${this.t('Tax')}:</span>
                    <span>${this.config.currency}${this.cart.tax.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span>${this.t('Shipping')}:</span>
                    <span>${this.cart.shipping === 0 ? this.t('Free') : this.config.currency + this.cart.shipping.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between text-lg font-semibold pt-3 border-t">
                    <span>${this.t('Total')}:</span>
                    <span>${this.config.currency}${this.cart.total.toLocaleString()}</span>
                  </div>
                </div>

                <button onclick="app.processOrder()" class="btn-primary w-full mt-6" id="placeOrderBtn">
                  <i class="fas fa-lock mr-2"></i>
                  ${this.t('Place Order')}
                </button>

                <div class="mt-4 text-center">
                  <p class="text-xs text-gray-500">${this.t('Your payment information is secure and encrypted')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Set up checkout functionality
    this.setupCheckoutForm();
  }

  renderCheckoutItem(item) {
    const name = this.config.lang === 'jp' ? item.name_jp : item.name_en;
    
    return `
      <div class="flex items-center space-x-3">
        <div class="relative">
          <img src="${item.image_url || '/static/placeholder-product.jpg'}" 
               alt="${name}" 
               class="w-12 h-12 object-cover rounded-md">
          <span class="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            ${item.quantity}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">${name}</p>
          <p class="text-xs text-gray-600">${this.config.currency}${item.price.toLocaleString()} each</p>
        </div>
        <div class="text-sm font-medium text-gray-900">
          ${this.config.currency}${(item.price * item.quantity).toLocaleString()}
        </div>
      </div>
    `;
  }

  setupCheckoutForm() {
    // Same as shipping checkbox
    const sameAsShipping = document.getElementById('sameAsShipping');
    const billingFields = document.getElementById('billingFields');
    
    if (sameAsShipping && billingFields) {
      sameAsShipping.addEventListener('change', () => {
        if (sameAsShipping.checked) {
          billingFields.classList.add('hidden');
        } else {
          billingFields.classList.remove('hidden');
        }
      });
    }

    // Payment method toggle
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const creditCardForm = document.getElementById('creditCardForm');
    
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'credit_card') {
          creditCardForm.classList.remove('hidden');
        } else {
          creditCardForm.classList.add('hidden');
        }
      });
    });

    // Credit card formatting
    this.setupCreditCardFormatting();
  }

  setupCreditCardFormatting() {
    const cardNumber = document.getElementById('cardNumber');
    const expiryDate = document.getElementById('expiryDate');

    if (cardNumber) {
      cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
      });
    }

    if (expiryDate) {
      expiryDate.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
      });
    }
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
        'Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.': 'Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.',
        'Sign in to your account': 'Sign in to your account',
        'or': 'or',
        'Quick Demo Login': 'Quick Demo Login',
        'Sign In': 'Sign In',
        'Register': 'Register',
        'Account Settings': 'Account Settings',
        'My Orders': 'My Orders',
        'Wishlist': 'Wishlist',
        'Sign Out': 'Sign Out',
        'Create Account': 'Create Account',
        'First Name': 'First Name',
        'Last Name': 'Last Name',
        'Email': 'Email',
        'Password': 'Password',
        'Cancel': 'Cancel',
        'Please fill in all fields': 'Please fill in all fields',
        'Demo login successful!': 'Demo login successful!',
        'Demo login failed': 'Demo login failed',
        'Logged out successfully': 'Logged out successfully',
        'Login successful!': 'Login successful!',
        'Login failed': 'Login failed',
        'Account created successfully!': 'Account created successfully!',
        'Registration failed': 'Registration failed',
        'Google login successful!': 'Google login successful!',
        'Google login failed': 'Google login failed',
        'Google authentication failed': 'Google authentication failed',
        // Checkout & Orders
        'Checkout': 'Checkout',
        'Complete your order': 'Complete your order',
        'Contact Information': 'Contact Information',
        'Email Address': 'Email Address',
        'Shipping Address': 'Shipping Address',
        'Company': 'Company',
        'Optional': 'Optional',
        'Address': 'Address',
        'Street address': 'Street address',
        'Apartment, suite, etc.': 'Apartment, suite, etc.',
        'City': 'City',
        'Postal Code': 'Postal Code',
        'Prefecture': 'Prefecture',
        'Select prefecture': 'Select prefecture',
        'Other': 'Other',
        'Country': 'Country',
        'Phone': 'Phone',
        'Billing Address': 'Billing Address',
        'Same as shipping address': 'Same as shipping address',
        'Payment Method': 'Payment Method',
        'Credit Card': 'Credit Card',
        'DEMO': 'DEMO',
        'Secure payment with your credit card': 'Secure payment with your credit card',
        'Card Number': 'Card Number',
        'Expiry Date': 'Expiry Date',
        'CVV': 'CVV',
        'Cardholder Name': 'Cardholder Name',
        'Cash on Delivery': 'Cash on Delivery',
        'Pay when you receive your order': 'Pay when you receive your order',
        'Order Notes': 'Order Notes',
        'Special instructions for your order...': 'Special instructions for your order...',
        'Place Order': 'Place Order',
        'Your payment information is secure and encrypted': 'Your payment information is secure and encrypted',
        'Please sign in to proceed with checkout': 'Please sign in to proceed with checkout',
        'Processing...': 'Processing...',
        'Please fill in all required fields': 'Please fill in all required fields',
        'Please fill in all credit card details': 'Please fill in all credit card details',
        'Order placed successfully!': 'Order placed successfully!',
        'Failed to place order': 'Failed to place order',
        'Order Confirmed!': 'Order Confirmed!',
        'Thank you for your purchase. Your order has been received and is being processed.': 'Thank you for your purchase. Your order has been received and is being processed.',
        'Order': 'Order',
        'Placed on': 'Placed on',
        'Total Amount': 'Total Amount',
        'Order Status': 'Order Status',
        'Order Confirmed': 'Order Confirmed',
        'Processing': 'Processing',
        'Shipped': 'Shipped',
        'Delivered': 'Delivered',
        'What happens next?': 'What happens next?',
        'You will receive an order confirmation email shortly': 'You will receive an order confirmation email shortly',
        'Your order will be processed within 24 hours': 'Your order will be processed within 24 hours',
        'You can track your order status in your account': 'You can track your order status in your account',
        'Estimated delivery: 2-5 business days': 'Estimated delivery: 2-5 business days',
        'View Order Details': 'View Order Details',
        'Please sign in to view your orders': 'Please sign in to view your orders',
        'Track and manage your orders': 'Track and manage your orders',
        'No orders yet': 'No orders yet',
        'When you place your first order, it will appear here.': 'When you place your first order, it will appear here.',
        'Start Shopping': 'Start Shopping',
        'Payment Status': 'Payment Status',
        'Delivering to': 'Delivering to',
        'View Details': 'View Details',
        'Track Order': 'Track Order',
        'Please sign in to view order details': 'Please sign in to view order details',
        'Order Placed': 'Order Placed',
        'Track Package': 'Track Package',
        'Simulate Progress': 'Simulate Progress',
        'Order Items': 'Order Items',
        'Quantity': 'Quantity',
        'each': 'each',
        'total': 'total',
        'Order status updated to': 'Order status updated to',
        'Order is already at final status': 'Order is already at final status',
        'Failed to update order status': 'Failed to update order status',
        'Tracking order': 'Tracking order',
        'Feature coming soon!': 'Feature coming soon!',
        'Confirmed': 'Confirmed',
        'Pending': 'Pending',
        'Cancelled': 'Cancelled',
        'cod pending': 'COD Pending',
        'completed': 'Completed'
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
        'Discover our comprehensive selection of PC components and peripherals. From high-performance processors to cutting-edge graphics cards.': 'PCコンポーネントと周辺機器の包括的な選択を発見してください。高性能プロセッサーから最先端のグラフィックスカードまで。',
        'Sign in to your account': 'アカウントにサインイン',
        'or': 'または',
        'Quick Demo Login': 'クイックデモログイン',
        'Sign In': 'サインイン',
        'Register': '登録',
        'Account Settings': 'アカウント設定',
        'My Orders': 'マイオーダー',
        'Wishlist': 'ウィッシュリスト',
        'Sign Out': 'サインアウト',
        'Create Account': 'アカウント作成',
        'First Name': '名',
        'Last Name': '姓',
        'Email': 'メール',
        'Password': 'パスワード',
        'Cancel': 'キャンセル',
        'Please fill in all fields': 'すべてのフィールドに入力してください',
        'Demo login successful!': 'デモログイン成功！',
        'Demo login failed': 'デモログインに失敗しました',
        'Logged out successfully': 'ログアウトしました',
        'Login successful!': 'ログイン成功！',
        'Login failed': 'ログインに失敗しました',
        'Account created successfully!': 'アカウントが正常に作成されました！',
        'Registration failed': '登録に失敗しました',
        'Google login successful!': 'Googleログイン成功！',
        'Google login failed': 'Googleログインに失敗しました',
        'Google authentication failed': 'Google認証に失敗しました',
        // Checkout & Orders
        'Checkout': 'チェックアウト',
        'Complete your order': 'ご注文を完了してください',
        'Contact Information': '連絡先情報',
        'Email Address': 'メールアドレス',
        'Shipping Address': '配送先住所',
        'Company': '会社名',
        'Optional': '任意',
        'Address': '住所',
        'Street address': '番地・建物名',
        'Apartment, suite, etc.': 'マンション・アパート名など',
        'City': '市区町村',
        'Postal Code': '郵便番号',
        'Prefecture': '都道府県',
        'Select prefecture': '都道府県を選択',
        'Other': 'その他',
        'Country': '国',
        'Phone': '電話番号',
        'Billing Address': '請求先住所',
        'Same as shipping address': '配送先住所と同じ',
        'Payment Method': '支払い方法',
        'Credit Card': 'クレジットカード',
        'DEMO': 'デモ',
        'Secure payment with your credit card': 'クレジットカードで安全にお支払い',
        'Card Number': 'カード番号',
        'Expiry Date': '有効期限',
        'CVV': 'セキュリティコード',
        'Cardholder Name': 'カード名義人',
        'Cash on Delivery': '代金引換',
        'Pay when you receive your order': '商品受け取り時にお支払い',
        'Order Notes': 'ご注文に関するメモ',
        'Special instructions for your order...': 'ご注文に関する特別な指示...',
        'Place Order': '注文を確定する',
        'Your payment information is secure and encrypted': 'お支払い情報は安全に暗号化されています',
        'Please sign in to proceed with checkout': 'チェックアウトを続行するにはサインインしてください',
        'Processing...': '処理中...',
        'Please fill in all required fields': '必須項目をすべて入力してください',
        'Please fill in all credit card details': 'クレジットカード情報をすべて入力してください',
        'Order placed successfully!': 'ご注文が正常に完了しました！',
        'Failed to place order': '注文の処理に失敗しました',
        'Order Confirmed!': '注文が確認されました！',
        'Thank you for your purchase. Your order has been received and is being processed.': 'ご購入ありがとうございます。ご注文を受け付け、処理を開始いたします。',
        'Order': '注文',
        'Placed on': '注文日',
        'Total Amount': '合計金額',
        'Order Status': '注文ステータス',
        'Order Confirmed': '注文確認済み',
        'Processing': '処理中',
        'Shipped': '発送済み',
        'Delivered': '配送完了',
        'What happens next?': '次に何が起こりますか？',
        'You will receive an order confirmation email shortly': 'まもなく注文確認メールをお送りします',
        'Your order will be processed within 24 hours': 'ご注文は24時間以内に処理されます',
        'You can track your order status in your account': 'アカウントで注文状況を追跡できます',
        'Estimated delivery: 2-5 business days': '配送予定：営業日2-5日',
        'View Order Details': '注文詳細を見る',
        'Please sign in to view your orders': 'ご注文を表示するにはサインインしてください',
        'Track and manage your orders': '注文の追跡と管理',
        'No orders yet': 'まだ注文がありません',
        'When you place your first order, it will appear here.': '最初のご注文をいただくと、こちらに表示されます。',
        'Start Shopping': 'ショッピングを開始',
        'Payment Status': '支払い状況',
        'Delivering to': '配送先',
        'View Details': '詳細を見る',
        'Track Order': '注文を追跡',
        'Please sign in to view order details': '注文詳細を表示するにはサインインしてください',
        'Order Placed': '注文受付',
        'Track Package': '荷物を追跡',
        'Simulate Progress': '進行状況をシミュレート',
        'Order Items': '注文商品',
        'Quantity': '数量',
        'each': '各',
        'total': '合計',
        'Order status updated to': '注文ステータスが更新されました：',
        'Order is already at final status': '注文は既に最終ステータスです',
        'Failed to update order status': '注文ステータスの更新に失敗しました',
        'Tracking order': '注文追跡',
        'Feature coming soon!': '機能は近日公開予定！',
        'Confirmed': '確認済み',
        'Pending': '保留中',
        'Cancelled': 'キャンセル済み',
        'cod pending': '代引き待ち',
        'completed': '完了'
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

  // Auth methods and user management
  setupAccountDropdown() {
    const accountBtn = document.getElementById('accountBtn');
    const userDropdown = document.getElementById('userDropdown');
    const accountContainer = document.getElementById('accountContainer');

    if (!accountBtn || !userDropdown) return;

    // Toggle dropdown on click
    accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!accountContainer.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });

    // Demo login button
    const demoLoginBtn = document.getElementById('demoLoginBtn');
    if (demoLoginBtn) {
      demoLoginBtn.addEventListener('click', () => {
        this.demoLogin();
      });
    }

    // Login/Register form buttons
    const showLoginForm = document.getElementById('showLoginForm');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (showLoginForm) {
      showLoginForm.addEventListener('click', () => {
        this.showLoginModal();
      });
    }

    if (showRegisterForm) {
      showRegisterForm.addEventListener('click', () => {
        this.showRegisterModal();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Update UI based on auth state
    this.updateAuthUI();
  }

  async checkAuth() {
    try {
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        this.currentUser = response.data.data;
        this.updateAuthUI();
      }
    } catch (error) {
      // Not authenticated
      this.currentUser = null;
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      this.updateAuthUI();
    }
  }

  updateAuthUI() {
    const notLoggedInState = document.getElementById('notLoggedInState');
    const loggedInState = document.getElementById('loggedInState');
    const userAvatar = document.getElementById('userAvatar');
    const defaultUserIcon = document.getElementById('defaultUserIcon');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const loggedInAvatar = document.getElementById('loggedInAvatar');

    if (this.currentUser) {
      // User is logged in
      if (notLoggedInState) notLoggedInState.classList.add('hidden');
      if (loggedInState) loggedInState.classList.remove('hidden');
      
      // Update user info
      if (userName) userName.textContent = `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim() || 'User';
      if (userEmail) userEmail.textContent = this.currentUser.email;
      
      // Update avatar in navigation
      if (userAvatar && defaultUserIcon) {
        if (this.currentUser.avatar) {
          userAvatar.innerHTML = `<img src="${this.currentUser.avatar}" class="w-8 h-8 rounded-full object-cover" alt="Avatar">`;
        } else {
          const initials = this.getUserInitials();
          userAvatar.innerHTML = `<span class="text-white font-medium text-sm">${initials}</span>`;
          userAvatar.classList.add('bg-primary-600');
        }
        userAvatar.classList.remove('hidden');
        userAvatar.classList.add('flex');
        defaultUserIcon.classList.add('hidden');
      }
      
      // Update dropdown avatar
      if (loggedInAvatar) {
        if (this.currentUser.avatar) {
          loggedInAvatar.innerHTML = `<img src="${this.currentUser.avatar}" class="w-10 h-10 rounded-full object-cover" alt="Avatar">`;
        } else {
          const initials = this.getUserInitials();
          loggedInAvatar.innerHTML = `<span class="text-primary-600 font-medium">${initials}</span>`;
        }
      }
    } else {
      // User is not logged in
      if (notLoggedInState) notLoggedInState.classList.remove('hidden');
      if (loggedInState) loggedInState.classList.add('hidden');
      
      // Reset navigation avatar
      if (userAvatar && defaultUserIcon) {
        userAvatar.classList.add('hidden');
        userAvatar.classList.remove('flex');
        defaultUserIcon.classList.remove('hidden');
      }
    }
  }

  getUserInitials() {
    if (!this.currentUser) return 'U';
    const first = this.currentUser.first_name?.[0]?.toUpperCase() || '';
    const last = this.currentUser.last_name?.[0]?.toUpperCase() || '';
    return first + last || this.currentUser.email?.[0]?.toUpperCase() || 'U';
  }

  async demoLogin() {
    try {
      // Create a demo user login
      const demoUser = {
        id: 999,
        email: 'demo@pcpartsshop.com',
        first_name: 'Demo',
        last_name: 'User',
        role: 'customer',
        language_preference: this.config.lang,
        avatar: null
      };

      // Set user and token
      this.currentUser = demoUser;
      const demoToken = 'demo_token_' + Date.now();
      localStorage.setItem('authToken', demoToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${demoToken}`;

      // Update UI
      this.updateAuthUI();
      this.hideDropdown();
      this.showNotification(this.t('Demo login successful!'), 'success');
    } catch (error) {
      console.error('Demo login error:', error);
      this.showNotification(this.t('Demo login failed'), 'error');
    }
  }

  async logout() {
    try {
      // Call logout API
      await axios.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }

    // Clear local state
    this.currentUser = null;
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    
    // Update UI
    this.updateAuthUI();
    this.hideDropdown();
    this.showNotification(this.t('Logged out successfully'), 'success');
  }

  hideDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      userDropdown.classList.add('hidden');
    }
  }

  showLoginModal() {
    const modal = this.createModal();
    modal.innerHTML = `
      <div class="modal-content max-w-md">
        <div class="modal-header">
          <h3 class="modal-title">${this.t('Sign In')}</h3>
          <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="loginForm" class="space-y-4">
            <div class="form-group">
              <label class="form-label">${this.t('Email')}</label>
              <input type="email" id="loginEmail" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">${this.t('Password')}</label>
              <input type="password" id="loginPassword" class="form-input" required>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">
            ${this.t('Cancel')}
          </button>
          <button onclick="app.handleLogin()" class="btn btn-primary">
            ${this.t('Sign In')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  showRegisterModal() {
    const modal = this.createModal();
    modal.innerHTML = `
      <div class="modal-content max-w-md">
        <div class="modal-header">
          <h3 class="modal-title">${this.t('Create Account')}</h3>
          <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="registerForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">${this.t('First Name')}</label>
                <input type="text" id="registerFirstName" class="form-input" required>
              </div>
              <div class="form-group">
                <label class="form-label">${this.t('Last Name')}</label>
                <input type="text" id="registerLastName" class="form-input" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">${this.t('Email')}</label>
              <input type="email" id="registerEmail" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">${this.t('Password')}</label>
              <input type="password" id="registerPassword" class="form-input" required>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">
            ${this.t('Cancel')}
          </button>
          <button onclick="app.handleRegister()" class="btn btn-primary">
            ${this.t('Create Account')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      this.showNotification(this.t('Please fill in all fields'), 'error');
      return;
    }

    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        this.currentUser = response.data.data.user;
        localStorage.setItem('authToken', response.data.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        
        this.updateAuthUI();
        document.querySelector('.modal-overlay')?.remove();
        this.showNotification(this.t('Login successful!'), 'success');
      } else {
        this.showNotification(response.data.error || this.t('Login failed'), 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification(error.response?.data?.error || this.t('Login failed'), 'error');
    }
  }

  async handleRegister() {
    const firstName = document.getElementById('registerFirstName')?.value;
    const lastName = document.getElementById('registerLastName')?.value;
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;

    if (!firstName || !lastName || !email || !password) {
      this.showNotification(this.t('Please fill in all fields'), 'error');
      return;
    }

    try {
      const response = await axios.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        languagePreference: this.config.lang
      });

      if (response.data.success) {
        this.currentUser = response.data.data.user;
        localStorage.setItem('authToken', response.data.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        
        this.updateAuthUI();
        document.querySelector('.modal-overlay')?.remove();
        this.showNotification(this.t('Account created successfully!'), 'success');
      } else {
        this.showNotification(response.data.error || this.t('Registration failed'), 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showNotification(error.response?.data?.error || this.t('Registration failed'), 'error');
    }
  }

  // Google OAuth callback
  async handleGoogleLogin(response) {
    try {
      // Decode the JWT token from Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const googleUserInfo = {
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture
      };

      // Send to our backend
      const authResponse = await axios.post('/auth/google', {
        token: response.credential,
        userInfo: googleUserInfo
      });

      if (authResponse.data.success) {
        this.currentUser = authResponse.data.data.user;
        localStorage.setItem('authToken', authResponse.data.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authResponse.data.data.token}`;
        
        this.updateAuthUI();
        this.hideDropdown();
        this.showNotification(this.t('Google login successful!'), 'success');
      } else {
        this.showNotification(authResponse.data.error || this.t('Google login failed'), 'error');
      }
    } catch (error) {
      console.error('Google login error:', error);
      this.showNotification(this.t('Google authentication failed'), 'error');
    }
  }

  // Order processing
  async processOrder() {
    try {
      const placeOrderBtn = document.getElementById('placeOrderBtn');
      if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${this.t('Processing...')}`;
      }

      // Get form data
      const orderData = this.collectOrderData();
      
      if (!this.validateOrderData(orderData)) {
        return;
      }

      // Process the order
      const response = await axios.post('/orders', orderData);

      if (response.data.success) {
        // Store order for success page
        localStorage.setItem('lastOrder', JSON.stringify(response.data.data));
        
        // Navigate to success page
        this.navigateTo('/checkout/success');
        
        this.showNotification(this.t('Order placed successfully!'), 'success');
      } else {
        this.showNotification(response.data.error || this.t('Failed to place order'), 'error');
      }
    } catch (error) {
      console.error('Order processing error:', error);
      this.showNotification(error.response?.data?.error || this.t('Failed to place order'), 'error');
    } finally {
      const placeOrderBtn = document.getElementById('placeOrderBtn');
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = `<i class="fas fa-lock mr-2"></i>${this.t('Place Order')}`;
      }
    }
  }

  collectOrderData() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const sameAsShipping = document.getElementById('sameAsShipping')?.checked;

    return {
      sessionToken: this.sessionToken,
      email: document.getElementById('checkoutEmail')?.value,
      shipping: {
        firstName: document.getElementById('shippingFirstName')?.value,
        lastName: document.getElementById('shippingLastName')?.value,
        company: document.getElementById('shippingCompany')?.value,
        address1: document.getElementById('shippingAddress1')?.value,
        address2: document.getElementById('shippingAddress2')?.value,
        city: document.getElementById('shippingCity')?.value,
        province: document.getElementById('shippingProvince')?.value,
        country: document.getElementById('shippingCountry')?.value,
        zip: document.getElementById('shippingZip')?.value,
        phone: document.getElementById('shippingPhone')?.value
      },
      billing: sameAsShipping ? null : {
        firstName: document.getElementById('billingFirstName')?.value,
        lastName: document.getElementById('billingLastName')?.value,
        company: document.getElementById('billingCompany')?.value,
        address1: document.getElementById('billingAddress1')?.value,
        address2: document.getElementById('billingAddress2')?.value,
        city: document.getElementById('billingCity')?.value,
        province: document.getElementById('billingProvince')?.value,
        country: document.getElementById('billingCountry')?.value,
        zip: document.getElementById('billingZip')?.value,
        phone: document.getElementById('billingPhone')?.value
      },
      paymentMethod,
      notes: document.getElementById('orderNotes')?.value
    };
  }

  validateOrderData(data) {
    if (!data.email || !data.shipping.firstName || !data.shipping.lastName || 
        !data.shipping.address1 || !data.shipping.city || !data.shipping.zip || 
        !data.shipping.province || !data.paymentMethod) {
      this.showNotification(this.t('Please fill in all required fields'), 'error');
      return false;
    }

    // Validate credit card if selected
    if (data.paymentMethod === 'credit_card') {
      const cardNumber = document.getElementById('cardNumber')?.value;
      const expiryDate = document.getElementById('expiryDate')?.value;
      const cvv = document.getElementById('cvv')?.value;
      const cardholderName = document.getElementById('cardholderName')?.value;

      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        this.showNotification(this.t('Please fill in all credit card details'), 'error');
        return false;
      }
    }

    return true;
  }

  showOrderSuccessPage() {
    const lastOrder = localStorage.getItem('lastOrder');
    let order = null;
    
    try {
      order = lastOrder ? JSON.parse(lastOrder) : null;
    } catch (e) {
      console.error('Error parsing last order:', e);
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Success Message -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-3xl text-green-600"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">${this.t('Order Confirmed!')}</h1>
          <p class="text-gray-600">${this.t('Thank you for your purchase. Your order has been received and is being processed.')}</p>
        </div>

        ${order ? `
        <!-- Order Details -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div class="border-b pb-4 mb-4">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-semibold">${this.t('Order')} #${order.order_number}</h2>
                <p class="text-sm text-gray-600">${this.t('Placed on')} ${new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-primary-600">${this.config.currency}${order.total_amount.toLocaleString()}</p>
                <p class="text-sm text-gray-600">${this.t('Total Amount')}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium text-gray-900 mb-2">${this.t('Shipping Address')}</h3>
              <div class="text-sm text-gray-600">
                <p>${order.shipping_first_name} ${order.shipping_last_name}</p>
                ${order.shipping_company ? `<p>${order.shipping_company}</p>` : ''}
                <p>${order.shipping_address1}</p>
                ${order.shipping_address2 ? `<p>${order.shipping_address2}</p>` : ''}
                <p>${order.shipping_city}, ${order.shipping_province} ${order.shipping_zip}</p>
                <p>${order.shipping_country}</p>
              </div>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 mb-2">${this.t('Order Status')}</h3>
              <div class="space-y-2">
                <div class="flex items-center">
                  <i class="fas fa-circle text-green-500 text-xs mr-2"></i>
                  <span class="text-sm">${this.t('Order Confirmed')}</span>
                </div>
                <div class="flex items-center text-gray-400">
                  <i class="far fa-circle text-xs mr-2"></i>
                  <span class="text-sm">${this.t('Processing')}</span>
                </div>
                <div class="flex items-center text-gray-400">
                  <i class="far fa-circle text-xs mr-2"></i>
                  <span class="text-sm">${this.t('Shipped')}</span>
                </div>
                <div class="flex items-center text-gray-400">
                  <i class="far fa-circle text-xs mr-2"></i>
                  <span class="text-sm">${this.t('Delivered')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Next Steps -->
        <div class="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 class="font-medium text-blue-900 mb-2">${this.t('What happens next?')}</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• ${this.t('You will receive an order confirmation email shortly')}</li>
            <li>• ${this.t('Your order will be processed within 24 hours')}</li>
            <li>• ${this.t('You can track your order status in your account')}</li>
            <li>• ${this.t('Estimated delivery: 2-5 business days')}</li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button onclick="app.navigateToHome()" class="btn-secondary">
            <i class="fas fa-home mr-2"></i>
            ${this.t('Continue Shopping')}
          </button>
          ${order ? `
          <button onclick="app.navigateTo('/orders/${order.id}')" class="btn-primary">
            <i class="fas fa-eye mr-2"></i>
            ${this.t('View Order Details')}
          </button>
          ` : ''}
          <button onclick="app.navigateTo('/orders')" class="btn-secondary">
            <i class="fas fa-list mr-2"></i>
            ${this.t('My Orders')}
          </button>
        </div>
      </div>
    `;

    // Clean up stored order
    localStorage.removeItem('lastOrder');
  }

  async showOrdersPage() {
    if (!this.currentUser) {
      this.showNotification(this.t('Please sign in to view your orders'), 'warning');
      this.navigateTo('/');
      return;
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Breadcrumb -->
        <nav class="mb-8">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" onclick="app.navigateToHome(); return false;" class="hover:text-primary-600">${this.t('Home')}</a>
            <i class="fas fa-chevron-right text-xs"></i>
            <span class="text-gray-900">${this.t('My Orders')}</span>
          </div>
        </nav>

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-box mr-3"></i>
            ${this.t('My Orders')}
          </h1>
          <p class="text-gray-600 mt-2">${this.t('Track and manage your orders')}</p>
        </div>

        <!-- Orders List -->
        <div id="ordersList">
          ${this.renderLoadingSkeleton(3, 'order')}
        </div>
      </div>
    `;

    // Load orders
    await this.loadOrders();
  }

  async loadOrders() {
    try {
      const response = await axios.get('/orders');
      if (response.data.success) {
        const orders = response.data.data;
        this.renderOrders(orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.showError('Failed to load orders');
    }
  }

  renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="text-center py-16">
          <div class="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-box text-4xl text-gray-400"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">${this.t('No orders yet')}</h2>
          <p class="text-gray-600 mb-6">${this.t('When you place your first order, it will appear here.')}</p>
          <button onclick="app.navigateToHome()" class="btn-primary">
            <i class="fas fa-shopping-cart mr-2"></i>
            ${this.t('Start Shopping')}
          </button>
        </div>
      `;
      return;
    }

    ordersList.innerHTML = `
      <div class="space-y-6">
        ${orders.map(order => this.renderOrderCard(order)).join('')}
      </div>
    `;
  }

  renderOrderCard(order) {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const statusColor = statusColors[order.status] || 'bg-gray-100 text-gray-800';

    return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                ${this.t('Order')} #${order.order_number}
              </h3>
              <p class="text-sm text-gray-600">
                ${this.t('Placed on')} ${new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                ${this.t(order.status.charAt(0).toUpperCase() + order.status.slice(1))}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p class="text-sm font-medium text-gray-900">${this.t('Total Amount')}</p>
              <p class="text-lg font-semibold text-primary-600">
                ${this.config.currency}${order.total_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">${this.t('Payment Status')}</p>
              <p class="text-sm text-gray-600">${this.t(order.payment_status.replace('_', ' '))}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">${this.t('Items')}</p>
              <p class="text-sm text-gray-600">${order.item_count} ${this.t('items')}</p>
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600">
              ${this.t('Delivering to')}: ${order.shipping_city}, ${order.shipping_province}
            </p>
            <div class="space-x-3">
              <button onclick="app.navigateTo('/orders/${order.id}')" class="btn-secondary btn-sm">
                <i class="fas fa-eye mr-1"></i>
                ${this.t('View Details')}
              </button>
              ${order.status === 'shipped' || order.status === 'delivered' ? `
                <button onclick="app.trackOrder('${order.order_number}')" class="btn-primary btn-sm">
                  <i class="fas fa-truck mr-1"></i>
                  ${this.t('Track Order')}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async showOrderDetailsPage(orderId) {
    if (!this.currentUser) {
      this.showNotification(this.t('Please sign in to view order details'), 'warning');
      this.navigateTo('/');
      return;
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="orderDetails">
          ${this.renderLoadingSkeleton(1, 'order-detail')}
        </div>
      </div>
    `;

    try {
      const response = await axios.get(`/orders/${orderId}`);
      if (response.data.success) {
        this.renderOrderDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      this.showError('Failed to load order details');
    }
  }

  renderOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');
    
    orderDetails.innerHTML = `
      <!-- Breadcrumb -->
      <nav class="mb-8">
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" onclick="app.navigateToHome(); return false;" class="hover:text-primary-600">${this.t('Home')}</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <a href="/orders" onclick="app.navigateTo('/orders'); return false;" class="hover:text-primary-600">${this.t('My Orders')}</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-900">${this.t('Order')} #${order.order_number}</span>
        </div>
      </nav>

      <!-- Order Header -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${this.t('Order')} #${order.order_number}</h1>
            <p class="text-gray-600">${this.t('Placed on')} ${new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-primary-600">${this.config.currency}${order.total_amount.toLocaleString()}</p>
            <p class="text-sm text-gray-600">${this.t('Total Amount')}</p>
          </div>
        </div>

        <!-- Order Status Timeline -->
        <div class="mb-6">
          <h3 class="font-medium text-gray-900 mb-4">${this.t('Order Status')}</h3>
          ${this.renderOrderTimeline(order)}
        </div>

        <!-- Quick Actions -->
        <div class="flex space-x-4">
          ${order.status === 'shipped' || order.status === 'delivered' ? `
            <button onclick="app.trackOrder('${order.order_number}')" class="btn-primary">
              <i class="fas fa-truck mr-2"></i>
              ${this.t('Track Package')}
            </button>
          ` : ''}
          <button onclick="app.simulateOrderProgress('${order.id}')" class="btn-secondary">
            <i class="fas fa-forward mr-2"></i>
            ${this.t('Simulate Progress')} (${this.t('Demo')})
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Order Items -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">${this.t('Order Items')}</h2>
            <div class="space-y-4">
              ${order.items?.map(item => this.renderOrderItem(item)).join('') || '<p class="text-gray-500">No items found</p>'}
            </div>
          </div>
        </div>

        <!-- Order Summary & Addresses -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Order Summary -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="font-semibold mb-4">${this.t('Order Summary')}</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>${this.t('Subtotal')}:</span>
                <span>${this.config.currency}${order.subtotal.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span>${this.t('Tax')}:</span>
                <span>${this.config.currency}${order.tax_amount.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span>${this.t('Shipping')}:</span>
                <span>${order.shipping_amount === 0 ? this.t('Free') : this.config.currency + order.shipping_amount.toLocaleString()}</span>
              </div>
              <div class="flex justify-between font-semibold text-base pt-2 border-t">
                <span>${this.t('Total')}:</span>
                <span>${this.config.currency}${order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="font-semibold mb-4">${this.t('Shipping Address')}</h3>
            <div class="text-sm text-gray-600">
              <p class="font-medium text-gray-900">${order.shipping_first_name} ${order.shipping_last_name}</p>
              ${order.shipping_company ? `<p>${order.shipping_company}</p>` : ''}
              <p>${order.shipping_address1}</p>
              ${order.shipping_address2 ? `<p>${order.shipping_address2}</p>` : ''}
              <p>${order.shipping_city}, ${order.shipping_province} ${order.shipping_zip}</p>
              <p>${order.shipping_country}</p>
              ${order.shipping_phone ? `<p>${this.t('Phone')}: ${order.shipping_phone}</p>` : ''}
            </div>
          </div>

          <!-- Payment Information -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="font-semibold mb-4">${this.t('Payment Information')}</h3>
            <div class="text-sm">
              <p><span class="font-medium">${this.t('Status')}:</span> ${this.t(order.payment_status.replace('_', ' '))}</p>
              <p><span class="font-medium">${this.t('Method')}:</span> ${order.payment_status.includes('cod') ? this.t('Cash on Delivery') : this.t('Credit Card')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderOrderTimeline(order) {
    const statuses = [
      { key: 'pending', label: 'Order Placed', icon: 'fas fa-check-circle' },
      { key: 'confirmed', label: 'Order Confirmed', icon: 'fas fa-thumbs-up' },
      { key: 'processing', label: 'Processing', icon: 'fas fa-cog' },
      { key: 'shipped', label: 'Shipped', icon: 'fas fa-truck' },
      { key: 'delivered', label: 'Delivered', icon: 'fas fa-home' }
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key === order.status);

    return `
      <div class="flex items-center justify-between">
        ${statuses.map((status, index) => {
          const isActive = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          
          return `
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-primary-200' : ''}">
                <i class="${status.icon} text-sm"></i>
              </div>
              <p class="text-xs mt-2 text-center max-w-20 ${
                isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
              }">
                ${this.t(status.label)}
              </p>
            </div>
            ${index < statuses.length - 1 ? `
              <div class="flex-1 h-0.5 mx-2 ${
                index < currentStatusIndex ? 'bg-primary-600' : 'bg-gray-200'
              }"></div>
            ` : ''}
          `;
        }).join('')}
      </div>
    `;
  }

  renderOrderItem(item) {
    return `
      <div class="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-0">
        <img src="${item.image_url || '/static/placeholder-product.jpg'}" 
             alt="${item.name_en}" 
             class="w-16 h-16 object-cover rounded-md">
        
        <div class="flex-1">
          <h4 class="font-medium text-gray-900">${item.name_en}</h4>
          <p class="text-sm text-gray-600">SKU: ${item.sku}</p>
          <p class="text-sm text-gray-600">${this.t('Quantity')}: ${item.quantity}</p>
        </div>
        
        <div class="text-right">
          <p class="font-medium text-gray-900">${this.config.currency}${item.price.toLocaleString()}</p>
          <p class="text-sm text-gray-600">${this.t('each')}</p>
        </div>
        
        <div class="text-right">
          <p class="font-semibold text-gray-900">${this.config.currency}${item.total.toLocaleString()}</p>
          <p class="text-sm text-gray-600">${this.t('total')}</p>
        </div>
      </div>
    `;
  }

  async simulateOrderProgress(orderId) {
    try {
      const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
      const currentOrder = await axios.get(`/orders/${orderId}`);
      const currentStatus = currentOrder.data.data.status;
      const currentIndex = statuses.indexOf(currentStatus);
      
      if (currentIndex < statuses.length - 1) {
        const nextStatus = statuses[currentIndex + 1];
        const response = await axios.put(`/orders/${orderId}/status`, {
          status: nextStatus,
          shippingStatus: nextStatus === 'shipped' ? 'in_transit' : nextStatus === 'delivered' ? 'delivered' : 'pending'
        });

        if (response.data.success) {
          this.showNotification(`${this.t('Order status updated to')} ${this.t(nextStatus)}!`, 'success');
          // Refresh the page
          this.renderOrderDetails(response.data.data);
        }
      } else {
        this.showNotification(this.t('Order is already at final status'), 'info');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      this.showNotification(this.t('Failed to update order status'), 'error');
    }
  }

  trackOrder(orderNumber) {
    this.showNotification(`${this.t('Tracking order')} ${orderNumber} - ${this.t('Feature coming soon!')}`, 'info');
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

// Expose app instance globally for callbacks
window.app = app;

// Hide loading indicator
document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
});