-- Seed data for PC Parts E-commerce Shop

-- Insert categories
INSERT OR IGNORE INTO categories (id, name_en, name_jp, slug, description_en, description_jp, sort_order) VALUES
(1, 'Processors (CPU)', 'プロセッサー (CPU)', 'processors', 'Central Processing Units from Intel and AMD', 'インテルとAMDのCPU', 1),
(2, 'Graphics Cards (GPU)', 'グラフィックスカード (GPU)', 'graphics-cards', 'Graphics Processing Units for gaming and professional work', 'ゲームや業務用GPU', 2),
(3, 'Motherboards', 'マザーボード', 'motherboards', 'Motherboards for Intel and AMD processors', 'IntelとAMD対応マザーボード', 3),
(4, 'Memory (RAM)', 'メモリ (RAM)', 'memory', 'System Memory modules DDR4 and DDR5', 'DDR4とDDR5システムメモリ', 4),
(5, 'Storage', 'ストレージ', 'storage', 'SSDs, HDDs, and NVMe drives', 'SSD、HDD、NVMeドライブ', 5),
(6, 'Power Supplies', '電源ユニット', 'power-supplies', 'Modular and non-modular power supply units', 'モジュラー・非モジュラー電源', 6),
(7, 'Cases', 'PCケース', 'cases', 'ATX, Micro-ATX, and Mini-ITX cases', 'ATX、Micro-ATX、Mini-ITXケース', 7),
(8, 'Cooling', '冷却システム', 'cooling', 'CPU coolers, case fans, and liquid cooling', 'CPUクーラー、ケースファン、水冷', 8),
(9, 'Peripherals', '周辺機器', 'peripherals', 'Keyboards, mice, monitors, and headsets', 'キーボード、マウス、モニター、ヘッドセット', 9);

-- Insert brands
INSERT OR IGNORE INTO brands (id, name, description_en, description_jp) VALUES
(1, 'Intel', 'Leading processor and technology manufacturer', '主要プロセッサー・技術メーカー'),
(2, 'AMD', 'Advanced Micro Devices - processors and graphics', 'AMD - プロセッサーとグラフィックス'),
(3, 'NVIDIA', 'Graphics processing and AI technology leader', 'グラフィックス・AI技術のリーダー'),
(4, 'ASUS', 'Computer hardware and electronics manufacturer', 'コンピューターハードウェア・電子機器メーカー'),
(5, 'MSI', 'Micro-Star International - gaming hardware', 'MSI - ゲーミングハードウェア'),
(6, 'Corsair', 'Gaming peripherals and PC components', 'ゲーミング周辺機器・PCパーツ'),
(7, 'G.Skill', 'High-performance memory modules', '高性能メモリモジュール'),
(8, 'Samsung', 'Storage and memory technology', 'ストレージ・メモリ技術'),
(9, 'Western Digital', 'Data storage solutions', 'データストレージソリューション'),
(10, 'Seasonic', 'Power supply manufacturer', '電源ユニットメーカー');

-- Insert sample products

-- Processors
INSERT OR IGNORE INTO products (id, sku, name_en, name_jp, description_en, description_jp, short_description_en, short_description_jp, price, compare_price, inventory_quantity, category_id, brand_id, is_featured, specifications_json) VALUES
(1, 'CPU-INTEL-13700K', 'Intel Core i7-13700K', 'Intel Core i7-13700K', 'High-performance 13th gen processor with 16 cores and 24 threads', '16コア24スレッドの高性能第13世代プロセッサー', '13th gen Intel processor', '第13世代Intelプロセッサー', 52800.00, 58800.00, 25, 1, 1, 1, '{"cores": 16, "threads": 24, "base_clock": "3.4 GHz", "boost_clock": "5.4 GHz", "socket": "LGA1700", "tdp": "125W"}'),
(2, 'CPU-AMD-7800X3D', 'AMD Ryzen 7 7800X3D', 'AMD Ryzen 7 7800X3D', 'Gaming-optimized processor with 3D V-Cache technology', '3D V-Cache技術搭載ゲーミング最適化プロセッサー', '3D V-Cache gaming CPU', '3D V-Cacheゲーミング CPU', 68800.00, 74800.00, 15, 1, 2, 1, '{"cores": 8, "threads": 16, "base_clock": "4.2 GHz", "boost_clock": "5.0 GHz", "socket": "AM5", "tdp": "120W"}');

-- Graphics Cards
INSERT OR IGNORE INTO products (id, sku, name_en, name_jp, description_en, description_jp, short_description_en, short_description_jp, price, compare_price, inventory_quantity, category_id, brand_id, is_featured, specifications_json) VALUES
(3, 'GPU-RTX4070-ASUS', 'ASUS GeForce RTX 4070 DUAL', 'ASUS GeForce RTX 4070 DUAL', 'High-performance graphics card with DLSS 3 and ray tracing', 'DLSS 3とレイトレーシング対応高性能グラフィックスカード', 'RTX 4070 graphics card', 'RTX 4070 グラフィックスカード', 98800.00, 108800.00, 12, 2, 4, 1, '{"memory": "12GB GDDR6X", "memory_bus": "192-bit", "boost_clock": "2475 MHz", "cuda_cores": 5888, "power_consumption": "200W"}'),
(4, 'GPU-RX7700XT-MSI', 'MSI Radeon RX 7700 XT GAMING X', 'MSI Radeon RX 7700 XT GAMING X', 'AMD RDNA 3 architecture with excellent 1440p performance', '優秀な1440p性能を持つAMD RDNA 3アーキテクチャ', 'RX 7700 XT gaming card', 'RX 7700 XT ゲーミングカード', 78800.00, 88800.00, 8, 2, 5, 0, '{"memory": "12GB GDDR6", "memory_bus": "192-bit", "boost_clock": "2544 MHz", "stream_processors": 3456, "power_consumption": "245W"}');

-- Motherboards
INSERT OR IGNORE INTO products (id, sku, name_en, name_jp, description_en, description_jp, short_description_en, short_description_jp, price, compare_price, inventory_quantity, category_id, brand_id, is_featured, specifications_json) VALUES
(5, 'MB-ASUS-Z790-A', 'ASUS PRIME Z790-A WIFI', 'ASUS PRIME Z790-A WIFI', 'ATX motherboard for 12th and 13th gen Intel processors', '第12・13世代Intel CPU対応ATXマザーボード', 'Z790 ATX motherboard', 'Z790 ATXマザーボード', 32800.00, 38800.00, 20, 3, 4, 0, '{"socket": "LGA1700", "chipset": "Z790", "memory_support": "DDR5-5600", "expansion_slots": "PCIe 5.0 x16, PCIe 4.0 x16", "form_factor": "ATX"}'),
(6, 'MB-MSI-B650-PRO', 'MSI B650 GAMING PLUS WIFI', 'MSI B650 GAMING PLUS WIFI', 'AMD B650 chipset motherboard with WiFi 6E', 'WiFi 6E搭載AMD B650チップセットマザーボード', 'B650 gaming motherboard', 'B650 ゲーミングマザーボード', 25800.00, 29800.00, 18, 3, 5, 0, '{"socket": "AM5", "chipset": "B650", "memory_support": "DDR5-4800", "expansion_slots": "PCIe 4.0 x16, PCIe 4.0 x1", "form_factor": "ATX"}');

-- Memory
INSERT OR IGNORE INTO products (id, sku, name_en, name_jp, description_en, description_jp, short_description_en, short_description_jp, price, compare_price, inventory_quantity, category_id, brand_id, is_featured, specifications_json) VALUES
(7, 'RAM-GSKILL-32GB-6000', 'G.Skill Trident Z5 32GB DDR5-6000', 'G.Skill Trident Z5 32GB DDR5-6000', 'High-performance DDR5 memory kit optimized for gaming', 'ゲーミング最適化高性能DDR5メモリキット', '32GB DDR5-6000 kit', '32GB DDR5-6000 キット', 28800.00, 32800.00, 30, 4, 7, 0, '{"capacity": "32GB (2x16GB)", "speed": "DDR5-6000", "timings": "CL36-36-36-96", "voltage": "1.35V", "heat_spreader": "Aluminum"}'),
(8, 'RAM-CORSAIR-16GB-5600', 'Corsair Vengeance LPX 16GB DDR5-5600', 'Corsair Vengeance LPX 16GB DDR5-5600', 'Reliable DDR5 memory with low profile design', '低プロファイル設計の信頼性の高いDDR5メモリ', '16GB DDR5-5600 kit', '16GB DDR5-5600 キット', 18800.00, 21800.00, 45, 4, 6, 0, '{"capacity": "16GB (2x8GB)", "speed": "DDR5-5600", "timings": "CL36-36-36-76", "voltage": "1.25V", "heat_spreader": "Aluminum"}');

-- Storage
INSERT OR IGNORE INTO products (id, sku, name_en, name_jp, description_en, description_jp, short_description_en, short_description_jp, price, compare_price, inventory_quantity, category_id, brand_id, is_featured, specifications_json) VALUES
(9, 'SSD-SAMSUNG-1TB-980PRO', 'Samsung 980 PRO 1TB NVMe SSD', 'Samsung 980 PRO 1TB NVMe SSD', 'High-performance PCIe 4.0 NVMe SSD for gaming and professionals', 'ゲーミング・プロ向け高性能PCIe 4.0 NVMe SSD', '1TB PCIe 4.0 NVMe SSD', '1TB PCIe 4.0 NVMe SSD', 18800.00, 22800.00, 35, 5, 8, 0, '{"capacity": "1TB", "interface": "PCIe 4.0 NVMe", "read_speed": "7000 MB/s", "write_speed": "5000 MB/s", "form_factor": "M.2 2280"}'),
(10, 'HDD-WD-2TB-BLACK', 'WD Black 2TB HDD', 'WD Black 2TB HDD', 'High-performance 7200 RPM hard drive for gaming', 'ゲーミング向け高性能7200回転ハードドライブ', '2TB gaming HDD', '2TB ゲーミング HDD', 12800.00, 14800.00, 40, 5, 9, 0, '{"capacity": "2TB", "speed": "7200 RPM", "cache": "64MB", "interface": "SATA 6Gb/s", "form_factor": "3.5 inch"}');

-- Add admin user
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified) VALUES
(1, 'admin@pcpartsshop.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF8gocl3yLPdvdq', 'Admin', 'User', 'admin', 1, 1);

-- Add some sample reviews
INSERT OR IGNORE INTO reviews (product_id, user_id, rating, title, comment, reviewer_name, reviewer_email, is_verified_purchase, is_published) VALUES
(1, 1, 5, 'Excellent Performance', 'Great CPU for gaming and productivity. Runs cool and quiet.', 'John Doe', 'john@example.com', 1, 1),
(1, 1, 4, 'Good but expensive', 'Performance is great but price could be better.', 'Jane Smith', 'jane@example.com', 0, 1),
(3, 1, 5, 'Amazing Graphics Card', 'Perfect for 1440p gaming. DLSS 3 is a game changer.', 'Mike Johnson', 'mike@example.com', 1, 1),
(7, 1, 5, 'Fast and Reliable', 'No issues with this memory kit. XMP profile works perfectly.', 'Sarah Wilson', 'sarah@example.com', 1, 1);