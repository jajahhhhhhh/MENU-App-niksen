-- Thai and Russian names for all 32 menu items.
-- Generated from marketing/menu-translations.md; do not hand-edit.
-- Matched on the English name, which is UNIQUE in menu_items.
BEGIN;
UPDATE menu_items SET name_th = 'บลูเบอร์รี่เลมอน (ชาดำ)', name_ru = 'Черника-лимон (чёрный чай)' WHERE name = 'Blueberry Lemon (Black Tea)';
UPDATE menu_items SET name_th = 'ข้าวหน้าหมูตุ๋น', name_ru = 'Рис с томлёной свиной грудинкой' WHERE name = 'Braised Pork Belly';
UPDATE menu_items SET name_th = 'เบอร์ริโตเนื้อ', name_ru = 'Буррито с говядиной' WHERE name = 'Burrito Beef';
UPDATE menu_items SET name_th = 'เชอร์รี่ (โคล่า)', name_ru = 'Вишня (кола)' WHERE name = 'Cherry (Cola)';
UPDATE menu_items SET name_th = 'โคลาบุริ', name_ru = 'Колабури' WHERE name = 'Colaburi';
UPDATE menu_items SET name_th = 'ไก่ทอดกรอบ', name_ru = 'Хрустящая жареная курица' WHERE name = 'Crispy Fried Chicken';
UPDATE menu_items SET name_th = 'โซดาชาขิง', name_ru = 'Содовая с имбирным чаем' WHERE name = 'Ginger Tea Soda';
UPDATE menu_items SET name_th = 'โซดาแอปเปิลเขียว', name_ru = 'Содовая с зелёным яблоком' WHERE name = 'Green Apple Soda';
UPDATE menu_items SET name_th = 'น้ำผึ้งมะนาว (ชาดำ)', name_ru = 'Мёд-лимон (чёрный чай)' WHERE name = 'Honey Lemon (Black Tea)';
UPDATE menu_items SET name_th = 'เจลลี่ (โคล่า)', name_ru = 'Желе (кола)' WHERE name = 'Jelly (Cola)';
UPDATE menu_items SET name_th = 'เกียวโตโซดา', name_ru = 'Содовая «Киото»' WHERE name = 'Kyoto Soda';
UPDATE menu_items SET name_th = 'โซดาเลมอน', name_ru = 'Лимонная содовая' WHERE name = 'Lemon Soda';
UPDATE menu_items SET name_th = 'ลิ้นจี่สปาร์กลิง', name_ru = 'Игристый личи' WHERE name = 'Lychee Sparkling';
UPDATE menu_items SET name_th = 'เมลอนทีสปาร์กลิง', name_ru = 'Игристый дынный чай' WHERE name = 'Melon Tea Sparkling';
UPDATE menu_items SET name_th = 'องุ่นมัสแคทสปาร์กลิง', name_ru = 'Игристый мускатный виноград' WHERE name = 'Muscat Grape Sparkling';
UPDATE menu_items SET name_th = 'ข้าวปั้นหมูตุ๋น', name_ru = 'Онигири со свиной грудинкой' WHERE name = 'Onigiri Pork Belly';
UPDATE menu_items SET name_th = 'เสาวรสสับปะรด (ชาดำ)', name_ru = 'Маракуйя-ананас (чёрный чай)' WHERE name = 'Passion Fruit Pineapple (Black Tea)';
UPDATE menu_items SET name_th = 'พีชส้ม (ชาดำ)', name_ru = 'Персик-апельсин (чёрный чай)' WHERE name = 'Peach Orange (Black Tea)';
UPDATE menu_items SET name_th = 'พีชทีสปาร์กลิง', name_ru = 'Игристый персиковый чай' WHERE name = 'Peach Tea Sparkling';
UPDATE menu_items SET name_th = 'พลัมสปาร์กลิง (ชาดำ)', name_ru = 'Игристая слива (чёрный чай)' WHERE name = 'Plum Sparkling (Black Tea)';
UPDATE menu_items SET name_th = 'ราสเบอร์รี่ (ชาดำ)', name_ru = 'Малина (чёрный чай)' WHERE name = 'Raspberry (Black Tea)';
UPDATE menu_items SET name_th = 'โซดารูทเบียร์', name_ru = 'Рутбир' WHERE name = 'Root Beer Soda';
UPDATE menu_items SET name_th = 'แซนด์วิชเบคอน', name_ru = 'Сэндвич с беконом' WHERE name = 'Sandwich Bacon';
UPDATE menu_items SET name_th = 'แซนด์วิชไข่', name_ru = 'Сэндвич с яйцом' WHERE name = 'Sandwich Eggs';
UPDATE menu_items SET name_th = 'แซนด์วิชแฮม', name_ru = 'Сэндвич с ветчиной' WHERE name = 'Sandwich Ham';
UPDATE menu_items SET name_th = 'แซนด์วิชกุ้ง', name_ru = 'Сэндвич с креветками' WHERE name = 'Sandwich Shrimp';
UPDATE menu_items SET name_th = 'ซุปครีมกุ้งเสิร์ฟพร้อมขนมปัง', name_ru = 'Креветочный крем-суп с тостом' WHERE name = 'Shrimp Cream Sauce with Toast';
UPDATE menu_items SET name_th = 'สตรอว์เบอร์รี่เมลอน (ชาดำ)', name_ru = 'Клубника-дыня (чёрный чай)' WHERE name = 'Strawberry Melon (Black Tea)';
UPDATE menu_items SET name_th = 'โซดาบ๊วย', name_ru = 'Содовая умэ' WHERE name = 'Ume Soda';
UPDATE menu_items SET name_th = 'วานิลลา (โคล่า)', name_ru = 'Ваниль (кола)' WHERE name = 'Vanilla (Cola)';
UPDATE menu_items SET name_th = 'โซดาแตงโม (ชาดำ)', name_ru = 'Арбузная содовая (чёрный чай)' WHERE name = 'Watermelon Soda (Black Tea)';
UPDATE menu_items SET name_th = 'โซดายูซุ', name_ru = 'Содовая с юдзу' WHERE name = 'Yuzu Soda';
-- the one description that states a fact rather than a tasting claim
UPDATE menu_items SET description_th = 'ห้าชิ้นต่อจาน', description_ru = '5 кусочков в порции'
  WHERE name = 'Crispy Fried Chicken' AND description = '5 pieces/serves';
COMMIT;
