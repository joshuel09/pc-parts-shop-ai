-- Insert sample users
INSERT OR IGNORE INTO users (id, first_name, last_name, email, role) VALUES 
  (1, 'John', 'Smith', 'john.smith@example.com', 'customer'),
  (2, 'Sarah', 'Johnson', 'sarah.johnson@example.com', 'customer'),
  (3, 'Mike', 'Wilson', 'mike.wilson@example.com', 'customer'),
  (4, 'Emily', 'Brown', 'emily.brown@example.com', 'customer'),
  (5, 'David', 'Davis', 'david.davis@example.com', 'customer'),
  (6, 'Lisa', 'Miller', 'lisa.miller@example.com', 'customer'),
  (7, 'Chris', 'Anderson', 'chris.anderson@example.com', 'customer'),
  (8, 'Amy', 'Taylor', 'amy.taylor@example.com', 'customer');

-- Insert sample categories
INSERT OR IGNORE INTO categories (id, name_en, name_jp) VALUES 
  (1, 'CPU', 'CPU'),
  (2, 'GPU', 'GPU'), 
  (3, 'Motherboard', 'マザーボード'),
  (4, 'Memory', 'メモリ'),
  (5, 'Storage', 'ストレージ'),
  (6, 'Power Supply', '電源ユニット'),
  (7, 'Case', 'ケース'),
  (8, 'Cooling', 'クーリング');

-- Insert sample brands
INSERT OR IGNORE INTO brands (id, name) VALUES 
  (1, 'AMD'),
  (2, 'Intel'),
  (3, 'NVIDIA'),
  (4, 'ASUS'),
  (5, 'MSI'),
  (6, 'Corsair'),
  (7, 'G.Skill'),
  (8, 'Samsung'),
  (9, 'Western Digital'),
  (10, 'Seasonic');

-- Insert sample products
INSERT OR IGNORE INTO products (id, name_en, name_jp, description_en, price, inventory_quantity, category_id, brand_id, image_url) VALUES 
  (1, 'AMD Ryzen 9 7950X', 'AMD Ryzen 9 7950X', 'High-performance 16-core processor', 89800, 15, 1, 1, '/static/placeholder.svg'),
  (2, 'Intel Core i9-13900K', 'Intel Core i9-13900K', 'Latest Intel flagship processor', 75900, 12, 1, 2, '/static/placeholder.svg'),
  (3, 'NVIDIA RTX 4090', 'NVIDIA RTX 4090', 'Ultimate gaming graphics card', 249800, 8, 2, 3, '/static/placeholder.svg'),
  (4, 'NVIDIA RTX 4080', 'NVIDIA RTX 4080', 'High-end gaming graphics card', 189800, 10, 2, 3, '/static/placeholder.svg'),
  (5, 'ASUS ROG Strix Z790-E', 'ASUS ROG Strix Z790-E', 'Premium Intel Z790 motherboard', 58900, 20, 3, 4, '/static/placeholder.svg'),
  (6, 'MSI MAG X670E Tomahawk', 'MSI MAG X670E Tomahawk', 'AMD X670E motherboard', 45900, 18, 3, 5, '/static/placeholder.svg'),
  (7, 'G.Skill Trident Z5 32GB', 'G.Skill Trident Z5 32GB', 'DDR5-6000 32GB memory kit', 28900, 25, 4, 7, '/static/placeholder.svg'),
  (8, 'Corsair Vengeance LPX 32GB', 'Corsair Vengeance LPX 32GB', 'DDR4-3200 32GB memory kit', 19900, 30, 4, 6, '/static/placeholder.svg'),
  (9, 'Samsung 980 PRO 2TB', 'Samsung 980 PRO 2TB', 'NVMe SSD with PCIe 4.0', 35900, 22, 5, 8, '/static/placeholder.svg'),
  (10, 'WD Black SN850X 1TB', 'WD Black SN850X 1TB', 'High-speed gaming SSD', 18900, 28, 5, 9, '/static/placeholder.svg'),
  (11, 'Seasonic Focus GX-850', 'Seasonic Focus GX-850', '850W 80+ Gold modular PSU', 18900, 15, 6, 10, '/static/placeholder.svg'),
  (12, 'Corsair RM850x', 'Corsair RM850x', '850W 80+ Gold fully modular PSU', 21900, 12, 6, 6, '/static/placeholder.svg');

-- Insert sample orders with dates spread across multiple months
INSERT OR IGNORE INTO orders (id, user_id, status, total_amount, created_at) VALUES 
  -- September 2024 orders
  (1, 1, 'delivered', 165700, '2024-09-05 10:30:00'),
  (2, 2, 'delivered', 249800, '2024-09-08 14:15:00'),
  (3, 3, 'delivered', 89800, '2024-09-12 09:45:00'),
  (4, 4, 'delivered', 104800, '2024-09-15 16:20:00'),
  (5, 5, 'delivered', 75900, '2024-09-18 11:10:00'),
  (6, 6, 'delivered', 298700, '2024-09-22 13:45:00'),
  (7, 7, 'delivered', 58900, '2024-09-25 10:15:00'),
  (8, 8, 'delivered', 48800, '2024-09-28 15:30:00'),

  -- October 2024 orders (current month for testing)
  (9, 1, 'delivered', 189800, '2024-10-02 09:20:00'),
  (10, 2, 'delivered', 145800, '2024-10-05 14:30:00'),
  (11, 3, 'processing', 89800, '2024-10-08 11:45:00'),
  (12, 4, 'shipped', 219700, '2024-10-10 16:15:00'),
  (13, 5, 'delivered', 75900, '2024-10-12 10:00:00'),
  (14, 6, 'delivered', 349600, '2024-10-15 13:20:00'),
  (15, 7, 'processing', 28900, '2024-10-17 09:45:00'),
  (16, 8, 'pending', 54800, '2024-10-18 08:30:00');

-- Insert sample order items
INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, price) VALUES 
  -- Order 1 (Sep)
  (1, 1, 1, 89800), (1, 7, 1, 28900), (1, 9, 1, 35900), (1, 11, 1, 18900),
  -- Order 2 (Sep)
  (2, 3, 1, 249800),
  -- Order 3 (Sep)
  (3, 1, 1, 89800),
  -- Order 4 (Sep)
  (4, 5, 1, 58900), (4, 12, 1, 21900), (4, 10, 1, 18900),
  -- Order 5 (Sep)
  (5, 2, 1, 75900),
  -- Order 6 (Sep)
  (6, 3, 1, 249800), (6, 7, 1, 28900), (6, 9, 1, 35900),
  -- Order 7 (Sep)
  (7, 5, 1, 58900),
  -- Order 8 (Sep)
  (8, 8, 1, 19900), (8, 10, 1, 18900),
  -- Order 9 (Oct)
  (9, 4, 1, 189800),
  -- Order 10 (Oct)
  (10, 6, 1, 45900), (10, 7, 1, 28900), (10, 11, 1, 18900), (10, 9, 1, 35900), (10, 10, 1, 18900),
  -- Order 11 (Oct)
  (11, 1, 1, 89800),
  -- Order 12 (Oct)
  (12, 4, 1, 189800), (12, 8, 1, 19900), (12, 11, 1, 18900),
  -- Order 13 (Oct)
  (13, 2, 1, 75900),
  -- Order 14 (Oct)
  (14, 3, 1, 249800), (14, 1, 1, 89800), (14, 12, 1, 21900),
  -- Order 15 (Oct)
  (15, 7, 1, 28900),
  -- Order 16 (Oct)
  (16, 8, 1, 19900), (16, 9, 1, 35900);