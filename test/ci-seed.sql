-- Minimum database the end-to-end test needs, for CI only.
--
-- system-test.py was written to run against a copy of the live database, so it
-- reaches for rows by name: a Craft Soda with stock, a "Sandwich Ham", an
-- ingredient with "Butter" in it. None of that exists in a database the server
-- has just created, and none of it is in the repo -- the live ingredient
-- catalogue and its recipes were entered by hand and have no source here.
-- This file is that source, for the test's purposes only. It is not the live
-- menu and must not be used to rebuild one.
--
-- Apply it AFTER the server has booted once, so the schema and every migration
-- come from server.ts rather than being duplicated and left to drift:
--     sqlite3 pos.db < test/ci-seed.sql
--
-- staff_pin is not set here: server.ts already defaults it to 1234 on a fresh
-- database, which is what the test logs in with.

-- A PromptPay number, because section 8 asserts the order comes back with a
-- payable QR payload. Any well-formed number does; this is not a real one.
INSERT INTO settings (key, value) VALUES ('promptpay_id', '0812345678')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;

-- Two items, one per category the test looks up by name.
INSERT INTO menu_items (name, category, price, available, stock_quantity, low_stock_threshold)
VALUES ('Yuzu Soda',    'Craft Soda', 89,  1, 50, 2),
       ('Sandwich Ham', 'Sandwich',   169, 1, 50, 2);

-- Staples with an estimated cost and deliberately no lots. Section 9 asserts
-- that a staple nobody has bought reads as owed rather than zero: the
-- sandwiches sold earlier in the run eat butter that no bill has covered, so
-- on_hand goes negative. Seeding a lot here would break that assertion.
-- default_cost is what section 9 calls "the estimate", and every ingredient in
-- a recipe needs one, or "no dish is missing an ingredient price" fails.
INSERT INTO ingredients (name, unit, default_cost, low_stock_threshold) VALUES
  ('Butter Unsalted (estimate)', 'g', 0.53, 100),
  ('Ham Sliced (estimate)',      'g', 0.42, 100),
  ('Bread Loaf (estimate)',      'g', 0.09, 200);

-- One recipe, on the one dish the test costs. Keeping it to a single dish is
-- deliberate: the "no dish is missing an ingredient price" assertion covers
-- every item that has a recipe, so each one added here is another thing that
-- has to stay fully priced.
INSERT INTO recipe_items (menu_item_id, ingredient_id, quantity)
SELECT m.id, i.id, v.qty
FROM (SELECT 'Butter Unsalted (estimate)' AS ing, 10.0 AS qty
      UNION ALL SELECT 'Ham Sliced (estimate)', 40.0
      UNION ALL SELECT 'Bread Loaf (estimate)', 60.0) v
JOIN menu_items  m ON m.name = 'Sandwich Ham'
JOIN ingredients i ON i.name = v.ing;
