-- Update Product Images with Real Photos

-- Clear existing placeholder images (if any)
DELETE FROM product_images;

-- AMD Ryzen 8000 Series (can be used for our 7800X3D which is similar generation)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(2, 'https://page.gensparksite.com/v1/base64_upload/a172e2897063d2fba0ae653df9aa61c4', 'AMD Ryzen 7 7800X3D Processor Box', 'AMD Ryzen 7 7800X3D プロセッサーボックス', 1, 1);

-- AMD Ryzen 7000 Series (for our other AMD CPU)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(1, 'https://page.gensparksite.com/v1/base64_upload/9e74afa09ea4461a325f83770bde5a2c', 'Intel Core i7-13700K Alternative AMD Ryzen', 'Intel Core i7-13700K代替AMDライゼン', 1, 1);

-- MSI GeForce RTX 4070 Super (matches our ASUS RTX 4070)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(3, 'https://page.gensparksite.com/v1/base64_upload/e5b3783e49d4fd0ee432ef9181144bac', 'MSI GeForce RTX 4070 Super Graphics Card', 'MSI GeForce RTX 4070 Super グラフィックスカード', 1, 1);

-- GeForce RTX 4070 White (for our MSI RX 7700 XT as alternative view)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(4, 'https://page.gensparksite.com/v1/base64_upload/10f9d598d077411ff03cf082da78270b', 'High-end Graphics Card White Design', '高級グラフィックスカード白デザイン', 1, 1);

-- Black Gaming Motherboard (for ASUS Z790-A)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(5, 'https://page.gensparksite.com/v1/base64_upload/807b2f149d37f1f84f5277f55c374747', 'ASUS PRIME Z790-A WIFI Gaming Motherboard', 'ASUS PRIME Z790-A WIFI ゲーミングマザーボード', 1, 1);

-- MSI White Motherboard (for MSI B650)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(6, 'https://page.gensparksite.com/v1/base64_upload/39948c65ba8e7718209ee5c24b1e02f3', 'MSI B650 GAMING PLUS WIFI White Motherboard', 'MSI B650 GAMING PLUS WIFI 白マザーボード', 1, 1);

-- PC Build Setup (can be used for memory products to show in-system context)
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(7, 'https://page.gensparksite.com/v1/base64_upload/38e10338e7a138c0cd1e3f35fc9b01c2', 'G.Skill Trident Z5 32GB in Gaming PC Build', 'ゲーミングPC構築のG.Skill Trident Z5 32GB', 1, 1),
(8, 'https://page.gensparksite.com/v1/base64_upload/38e10338e7a138c0cd1e3f35fc9b01c2', 'Corsair Vengeance LPX in PC Build Setup', 'PC構築でのCorsair Vengeance LPX', 1, 1);

-- Add some secondary images for variety
INSERT INTO product_images (product_id, image_url, alt_text_en, alt_text_jp, sort_order, is_primary) VALUES
(3, 'https://page.gensparksite.com/v1/base64_upload/10f9d598d077411ff03cf082da78270b', 'RTX 4070 Alternative Design View', 'RTX 4070代替デザインビュー', 2, 0),
(5, 'https://page.gensparksite.com/v1/base64_upload/39948c65ba8e7718209ee5c24b1e02f3', 'High-end Motherboard Alternative View', '高級マザーボード代替ビュー', 2, 0);