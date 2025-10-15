import type { Language } from '../types';

export const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.brands': 'Brands',
    'nav.cart': 'Cart',
    'nav.account': 'Account',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    
    // Common
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.price': 'Price',
    'common.quantity': 'Quantity',
    'common.total': 'Total',
    'common.subtotal': 'Subtotal',
    'common.tax': 'Tax',
    'common.shipping': 'Shipping',
    'common.discount': 'Discount',
    'common.currency.jpy': '¥',
    
    // Products
    'product.name': 'Product Name',
    'product.description': 'Description',
    'product.specifications': 'Specifications',
    'product.reviews': 'Reviews',
    'product.rating': 'Rating',
    'product.inStock': 'In Stock',
    'product.outOfStock': 'Out of Stock',
    'product.addToCart': 'Add to Cart',
    'product.buyNow': 'Buy Now',
    'product.compare': 'Compare',
    'product.wishlist': 'Add to Wishlist',
    'product.sku': 'SKU',
    'product.brand': 'Brand',
    'product.category': 'Category',
    'product.weight': 'Weight',
    'product.featured': 'Featured',
    
    // Categories
    'category.processors': 'Processors (CPU)',
    'category.graphics': 'Graphics Cards (GPU)',
    'category.motherboards': 'Motherboards',
    'category.memory': 'Memory (RAM)',
    'category.storage': 'Storage',
    'category.psu': 'Power Supplies',
    'category.cases': 'Cases',
    'category.cooling': 'Cooling',
    'category.peripherals': 'Peripherals',
    
    // Cart
    'cart.empty': 'Your cart is empty',
    'cart.items': 'Cart Items',
    'cart.checkout': 'Checkout',
    'cart.continueShopping': 'Continue Shopping',
    'cart.removeItem': 'Remove Item',
    'cart.updateQuantity': 'Update Quantity',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.shipping': 'Shipping Information',
    'checkout.billing': 'Billing Information',
    'checkout.payment': 'Payment Method',
    'checkout.review': 'Review Order',
    'checkout.placeOrder': 'Place Order',
    'checkout.firstName': 'First Name',
    'checkout.lastName': 'Last Name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.province': 'Province',
    'checkout.country': 'Country',
    'checkout.zipCode': 'Zip Code',
    
    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.products': 'Products',
    'admin.orders': 'Orders',
    'admin.customers': 'Customers',
    'admin.categories': 'Categories',
    'admin.brands': 'Brands',
    'admin.reviews': 'Reviews',
    'admin.settings': 'Settings',
    'admin.analytics': 'Analytics',
    
    // Forms
    'form.required': 'This field is required',
    'form.email.invalid': 'Please enter a valid email address',
    'form.password.minLength': 'Password must be at least 6 characters',
    'form.password.confirm': 'Passwords do not match',
    
    // Messages
    'message.loginSuccess': 'Logged in successfully',
    'message.loginFailed': 'Login failed',
    'message.registerSuccess': 'Account created successfully',
    'message.registerFailed': 'Registration failed',
    'message.addedToCart': 'Added to cart',
    'message.removedFromCart': 'Removed from cart',
    'message.orderPlaced': 'Order placed successfully',
    'message.orderFailed': 'Failed to place order',
    
    // Filters
    'filter.all': 'All',
    'filter.inStock': 'In Stock',
    'filter.onSale': 'On Sale',
    'filter.featured': 'Featured',
    'filter.priceRange': 'Price Range',
    'filter.brand': 'Brand',
    'filter.category': 'Category',
    
    // Sort options
    'sort.relevance': 'Relevance',
    'sort.priceAsc': 'Price: Low to High',
    'sort.priceDesc': 'Price: High to Low',
    'sort.nameAsc': 'Name: A to Z',
    'sort.nameDesc': 'Name: Z to A',
    'sort.newest': 'Newest First',
    'sort.oldest': 'Oldest First',
    
    // Site content
    'PC Parts Shop': 'PC Parts Shop',
    'High Performance Computer Components': 'High Performance Computer Components',
    'Professional PC parts and components store. High-performance CPUs, GPUs, motherboards, memory, and more.': 'Professional PC parts and components store. High-performance CPUs, GPUs, motherboards, memory, and more.',
    'Search products...': 'Search products...',
    'Your trusted source for high-performance PC components.': 'Your trusted source for high-performance PC components.',
    'Processors': 'Processors',
    'Graphics Cards': 'Graphics Cards',
    'Motherboards': 'Motherboards',
    'Memory': 'Memory',
    'Help Center': 'Help Center',
    'Returns': 'Returns',
    'Shipping': 'Shipping',
    'Contact Us': 'Contact Us',
    'Follow Us': 'Follow Us',
    'All rights reserved.': 'All rights reserved.'
  },
  jp: {
    // Navigation
    'nav.home': 'ホーム',
    'nav.products': '製品',
    'nav.categories': 'カテゴリー',
    'nav.brands': 'ブランド',
    'nav.cart': 'カート',
    'nav.account': 'アカウント',
    'nav.admin': '管理者',
    'nav.login': 'ログイン',
    'nav.register': '新規登録',
    'nav.logout': 'ログアウト',
    
    // Common
    'common.search': '検索',
    'common.filter': 'フィルター',
    'common.sort': '並び替え',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.add': '追加',
    'common.remove': '削除',
    'common.price': '価格',
    'common.quantity': '数量',
    'common.total': '合計',
    'common.subtotal': '小計',
    'common.tax': '税金',
    'common.shipping': '送料',
    'common.discount': '割引',
    'common.currency.jpy': '¥',
    
    // Products
    'product.name': '製品名',
    'product.description': '説明',
    'product.specifications': '仕様',
    'product.reviews': 'レビュー',
    'product.rating': '評価',
    'product.inStock': '在庫あり',
    'product.outOfStock': '在庫切れ',
    'product.addToCart': 'カートに追加',
    'product.buyNow': '今すぐ購入',
    'product.compare': '比較',
    'product.wishlist': 'ウィッシュリストに追加',
    'product.sku': 'SKU',
    'product.brand': 'ブランド',
    'product.category': 'カテゴリー',
    'product.weight': '重量',
    'product.featured': 'おすすめ',
    
    // Categories
    'category.processors': 'プロセッサー (CPU)',
    'category.graphics': 'グラフィックスカード (GPU)',
    'category.motherboards': 'マザーボード',
    'category.memory': 'メモリ (RAM)',
    'category.storage': 'ストレージ',
    'category.psu': '電源ユニット',
    'category.cases': 'PCケース',
    'category.cooling': '冷却システム',
    'category.peripherals': '周辺機器',
    
    // Cart
    'cart.empty': 'カートは空です',
    'cart.items': 'カート商品',
    'cart.checkout': 'チェックアウト',
    'cart.continueShopping': '買い物を続ける',
    'cart.removeItem': '商品を削除',
    'cart.updateQuantity': '数量を更新',
    
    // Checkout
    'checkout.title': 'チェックアウト',
    'checkout.shipping': '配送情報',
    'checkout.billing': '請求情報',
    'checkout.payment': '支払い方法',
    'checkout.review': '注文確認',
    'checkout.placeOrder': '注文する',
    'checkout.firstName': '名',
    'checkout.lastName': '姓',
    'checkout.email': 'メールアドレス',
    'checkout.phone': '電話番号',
    'checkout.address': '住所',
    'checkout.city': '市区町村',
    'checkout.province': '都道府県',
    'checkout.country': '国',
    'checkout.zipCode': '郵便番号',
    
    // Admin
    'admin.dashboard': 'ダッシュボード',
    'admin.products': '製品',
    'admin.orders': '注文',
    'admin.customers': '顧客',
    'admin.categories': 'カテゴリー',
    'admin.brands': 'ブランド',
    'admin.reviews': 'レビュー',
    'admin.settings': '設定',
    'admin.analytics': '分析',
    
    // Forms
    'form.required': 'この項目は必須です',
    'form.email.invalid': '有効なメールアドレスを入力してください',
    'form.password.minLength': 'パスワードは6文字以上で入力してください',
    'form.password.confirm': 'パスワードが一致しません',
    
    // Messages
    'message.loginSuccess': 'ログインしました',
    'message.loginFailed': 'ログインに失敗しました',
    'message.registerSuccess': 'アカウントを作成しました',
    'message.registerFailed': '登録に失敗しました',
    'message.addedToCart': 'カートに追加しました',
    'message.removedFromCart': 'カートから削除しました',
    'message.orderPlaced': '注文が完了しました',
    'message.orderFailed': '注文に失敗しました',
    
    // Filters
    'filter.all': 'すべて',
    'filter.inStock': '在庫あり',
    'filter.onSale': 'セール中',
    'filter.featured': 'おすすめ',
    'filter.priceRange': '価格帯',
    'filter.brand': 'ブランド',
    'filter.category': 'カテゴリー',
    
    // Sort options
    'sort.relevance': '関連性',
    'sort.priceAsc': '価格: 安い順',
    'sort.priceDesc': '価格: 高い順',
    'sort.nameAsc': '名前: A-Z',
    'sort.nameDesc': '名前: Z-A',
    'sort.newest': '新しい順',
    'sort.oldest': '古い順',
    
    // Site content
    'PC Parts Shop': 'PCパーツショップ',
    'High Performance Computer Components': '高性能コンピューターコンポーネント',
    'Professional PC parts and components store. High-performance CPUs, GPUs, motherboards, memory, and more.': 'プロ用PCパーツおよびコンポーネントストア。高性能CPU、GPU、マザーボード、メモリなど。',
    'Search products...': '製品を検索...',
    'Your trusted source for high-performance PC components.': '高性能PCコンポーネントの信頼できるソース。',
    'Processors': 'プロセッサー',
    'Graphics Cards': 'グラフィックカード',
    'Motherboards': 'マザーボード',
    'Memory': 'メモリ',
    'Help Center': 'ヘルプセンター',
    'Returns': '返品',
    'Shipping': '配送',
    'Contact Us': 'お問い合わせ',
    'Follow Us': 'フォローしてください',
    'All rights reserved.': 'すべての権利が保留されています。'
  }
};

export function t(key: string, lang: Language = 'en'): string {
  return translations[lang][key as keyof typeof translations[typeof lang]] || key;
}

export function detectLanguage(request: Request): Language {
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang') as Language;
  
  if (langParam && (langParam === 'en' || langParam === 'jp')) {
    return langParam;
  }
  
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  if (acceptLanguage.includes('ja')) {
    return 'jp';
  }
  
  return 'en'; // Default to English
}