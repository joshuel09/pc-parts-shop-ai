-- Insert sample users
INSERT OR IGNORE INTO users (id, first_name, last_name, email, phone) VALUES 
  (1, 'John', 'Smith', 'john.smith@example.com', '090-1234-5678'),
  (2, 'Sarah', 'Johnson', 'sarah.johnson@example.com', '090-2345-6789'),
  (3, 'Mike', 'Wilson', 'mike.wilson@example.com', '090-3456-7890'),
  (4, 'Emily', 'Brown', 'emily.brown@example.com', '090-4567-8901'),
  (5, 'David', 'Davis', 'david.davis@example.com', '090-5678-9012'),
  (6, 'Lisa', 'Miller', 'lisa.miller@example.com', '090-6789-0123'),
  (7, 'Chris', 'Anderson', 'chris.anderson@example.com', '090-7890-1234'),
  (8, 'Amy', 'Taylor', 'amy.taylor@example.com', '090-8901-2345');

-- Insert sample orders with realistic data across multiple months for testing dashboard analytics
INSERT OR IGNORE INTO orders (
  id, order_number, user_id, email, status, subtotal, total_amount, 
  shipping_first_name, shipping_last_name, created_at
) VALUES 
  -- September 2024 orders
  (1, 'ORD-2024-09-001', 1, 'john.smith@example.com', 'delivered', 165700, 165700, 'John', 'Smith', '2024-09-05 10:30:00'),
  (2, 'ORD-2024-09-002', 2, 'sarah.johnson@example.com', 'delivered', 249800, 249800, 'Sarah', 'Johnson', '2024-09-08 14:15:00'),
  (3, 'ORD-2024-09-003', 3, 'mike.wilson@example.com', 'delivered', 89800, 89800, 'Mike', 'Wilson', '2024-09-12 09:45:00'),
  (4, 'ORD-2024-09-004', 4, 'emily.brown@example.com', 'delivered', 104800, 104800, 'Emily', 'Brown', '2024-09-15 16:20:00'),
  (5, 'ORD-2024-09-005', 5, 'david.davis@example.com', 'delivered', 75900, 75900, 'David', 'Davis', '2024-09-18 11:10:00'),
  (6, 'ORD-2024-09-006', 6, 'lisa.miller@example.com', 'delivered', 298700, 298700, 'Lisa', 'Miller', '2024-09-22 13:45:00'),
  (7, 'ORD-2024-09-007', 7, 'chris.anderson@example.com', 'delivered', 58900, 58900, 'Chris', 'Anderson', '2024-09-25 10:15:00'),
  (8, 'ORD-2024-09-008', 8, 'amy.taylor@example.com', 'delivered', 48800, 48800, 'Amy', 'Taylor', '2024-09-28 15:30:00'),

  -- October 2024 orders (current month for testing)
  (9, 'ORD-2024-10-001', 1, 'john.smith@example.com', 'delivered', 189800, 189800, 'John', 'Smith', '2024-10-02 09:20:00'),
  (10, 'ORD-2024-10-002', 2, 'sarah.johnson@example.com', 'delivered', 145800, 145800, 'Sarah', 'Johnson', '2024-10-05 14:30:00'),
  (11, 'ORD-2024-10-003', 3, 'mike.wilson@example.com', 'processing', 89800, 89800, 'Mike', 'Wilson', '2024-10-08 11:45:00'),
  (12, 'ORD-2024-10-004', 4, 'emily.brown@example.com', 'shipped', 219700, 219700, 'Emily', 'Brown', '2024-10-10 16:15:00'),
  (13, 'ORD-2024-10-005', 5, 'david.davis@example.com', 'delivered', 75900, 75900, 'David', 'Davis', '2024-10-12 10:00:00'),
  (14, 'ORD-2024-10-006', 6, 'lisa.miller@example.com', 'delivered', 349600, 349600, 'Lisa', 'Miller', '2024-10-15 13:20:00'),
  (15, 'ORD-2024-10-007', 7, 'chris.anderson@example.com', 'processing', 28900, 28900, 'Chris', 'Anderson', '2024-10-17 09:45:00'),
  (16, 'ORD-2024-10-008', 8, 'amy.taylor@example.com', 'pending', 54800, 54800, 'Amy', 'Taylor', '2024-10-18 08:30:00'),

  -- Additional October orders for more data
  (17, 'ORD-2024-10-009', 1, 'john.smith@example.com', 'delivered', 125600, 125600, 'John', 'Smith', '2024-10-01 14:20:00'),
  (18, 'ORD-2024-10-010', 2, 'sarah.johnson@example.com', 'delivered', 98700, 98700, 'Sarah', 'Johnson', '2024-10-03 16:45:00'),
  (19, 'ORD-2024-10-011', 3, 'mike.wilson@example.com', 'shipped', 167800, 167800, 'Mike', 'Wilson', '2024-10-06 12:30:00'),
  (20, 'ORD-2024-10-012', 4, 'emily.brown@example.com', 'delivered', 89900, 89900, 'Emily', 'Brown', '2024-10-09 10:15:00'),

  -- August 2024 orders (previous month)
  (21, 'ORD-2024-08-001', 1, 'john.smith@example.com', 'delivered', 156700, 156700, 'John', 'Smith', '2024-08-05 11:30:00'),
  (22, 'ORD-2024-08-002', 2, 'sarah.johnson@example.com', 'delivered', 198800, 198800, 'Sarah', 'Johnson', '2024-08-12 15:20:00'),
  (23, 'ORD-2024-08-003', 3, 'mike.wilson@example.com', 'delivered', 78900, 78900, 'Mike', 'Wilson', '2024-08-18 09:45:00'),
  (24, 'ORD-2024-08-004', 4, 'emily.brown@example.com', 'delivered', 145600, 145600, 'Emily', 'Brown', '2024-08-25 14:10:00');