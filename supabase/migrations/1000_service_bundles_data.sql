-- Delete existing bundle data
DELETE FROM bundle_services;
DELETE FROM service_bundles;

-- Insert Service Bundles with different types based on service categories

-- 1. HOME MAINTENANCE PACKAGE (Home Services)
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, icon_url, banner_url, terms_conditions) VALUES
('B1000000-0000-0000-0000-000000000001', 
'Complete Home Maintenance Package', 
'Includes plumbing, electrical work, and AC service for comprehensive home maintenance', 
'package',
1050, 850, 90, 100, true, 
NULL, NULL,
'Valid for 90 days from purchase. All services must be booked within validity period. Services can be used separately. Non-refundable after purchase.');

-- Bundle Services for Home Maintenance Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 1, 300, 1), -- Plumbing
('B1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', 1, 350, 2), -- Electrical Work
('B1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000015', 1, 400, 3); -- AC Repair & Service

-- 2. DEEP CLEANING COMBO (Cleaning Services)
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B2000000-0000-0000-0000-000000000001', 
'Deep Home Cleaning Combo', 
'Complete house cleaning with bathroom, kitchen, and sofa cleaning included', 
'combo',
1350, 1050, 60, 150, true, 
'Valid for 60 days from purchase. Covers up to 3BHK apartment. Eco-friendly cleaning products used. 4-6 hours estimated completion time.');

-- Bundle Services for Deep Cleaning Combo
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B2000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000011', 1, 250, 1), -- House Cleaning
('B2000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000013', 2, 200, 2), -- Bathroom Cleaning (2 bathrooms)
('B2000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000014', 1, 500, 3), -- Kitchen Cleaning
('B2000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000015', 1, 400, 4); -- Sofa Cleaning

-- 3. BEAUTY & WELLNESS SPA PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B3000000-0000-0000-0000-000000000001', 
'Premium Spa & Beauty Package', 
'Complete beauty treatment including facial, massage, manicure & pedicure', 
'package',
2350, 1650, 45, 75, true, 
'Valid for 45 days from purchase. All services at your home. Professional beauticians. Premium products used.');

-- Bundle Services for Beauty Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B3000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000012', 1, 800, 1), -- Facial Treatment
('B3000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000013', 1, 600, 2), -- Massage Therapy
('B3000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000014', 1, 400, 3), -- Manicure & Pedicure
('B3000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000016', 1, 250, 4), -- Waxing & Threading
('B3000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', 1, 300, 5); -- Haircut & Styling

-- 4. CAR CARE COMPLETE PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B4000000-0000-0000-0000-000000000001', 
'Complete Car Care Package', 
'Full car maintenance including wash, tire service, and AC service', 
'package',
2000, 1200, 60, 100, true, 
'Valid for 60 days from purchase. Doorstep service available. Professional mechanics. Quality spare parts if needed.');

-- Bundle Services for Car Care Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B4000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', 1, 300, 1), -- Car Wash
('B4000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', 1, 400, 2), -- Tire Service
('B4000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000016', 1, 800, 3), -- Car AC Service
('B4000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014', 1, 500, 4); -- Battery Service

-- 5. COMPLETE PEST CONTROL SOLUTION
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B5000000-0000-0000-0000-000000000001', 
'Complete Pest Control Solution', 
'Comprehensive pest treatment for cockroach, termite, and mosquito control', 
'combo',
3900, 2400, 90, 50, true, 
'Valid for 90 days from purchase. 3 months warranty on treatment. Safe for kids and pets. Free follow-up inspection.');

-- Bundle Services for Pest Control Solution
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000011', 1, 800, 1), -- Cockroach Control
('B5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000012', 1, 1500, 2), -- Termite Control
('B5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000014', 1, 600, 3), -- Mosquito Control
('B5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000015', 1, 1000, 4); -- Rodent Control

-- 6. RELOCATION PACKAGE (Moving & Packing)
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B6000000-0000-0000-0000-000000000001', 
'Complete Home Relocation Package', 
'Full moving solution with packing, transportation, and furniture moving', 
'package',
4900, 3500, 30, 40, true, 
'Valid for 30 days from purchase. Suitable for 2BHK apartments. Professional packers. Insurance coverage available.');

-- Bundle Services for Relocation Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B6000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000011', 1, 4000, 1), -- Local Shifting
('B6000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000013', 3, 300, 2), -- Packing Services (3 hours)
('B6000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000014', 1, 1000, 3); -- Furniture Moving

-- 7. STUDENT LEARNING PACKAGE (Tutoring)
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B7000000-0000-0000-0000-000000000001', 
'Student Success Package', 
'Monthly academic tutoring with language classes', 
'package',
6000, 2800, 30, 60, true, 
'Valid for 30 days from purchase. 20 hours of tutoring included. Flexible scheduling. Progress reports provided.');

-- Bundle Services for Student Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B7000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000011', 12, 300, 1), -- Academic Tutoring (12 hours)
('B7000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000015', 8, 375, 2); -- Language Classes (8 hours)

-- 8. FITNESS & WELLNESS PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B7000000-0000-0000-0000-000000000002', 
'Monthly Fitness & Wellness Package', 
'Complete fitness solution with yoga and personal training', 
'subscription',
10000, 3000, 30, 50, true, 
'Valid for 30 days from purchase. 20 sessions included. At-home training. Personalized diet plan included.');

-- Bundle Services for Fitness Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B7000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000014', 20, 500, 1); -- Yoga & Fitness (20 hours)

-- 9. BIRTHDAY PARTY COMPLETE PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B8000000-0000-0000-0000-000000000001', 
'Ultimate Birthday Party Package', 
'All-inclusive birthday package with decoration, catering, and photography', 
'package',
21000, 17000, 60, 30, true, 
'Valid for 60 days from purchase. Suitable for 50 guests. Theme decoration included. 6 hours event coverage.');

-- Bundle Services for Birthday Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000011', 1, 5000, 1), -- Birthday Party Planning
('B8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000013', 1, 5000, 2), -- Catering Service
('B8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000014', 1, 4000, 3), -- Decoration Service
('B8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000015', 1, 7000, 4); -- Photography & Video

-- 10. GARDEN MAKEOVER PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('B9000000-0000-0000-0000-000000000001', 
'Complete Garden Makeover Package', 
'Transform your garden with design, maintenance, and irrigation', 
'package',
6400, 5000, 45, 25, true, 
'Valid for 45 days from purchase. Includes design consultation. Plants and materials extra. Maintenance guide provided.');

-- Bundle Services for Garden Makeover
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('B9000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000012', 1, 5000, 1), -- Garden Design
('B9000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000011', 1, 400, 2), -- Lawn Mowing
('B9000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000014', 2, 800, 3), -- Tree Trimming (2 trees)
('B9000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000016', 1, 600, 4); -- Garden Pest Control

-- 11. PET CARE MONTHLY PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('BA000000-0000-0000-0000-000000000001', 
'Monthly Pet Care Package', 
'Complete pet care with grooming, walking, and vet consultation', 
'subscription',
2500, 1600, 30, 40, true, 
'Valid for 30 days from purchase. 20 dog walking sessions. 1 grooming session. 1 vet consultation.');

-- Bundle Services for Pet Care Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('BA000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', 1, 500, 1), -- Pet Grooming
('BA000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000012', 20, 75, 2), -- Dog Walking (20 walks)
('BA000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000015', 1, 500, 3); -- Vet Consultation

-- 12. TECH SUPPORT PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('BB000000-0000-0000-0000-000000000001', 
'Complete IT Support Package', 
'Comprehensive tech support with laptop repair, network setup, and software installation', 
'package',
1600, 1300, 60, 70, true, 
'Valid for 60 days from purchase. Doorstep service. Genuine parts used. 30-day service warranty.');

-- Bundle Services for Tech Support Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('BB000000-0000-0000-0000-000000000001', 'B0000000-0000-0000-0000-000000000011', 1, 500, 1), -- Laptop Repair
('BB000000-0000-0000-0000-000000000001', 'B0000000-0000-0000-0000-000000000015', 1, 800, 2), -- Network Setup
('BB000000-0000-0000-0000-000000000001', 'B0000000-0000-0000-0000-000000000014', 1, 300, 3); -- Software Installation

-- 13. LAUNDRY MONTHLY PACKAGE
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('BC000000-0000-0000-0000-000000000001', 
'Monthly Laundry Care Package', 
'Unlimited wash & iron with dry cleaning for one month', 
'subscription',
1550, 1150, 30, 100, true, 
'Valid for 30 days from purchase. Up to 30kg wash & iron. 5 dry clean items included. Free pickup and delivery.');

-- Bundle Services for Laundry Package
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('BC000000-0000-0000-0000-000000000001', 'C0000000-0000-0000-0000-000000000011', 1, 900, 1), -- Wash & Iron
('BC000000-0000-0000-0000-000000000001', 'C0000000-0000-0000-0000-000000000012', 5, 130, 2); -- Dry Cleaning (5 items)

-- 14. WEEKEND SPECIAL - HOME & CAR COMBO
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('BD000000-0000-0000-0000-000000000001', 
'Weekend Special - Home & Car Combo', 
'Complete home cleaning with car wash in one package', 
'seasonal',
550, 450, 15, 200, true, 
'Valid for 15 days from purchase. Weekend slots preferred. Both services same day. Limited time offer.');

-- Bundle Services for Weekend Special
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('BD000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000011', 1, 250, 1), -- House Cleaning
('BD000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', 1, 300, 2); -- Car Wash

-- 15. FESTIVE SPECIAL - COMPLETE HOME PREPARATION
INSERT INTO service_bundles (id, name, description, bundle_type, total_original_price, bundle_price, validity_days, max_redemptions, is_active, terms_conditions) VALUES
('BE000000-0000-0000-0000-000000000001', 
'Festive Home Preparation Package', 
'Get your home festival-ready with deep cleaning and pest control', 
'seasonal',
2550, 1800, 20, 80, true, 
'Valid for 20 days from purchase. Perfect for festivals. All eco-friendly products. Book 3 days in advance.');

-- Bundle Services for Festive Special
INSERT INTO bundle_services (bundle_id, category_id, quantity, individual_price, sort_order) VALUES
('BE000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000011', 1, 250, 1), -- House Cleaning
('BE000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000013', 2, 200, 2), -- Bathroom Cleaning (2)
('BE000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000014', 1, 500, 3), -- Kitchen Cleaning
('BE000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000011', 1, 800, 4), -- Cockroach Control
('BE000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000016', 1, 800, 5); -- General Pest Control
