-- Seed Resume Builder subscription packages into the Panel DB (eclassify).
--
-- Applies cleanly multiple times (idempotent).
--
-- Apply locally (XAMPP):
--   C:\xampp\mysql\bin\mysql.exe -u root -D eclassify < prisma\panel-seed-packages.sql

SET NAMES utf8mb4;

-- Notes:
-- - We use `type=item_listing` to keep subscription packages isolated from other Panel packages.
-- - `duration` is a VARCHAR in the Panel schema; we store numeric day counts as strings.
-- - `key_points` is stored as JSON text; the Panel API decodes it into an array.

-- Freemium (Free)
INSERT INTO packages
  (name, final_price, discount_in_percentage, price, duration, item_limit, type, is_global, icon, description, key_points, status, created_at, updated_at)
SELECT
  'Freemium',
  0,
  0.00,
  0,
  'unlimited',
  'unlimited',
  'item_listing',
  1,
  'packages/1770393975-images.png',
  'User acquisition and SEO',
  JSON_ARRAY(
    'Few basic ATS-friendly templates',
    'Manual editor (no AI writing)',
    'Download as .txt or watermarked PDF',
    'Link of the website will be added',
    'QR code on resume to open online',
    'Basic cover letter templates'
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM packages WHERE name = 'Freemium' AND type = 'item_listing'
);

-- Job Hunt Pass (Weekly)
INSERT INTO packages
  (name, final_price, discount_in_percentage, price, duration, item_limit, type, is_global, icon, description, key_points, status, created_at, updated_at)
SELECT
  'Job Hunt Pass',
  7,
  0.00,
  7,
  '7',
  'unlimited',
  'item_listing',
  1,
  'packages/1770393975-images.png',
  'Most popular tier for job seekers',
  JSON_ARRAY(
    'Full access to all 40+ templates',
    'Unlimited resume tailoring (Gemini 2.5 Flash)',
    'AI cover letter generator',
    'Auto-renews to monthly plan'
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM packages WHERE name = 'Job Hunt Pass' AND type = 'item_listing'
);

-- Pro Monthly
INSERT INTO packages
  (name, final_price, discount_in_percentage, price, duration, item_limit, type, is_global, icon, description, key_points, status, created_at, updated_at)
SELECT
  'Pro Monthly',
  19,
  0.00,
  19,
  '30',
  'unlimited',
  'item_listing',
  1,
  'packages/1770393975-images.png',
  'Everything in the Pass',
  JSON_ARRAY(
    'All Job Hunt Pass features',
    'Resume Roast (AI audit)',
    'Auto-Tailor from job URL'
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM packages WHERE name = 'Pro Monthly' AND type = 'item_listing'
);

-- Annual
INSERT INTO packages
  (name, final_price, discount_in_percentage, price, duration, item_limit, type, is_global, icon, description, key_points, status, created_at, updated_at)
SELECT
  'Annual',
  99,
  0.00,
  99,
  '365',
  'unlimited',
  'item_listing',
  1,
  'packages/1770393975-images.png',
  'For long-term career growth',
  JSON_ARRAY(
    'Priority access to premium AI',
    'Quarterly \"Market Value\" reports',
    'Unlimited versions and cloud storage',
    'All Pro Monthly features'
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM packages WHERE name = 'Annual' AND type = 'item_listing'
);

