-- Populate service descriptions for better customer understanding

-- Manicures
UPDATE services 
SET description = 'Traditional nail care including shaping, cuticle treatment, hand massage, and your choice of polish. Perfect for maintaining healthy, polished nails.'
WHERE name = 'Classic Manicure';

UPDATE services 
SET description = 'Long-lasting gel polish with UV curing that stays chip-free for up to 2 weeks. Includes nail shaping, cuticle care, and a glossy finish.'
WHERE name = 'Gel Manicure';

UPDATE services 
SET description = 'Premium manicure experience with extended massage, exfoliating scrub, and hydrating treatment. Includes everything in our classic manicure plus luxury pampering.'
WHERE name = 'Deluxe Manicure';

-- Pedicures
UPDATE services 
SET description = 'Relaxing foot soak, nail shaping, cuticle care, callus removal, and polish application. A refreshing treat for tired feet.'
WHERE name = 'Classic Pedicure';

UPDATE services 
SET description = 'Elevated pedicure with exfoliating scrub, sugar treatment, extended massage, and hot towel wrap. Leaves feet feeling soft and rejuvenated.'
WHERE name = 'Spa Pedicure';

UPDATE services 
SET description = 'Ultimate spa experience with aromatherapy, paraffin wax treatment, extended massage, and premium foot mask. The most indulgent pedicure we offer.'
WHERE name = 'Deluxe Pedicure';

-- Extensions
UPDATE services 
SET description = 'Durable acrylic nail extensions applied over natural nails or tips. Customizable length and shape for a dramatic, long-lasting look.'
WHERE name = 'Acrylic Full Set';

UPDATE services 
SET description = 'Lightweight powder-based enhancement that''s healthier than acrylics and lasts 3-4 weeks. No UV light needed, with a natural feel and glossy finish.'
WHERE name = 'Dip Powder';

UPDATE services 
SET description = 'Flexible gel overlay that strengthens natural nails or extends length. Lighter than acrylics with a natural look and lasting shine.'
WHERE name = 'Gel Extensions';

-- Nail Art
UPDATE services 
SET description = 'Simple designs like accent nails, stripes, dots, or glitter. Add personality to your manicure with creative touches.'
WHERE name = 'Basic Nail Art';

UPDATE services 
SET description = 'Intricate custom designs including ombre, marble effects, detailed patterns, or 3D embellishments. Express your unique style with artistic nails.'
WHERE name = 'Advanced Nail Art';

-- Add-Ons
UPDATE services 
SET description = 'Classic white tips with natural pink base for a timeless, elegant look. Can be added to any manicure or pedicure service.'
WHERE name = 'French Tips';

UPDATE services 
SET description = 'Quick decorative touches like accent nails, simple patterns, or glitter application to enhance your service.'
WHERE name = 'Nail Art (Simple)';

UPDATE services 
SET description = 'Switch to long-lasting gel polish on any manicure for extended wear and high-gloss shine. Lasts up to 2 weeks without chipping.'
WHERE name = 'Gel Polish Upgrade';

UPDATE services 
SET description = 'Warm paraffin wax dip that deeply moisturizes skin, soothes joints, and leaves hands or feet incredibly soft. Perfect for dry skin.'
WHERE name = 'Paraffin Treatment';