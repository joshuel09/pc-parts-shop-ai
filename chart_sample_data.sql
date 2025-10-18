-- Add more orders with various dates and statuses for chart testing
-- Using existing user_id 999 (Demo User) to avoid foreign key constraints

INSERT INTO orders (
  order_number, user_id, email, status, subtotal, total_amount, 
  shipping_first_name, shipping_last_name, created_at
) VALUES 
  -- September 2024 orders
  ('PC85000001', 999, 'demo@pcpartsshop.com', 'delivered', 145000, 159500, 'Demo', 'User', '2024-09-05 10:30:00'),
  ('PC85000002', 999, 'demo@pcpartsshop.com', 'delivered', 98000, 107800, 'Demo', 'User', '2024-09-08 14:15:00'),
  ('PC85000003', 999, 'demo@pcpartsshop.com', 'delivered', 235000, 258500, 'Demo', 'User', '2024-09-12 09:45:00'),
  ('PC85000004', 999, 'demo@pcpartsshop.com', 'delivered', 67000, 73700, 'Demo', 'User', '2024-09-15 16:20:00'),
  ('PC85000005', 999, 'demo@pcpartsshop.com', 'delivered', 189000, 207900, 'Demo', 'User', '2024-09-18 11:10:00'),
  ('PC85000006', 999, 'demo@pcpartsshop.com', 'delivered', 124000, 136400, 'Demo', 'User', '2024-09-22 13:45:00'),
  ('PC85000007', 999, 'demo@pcpartsshop.com', 'delivered', 78000, 85800, 'Demo', 'User', '2024-09-25 10:15:00'),
  ('PC85000008', 999, 'demo@pcpartsshop.com', 'delivered', 156000, 171600, 'Demo', 'User', '2024-09-28 15:30:00'),

  -- October 2024 orders (current month for testing)
  ('PC85000009', 999, 'demo@pcpartsshop.com', 'delivered', 189000, 207900, 'Demo', 'User', '2024-10-01 09:20:00'),
  ('PC85000010', 999, 'demo@pcpartsshop.com', 'delivered', 134000, 147400, 'Demo', 'User', '2024-10-03 14:30:00'),
  ('PC85000011', 999, 'demo@pcpartsshop.com', 'processing', 89000, 97900, 'Demo', 'User', '2024-10-05 11:45:00'),
  ('PC85000012', 999, 'demo@pcpartsshop.com', 'shipped', 210000, 231000, 'Demo', 'User', '2024-10-07 16:15:00'),
  ('PC85000013', 999, 'demo@pcpartsshop.com', 'delivered', 75000, 82500, 'Demo', 'User', '2024-10-09 10:00:00'),
  ('PC85000014', 999, 'demo@pcpartsshop.com', 'delivered', 340000, 374000, 'Demo', 'User', '2024-10-11 13:20:00'),
  ('PC85000015', 999, 'demo@pcpartsshop.com', 'processing', 28000, 30800, 'Demo', 'User', '2024-10-13 09:45:00'),
  ('PC85000016', 999, 'demo@pcpartsshop.com', 'pending', 54000, 59400, 'Demo', 'User', '2024-10-15 08:30:00'),
  ('PC85000017', 999, 'demo@pcpartsshop.com', 'delivered', 125000, 137500, 'Demo', 'User', '2024-10-16 14:20:00'),
  ('PC85000018', 999, 'demo@pcpartsshop.com', 'delivered', 98000, 107800, 'Demo', 'User', '2024-10-17 16:45:00'),

  -- August 2024 orders (previous month for comparison)
  ('PC84000001', 999, 'demo@pcpartsshop.com', 'delivered', 156000, 171600, 'Demo', 'User', '2024-08-05 11:30:00'),
  ('PC84000002', 999, 'demo@pcpartsshop.com', 'delivered', 198000, 217800, 'Demo', 'User', '2024-08-12 15:20:00'),
  ('PC84000003', 999, 'demo@pcpartsshop.com', 'delivered', 78000, 85800, 'Demo', 'User', '2024-08-18 09:45:00'),
  ('PC84000004', 999, 'demo@pcpartsshop.com', 'delivered', 145000, 159500, 'Demo', 'User', '2024-08-25 14:10:00'),

  -- July 2024 orders for more historical data
  ('PC84000005', 999, 'demo@pcpartsshop.com', 'delivered', 234000, 257400, 'Demo', 'User', '2024-07-08 10:30:00'),
  ('PC84000006', 999, 'demo@pcpartsshop.com', 'delivered', 167000, 183700, 'Demo', 'User', '2024-07-15 14:15:00'),
  ('PC84000007', 999, 'demo@pcpartsshop.com', 'delivered', 89000, 97900, 'Demo', 'User', '2024-07-22 16:45:00'),

  -- More orders with cancelled status
  ('PC85000019', 999, 'demo@pcpartsshop.com', 'cancelled', 67000, 73700, 'Demo', 'User', '2024-10-14 12:30:00'),
  ('PC85000020', 999, 'demo@pcpartsshop.com', 'cancelled', 45000, 49500, 'Demo', 'User', '2024-10-12 15:15:00');