-- Test notifications for admin panel
-- This adds some sample notifications to test the bell icon and notification page

-- First, get admin user ID (replace with actual admin user ID from your auth)
INSERT INTO notifications (user_id, title, body, channel, created_at) VALUES
('9b9ba38b-9100-40a1-8329-a044a6752089', 'New booking request', 'A customer has requested a plumber service for tomorrow at 2 PM', 'in_app', now() - interval '5 minutes'),
('9b9ba38b-9100-40a1-8329-a044a6752089', 'Payment received', 'Payment of ₹1,500 received for booking #B123456', 'in_app', now() - interval '15 minutes'),
('9b9ba38b-9100-40a1-8329-a044a6752089', 'Helper verification pending', '3 new helper verification requests require review', 'in_app', now() - interval '30 minutes'),
('9b9ba38b-9100-40a1-8329-a044a6752089', 'System update completed', 'Platform update v2.1.0 deployed successfully', 'in_app', now() - interval '2 hours'),
('9b9ba38b-9100-40a1-8329-a044a6752089', 'Monthly report ready', 'Your monthly analytics report is available for download', 'in_app', now() - interval '1 day');

-- Sample notification template if the table exists
INSERT INTO notification_templates (template_key, channel, title, body, is_active) VALUES
  ('booking_created', 'in_app', 'New Booking Created', 'Booking #{{booking_id}} has been created by {{customer_name}}', true),
  ('payment_received', 'in_app', 'Payment Received', 'Payment of ₹{{amount}} received for booking #{{booking_id}}', true),
  ('helper_verified', 'in_app', 'Helper Verified', 'Helper {{helper_name}} has been successfully verified', true),
  ('system_maintenance', 'in_app', 'System Maintenance', 'System maintenance scheduled for {{date}} at {{time}}', true)
ON CONFLICT (template_key) DO NOTHING;

-- Show current notification tables structure
SELECT 'notifications' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
UNION ALL
SELECT 'notification_templates' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_templates' 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;