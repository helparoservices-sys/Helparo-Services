-- Delete existing service categories data
DELETE FROM service_categories;

-- Insert Root Categories and Sub-Services with Icons
-- Valid price_type values: 'per_hour', 'per_unit', 'per_sqft', 'per_room', 'fixed', 'custom'

-- 1. HOME SERVICES
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Home Services
('10000000-0000-0000-0000-000000000001', NULL, 'home-services', 'Home Services', 'All home maintenance and repair services', true, 'per_hour', 'hour', 200, 'Home', true, true, 1),

-- Sub-services under Home Services
('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'plumbing', 'Plumbing', 'Pipe repairs, installations, and maintenance', true, 'per_hour', 'hour', 300, 'Wrench', true, true, 1),
('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'electrical', 'Electrical Work', 'Wiring, repairs, and electrical installations', true, 'per_hour', 'hour', 350, 'Zap', true, true, 2),
('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'carpentry', 'Carpentry', 'Furniture making, repairs, and wood work', true, 'per_hour', 'hour', 280, 'Hammer', true, false, 3),
('10000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'painting', 'Painting', 'Interior and exterior painting services', true, 'per_room', 'room', 2000, 'Paintbrush', true, false, 4),
('10000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'ac-repair', 'AC Repair & Service', 'Air conditioning repair and maintenance', true, 'per_hour', 'hour', 400, 'Wind', true, true, 5),
('10000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'appliance-repair', 'Appliance Repair', 'Washing machine, fridge, microwave repairs', true, 'per_hour', 'hour', 300, 'Settings', true, false, 6);

-- 2. CLEANING SERVICES
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Cleaning Services
('20000000-0000-0000-0000-000000000001', NULL, 'cleaning-services', 'Cleaning Services', 'Professional cleaning for homes and offices', true, 'per_hour', 'hour', 200, 'Sparkles', true, false, 2),

-- Sub-services under Cleaning Services
('20000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', 'house-cleaning', 'House Cleaning', 'Deep cleaning for entire house', true, 'per_hour', 'hour', 250, 'Home', true, false, 1),
('20000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', 'office-cleaning', 'Office Cleaning', 'Commercial office cleaning services', true, 'per_hour', 'hour', 300, 'Briefcase', true, false, 2),
('20000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000001', 'bathroom-cleaning', 'Bathroom Cleaning', 'Deep bathroom sanitization', true, 'per_room', 'bathroom', 400, 'Droplet', true, false, 3),
('20000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000001', 'kitchen-cleaning', 'Kitchen Cleaning', 'Complete kitchen deep cleaning', true, 'per_room', 'kitchen', 500, 'ChefHat', true, false, 4),
('20000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000001', 'sofa-cleaning', 'Sofa & Carpet Cleaning', 'Upholstery and carpet cleaning', true, 'per_unit', 'sofa', 600, 'Armchair', true, false, 5),
('20000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000001', 'window-cleaning', 'Window Cleaning', 'Glass and window cleaning services', true, 'per_hour', 'hour', 200, 'Maximize', true, false, 6);

-- 3. BEAUTY & WELLNESS
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Beauty & Wellness
('30000000-0000-0000-0000-000000000001', NULL, 'beauty-wellness', 'Beauty & Wellness', 'Personal care and beauty services at home', true, 'fixed', 'service', 500, 'Sparkle', true, false, 3),

-- Sub-services under Beauty & Wellness
('30000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000001', 'haircut-styling', 'Haircut & Styling', 'Professional haircutting and styling', true, 'fixed', 'service', 300, 'Scissors', true, false, 1),
('30000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 'facial-treatment', 'Facial Treatment', 'Skin care and facial services', true, 'fixed', 'service', 800, 'Smile', true, false, 2),
('30000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000001', 'massage-therapy', 'Massage Therapy', 'Relaxing massage and therapy', true, 'per_hour', 'hour', 600, 'Hand', true, false, 3),
('30000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000001', 'manicure-pedicure', 'Manicure & Pedicure', 'Nail care and grooming', true, 'fixed', 'service', 400, 'Gem', true, false, 4),
('30000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000001', 'makeup-artist', 'Makeup Artist', 'Professional makeup for events', true, 'fixed', 'service', 1500, 'Palette', true, false, 5),
('30000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000001', 'waxing-threading', 'Waxing & Threading', 'Hair removal services', true, 'fixed', 'service', 250, 'Feather', true, false, 6);

-- 4. CAR SERVICES
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Car Services
('40000000-0000-0000-0000-000000000001', NULL, 'car-services', 'Car Services', 'Vehicle maintenance and repair services', true, 'per_hour', 'hour', 400, 'Car', true, true, 4),

-- Sub-services under Car Services
('40000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000001', 'car-wash', 'Car Wash', 'External and internal car cleaning', true, 'fixed', 'car', 300, 'Droplets', true, false, 1),
('40000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000001', 'car-repair', 'Car Repair', 'Mechanical repairs and servicing', true, 'per_hour', 'hour', 500, 'Wrench', true, true, 2),
('40000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000001', 'tire-service', 'Tire Service', 'Tire change, puncture repair, alignment', true, 'fixed', 'tire', 400, 'Circle', true, true, 3),
('40000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000001', 'battery-service', 'Battery Service', 'Battery replacement and jump start', true, 'fixed', 'service', 500, 'Battery', true, true, 4),
('40000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000001', 'denting-painting', 'Denting & Painting', 'Body work and paint jobs', true, 'per_unit', 'panel', 2000, 'PaintBucket', true, false, 5),
('40000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000001', 'ac-service', 'Car AC Service', 'Vehicle air conditioning repair', true, 'fixed', 'service', 800, 'Snowflake', true, false, 6);

-- 5. PEST CONTROL
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Pest Control
('50000000-0000-0000-0000-000000000001', NULL, 'pest-control', 'Pest Control', 'Professional pest and insect control services', true, 'fixed', 'service', 1000, 'Bug', true, true, 5),

-- Sub-services under Pest Control
('50000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000001', 'cockroach-control', 'Cockroach Control', 'Cockroach elimination and prevention', true, 'fixed', 'treatment', 800, 'Bug', true, false, 1),
('50000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000001', 'termite-control', 'Termite Control', 'Termite treatment and wood protection', true, 'fixed', 'treatment', 1500, 'Shield', true, false, 2),
('50000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000001', 'bed-bug-control', 'Bed Bug Control', 'Bed bug removal and sanitation', true, 'fixed', 'treatment', 1200, 'Bed', true, false, 3),
('50000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000001', 'mosquito-control', 'Mosquito Control', 'Mosquito fogging and prevention', true, 'fixed', 'treatment', 600, 'CloudRain', true, false, 4),
('50000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000001', 'rodent-control', 'Rodent Control', 'Rat and mice elimination', true, 'fixed', 'treatment', 1000, 'Rat', true, false, 5),
('50000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000001', 'general-pest', 'General Pest Control', 'All-purpose pest control treatment', true, 'fixed', 'treatment', 1500, 'BugOff', true, false, 6);

-- 6. MOVING & PACKING
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Moving & Packing
('60000000-0000-0000-0000-000000000001', NULL, 'moving-packing', 'Moving & Packing', 'Relocation and packing services', true, 'per_hour', 'hour', 500, 'Truck', true, false, 6),

-- Sub-services under Moving & Packing
('60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000001', 'local-shifting', 'Local Shifting', 'Within city relocation services', true, 'fixed', 'move', 3000, 'Home', true, false, 1),
('60000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000001', 'intercity-moving', 'Intercity Moving', 'Long distance relocation', true, 'fixed', 'move', 8000, 'MapPin', true, false, 2),
('60000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000001', 'packing-services', 'Packing Services', 'Professional packing and unpacking', true, 'per_hour', 'hour', 300, 'Package', true, false, 3),
('60000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000001', 'furniture-moving', 'Furniture Moving', 'Heavy furniture transportation', true, 'per_unit', 'item', 500, 'Sofa', true, false, 4),
('60000000-0000-0000-0000-000000000015', '60000000-0000-0000-0000-000000000001', 'office-relocation', 'Office Relocation', 'Complete office moving services', true, 'fixed', 'move', 10000, 'Building', true, false, 5),
('60000000-0000-0000-0000-000000000016', '60000000-0000-0000-0000-000000000001', 'vehicle-transport', 'Vehicle Transport', 'Car and bike transportation', true, 'per_unit', 'vehicle', 4000, 'CarFront', true, false, 6);

-- 7. TUTORING & TRAINING
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Tutoring & Training
('70000000-0000-0000-0000-000000000001', NULL, 'tutoring-training', 'Tutoring & Training', 'Educational and skill development services', true, 'per_hour', 'hour', 300, 'GraduationCap', true, false, 7),

-- Sub-services under Tutoring & Training
('70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', 'academic-tutoring', 'Academic Tutoring', 'School and college subject tutoring', true, 'per_hour', 'hour', 400, 'BookOpen', true, false, 1),
('70000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000001', 'music-lessons', 'Music Lessons', 'Instrument and vocal training', true, 'per_hour', 'hour', 500, 'Music', true, false, 2),
('70000000-0000-0000-0000-000000000013', '70000000-0000-0000-0000-000000000001', 'dance-classes', 'Dance Classes', 'Various dance styles training', true, 'per_hour', 'hour', 400, 'Music', true, false, 3),
('70000000-0000-0000-0000-000000000014', '70000000-0000-0000-0000-000000000001', 'yoga-fitness', 'Yoga & Fitness', 'Personal training and yoga sessions', true, 'per_hour', 'hour', 500, 'Dumbbell', true, false, 4),
('70000000-0000-0000-0000-000000000015', '70000000-0000-0000-0000-000000000001', 'language-classes', 'Language Classes', 'Foreign language teaching', true, 'per_hour', 'hour', 450, 'Languages', true, false, 5),
('70000000-0000-0000-0000-000000000016', '70000000-0000-0000-0000-000000000001', 'cooking-classes', 'Cooking Classes', 'Culinary skills training', true, 'per_hour', 'hour', 350, 'ChefHat', true, false, 6);

-- 8. EVENT SERVICES
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Event Services
('80000000-0000-0000-0000-000000000001', NULL, 'event-services', 'Event Services', 'Party planning and event management', true, 'fixed', 'event', 5000, 'PartyPopper', true, false, 8),

-- Sub-services under Event Services
('80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000001', 'birthday-party', 'Birthday Party Planning', 'Complete birthday event organization', true, 'fixed', 'event', 8000, 'Cake', true, false, 1),
('80000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000001', 'wedding-planning', 'Wedding Planning', 'Full wedding event management', true, 'custom', 'event', 50000, 'Heart', true, false, 2),
('80000000-0000-0000-0000-000000000013', '80000000-0000-0000-0000-000000000001', 'catering-service', 'Catering Service', 'Food and beverage services for events', true, 'per_unit', 'person', 300, 'UtensilsCrossed', true, false, 3),
('80000000-0000-0000-0000-000000000014', '80000000-0000-0000-0000-000000000001', 'decoration-service', 'Decoration Service', 'Event decoration and setup', true, 'fixed', 'event', 5000, 'Lightbulb', true, false, 4),
('80000000-0000-0000-0000-000000000015', '80000000-0000-0000-0000-000000000001', 'photography-video', 'Photography & Videography', 'Professional event coverage', true, 'fixed', 'event', 8000, 'Camera', true, false, 5),
('80000000-0000-0000-0000-000000000016', '80000000-0000-0000-0000-000000000001', 'entertainment', 'Entertainment', 'DJ, performers, and entertainment services', true, 'fixed', 'event', 10000, 'Mic', true, false, 6);

-- 9. GARDENING & LANDSCAPING
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Gardening & Landscaping
('90000000-0000-0000-0000-000000000001', NULL, 'gardening-landscaping', 'Gardening & Landscaping', 'Garden maintenance and outdoor services', true, 'per_hour', 'hour', 250, 'Trees', true, false, 9),

-- Sub-services under Gardening & Landscaping
('90000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000001', 'lawn-mowing', 'Lawn Mowing', 'Grass cutting and lawn maintenance', true, 'fixed', 'service', 400, 'Scissors', true, false, 1),
('90000000-0000-0000-0000-000000000012', '90000000-0000-0000-0000-000000000001', 'garden-design', 'Garden Design', 'Landscape planning and design', true, 'per_sqft', 'sqft', 50, 'Flower', true, false, 2),
('90000000-0000-0000-0000-000000000013', '90000000-0000-0000-0000-000000000001', 'plant-care', 'Plant Care', 'Plant maintenance and nurturing', true, 'per_hour', 'hour', 200, 'Leaf', true, false, 3),
('90000000-0000-0000-0000-000000000014', '90000000-0000-0000-0000-000000000001', 'tree-trimming', 'Tree Trimming', 'Tree pruning and cutting services', true, 'per_unit', 'tree', 800, 'TreeDeciduous', true, false, 4),
('90000000-0000-0000-0000-000000000015', '90000000-0000-0000-0000-000000000001', 'irrigation-system', 'Irrigation System', 'Sprinkler installation and repair', true, 'fixed', 'service', 2000, 'Droplet', true, false, 5),
('90000000-0000-0000-0000-000000000016', '90000000-0000-0000-0000-000000000001', 'pest-control-garden', 'Garden Pest Control', 'Plant and garden pest management', true, 'fixed', 'service', 600, 'Bug', true, false, 6);

-- 10. PET CARE
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Pet Care
('A0000000-0000-0000-0000-000000000001', NULL, 'pet-care', 'Pet Care', 'Pet grooming, training, and care services', true, 'per_hour', 'hour', 300, 'Dog', true, false, 10),

-- Sub-services under Pet Care
('A0000000-0000-0000-0000-000000000011', 'A0000000-0000-0000-0000-000000000001', 'pet-grooming', 'Pet Grooming', 'Bath, haircut, and nail trimming', true, 'fixed', 'pet', 500, 'Scissors', true, false, 1),
('A0000000-0000-0000-0000-000000000012', 'A0000000-0000-0000-0000-000000000001', 'dog-walking', 'Dog Walking', 'Daily dog exercise and walking', true, 'per_unit', 'walk', 200, 'Footprints', true, false, 2),
('A0000000-0000-0000-0000-000000000013', 'A0000000-0000-0000-0000-000000000001', 'pet-training', 'Pet Training', 'Obedience and behavior training', true, 'per_hour', 'hour', 400, 'Award', true, false, 3),
('A0000000-0000-0000-0000-000000000014', 'A0000000-0000-0000-0000-000000000001', 'pet-sitting', 'Pet Sitting', 'In-home pet care and supervision', true, 'per_unit', 'day', 600, 'Home', true, false, 4),
('A0000000-0000-0000-0000-000000000015', 'A0000000-0000-0000-0000-000000000001', 'vet-consultation', 'Vet Consultation', 'At-home veterinary check-ups', true, 'fixed', 'visit', 800, 'Stethoscope', true, true, 5),
('A0000000-0000-0000-0000-000000000016', 'A0000000-0000-0000-0000-000000000001', 'pet-taxi', 'Pet Taxi', 'Pet transportation services', true, 'fixed', 'trip', 400, 'Car', true, false, 6);

-- 11. COMPUTER & IT SERVICES
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Computer & IT Services
('B0000000-0000-0000-0000-000000000001', NULL, 'computer-it', 'Computer & IT Services', 'Technology repair and IT support', true, 'per_hour', 'hour', 400, 'Laptop', true, true, 11),

-- Sub-services under Computer & IT Services
('B0000000-0000-0000-0000-000000000011', 'B0000000-0000-0000-0000-000000000001', 'laptop-repair', 'Laptop Repair', 'Hardware and software laptop fixes', true, 'per_hour', 'hour', 500, 'Laptop', true, false, 1),
('B0000000-0000-0000-0000-000000000012', 'B0000000-0000-0000-0000-000000000001', 'desktop-repair', 'Desktop Repair', 'PC troubleshooting and repair', true, 'per_hour', 'hour', 450, 'Monitor', true, false, 2),
('B0000000-0000-0000-0000-000000000013', 'B0000000-0000-0000-0000-000000000001', 'data-recovery', 'Data Recovery', 'Lost data retrieval services', true, 'fixed', 'service', 2000, 'HardDrive', true, true, 3),
('B0000000-0000-0000-0000-000000000014', 'B0000000-0000-0000-0000-000000000001', 'software-installation', 'Software Installation', 'OS and software setup', true, 'fixed', 'service', 300, 'Download', true, false, 4),
('B0000000-0000-0000-0000-000000000015', 'B0000000-0000-0000-0000-000000000001', 'network-setup', 'Network Setup', 'WiFi and network configuration', true, 'fixed', 'service', 800, 'Wifi', true, false, 5),
('B0000000-0000-0000-0000-000000000016', 'B0000000-0000-0000-0000-000000000001', 'printer-repair', 'Printer Repair', 'Printer troubleshooting and fixes', true, 'per_hour', 'hour', 350, 'Printer', true, false, 6);

-- 12. LAUNDRY & DRY CLEANING
INSERT INTO service_categories (id, parent_id, slug, name, description, is_active, price_type, unit_name, base_price, icon, requires_location, supports_emergency, display_order) VALUES
-- Root: Laundry & Dry Cleaning
('C0000000-0000-0000-0000-000000000001', NULL, 'laundry-services', 'Laundry Services', 'Washing, ironing, and dry cleaning', true, 'per_unit', 'kg', 50, 'Shirt', true, false, 12),

-- Sub-services under Laundry Services
('C0000000-0000-0000-0000-000000000011', 'C0000000-0000-0000-0000-000000000001', 'wash-iron', 'Wash & Iron', 'Complete washing and ironing service', true, 'per_unit', 'kg', 60, 'WashingMachine', true, false, 1),
('C0000000-0000-0000-0000-000000000012', 'C0000000-0000-0000-0000-000000000001', 'dry-cleaning', 'Dry Cleaning', 'Professional dry cleaning service', true, 'per_unit', 'item', 150, 'Sparkles', true, false, 2),
('C0000000-0000-0000-0000-000000000013', 'C0000000-0000-0000-0000-000000000001', 'iron-only', 'Iron Only', 'Ironing service for washed clothes', true, 'per_unit', 'kg', 30, 'Flame', true, false, 3),
('C0000000-0000-0000-0000-000000000014', 'C0000000-0000-0000-0000-000000000001', 'steam-press', 'Steam Press', 'Steam ironing for delicate fabrics', true, 'per_unit', 'item', 50, 'Wind', true, false, 4),
('C0000000-0000-0000-0000-000000000015', 'C0000000-0000-0000-0000-000000000001', 'shoe-cleaning', 'Shoe Cleaning', 'Footwear cleaning and polishing', true, 'per_unit', 'pair', 100, 'Footprints', true, false, 5),
('C0000000-0000-0000-0000-000000000016', 'C0000000-0000-0000-0000-000000000001', 'carpet-curtain-clean', 'Carpet & Curtain Cleaning', 'Large fabric item cleaning', true, 'per_unit', 'item', 500, 'Maximize', true, false, 6);

-- Update timestamps trigger function will handle updated_at automatically
