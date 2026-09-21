# Menu translations — loaded

**Loaded into the POS on 21 September 2026.** All 32 items now carry a Thai and
a Russian name. What follows is the record of what went in; edit an item in
`/pos` → Manage → Menu Items to change it, not this file.

Three corrections were made to the draft before loading:

- **`сода` is baking soda in Russian.** The drink is `содовая`, which is what
  the category heading already says (`Крафтовая содовая`). Eight names read
  "lemon, baking soda". They now use `содовая`, with the case government
  Russian needs, rather than two stacked nominatives.
- **`спарклинг` is not a Russian word**, it is "sparkling" in Cyrillic letters.
  Five names use `игристый` instead.
- **`แซนวิช` against the heading `แซนด์วิช`** — the same word spelled two ways
  on one screen. All four sandwiches use `แซนด์วิช` now.

The tasting notes below were **not** loaded. They are drafted from the flavour
names rather than from tasting the bottles, and a description is a promise the
same way a name is. Taste them, correct these, then enter them.

## What this was

The site is sold as trilingual and its chrome was. The products were not: of
32 items, 6 carried a Thai name, none carried a Russian one and one carried a
description. `localizedName()` falls back to the English name when the
translated one is blank — the right behaviour, and why nobody noticed: the
page rendered perfectly, in English. A Russian customer read the entire menu
in English and a Thai customer read 26 of 32. The same defect #9 fixed for the
six category headings, one level down.

The tasting notes are still outstanding, and `content-plan.md` §3 still needs
them: the flavour-of-the-week caption is `[flavour] — [what it tastes of] ·
฿89`, and there is no tasting note for any of the twenty-three to put in it.

Editing an item in `/pos` → **Manage → Menu Items** is live on the customer's
menu immediately; the menu API reads the database per request. Nothing here
needs a deploy.

---

## Craft Soda — ฿89

| English (the key) | ไทย | Русский | Tasting note EN / ไทย / Русский |
|---|---|---|---|
| Blueberry Lemon (Black Tea) | บลูเบอร์รี่เลมอน (ชาดำ) | Черника-лимон (чёрный чай) | Berry and citrus over black tea / เบอร์รี่กับมะนาวบนชาดำ / Ягода и цитрус на чёрном чае |
| Cherry (Cola) | เชอร์รี่ (โคล่า) | Вишня (кола) | Cherry cola, over ice / เชอร์รี่โคล่า ใส่น้ำแข็ง / Вишнёвая кола со льдом |
| **Colaburi** | โคลาบุริ | Колабури | ⚠️ **What is in this?** Nobody here knows. Fill it in. |
| Ginger Tea Soda | โซดาชาขิง | Содовая с имбирным чаем | Warm ginger, cold and fizzy / ขิงอุ่น ๆ แบบเย็นซ่า / Тёплый имбирь, холодный и газированный |
| Green Apple Soda | โซดาแอปเปิลเขียว | Содовая с зелёным яблоком | Tart green apple / แอปเปิลเขียวเปรี้ยว / Кислое зелёное яблоко |
| Honey Lemon (Black Tea) | น้ำผึ้งมะนาว (ชาดำ) | Мёд-лимон (чёрный чай) | Honey and lemon on black tea / น้ำผึ้งมะนาวบนชาดำ / Мёд и лимон на чёрном чае |
| **Jelly (Cola)** | เจลลี่ (โคล่า) | Желе (кола) | ⚠️ Cola with jelly in it? **Confirm before this goes on the menu** — texture is the sort of thing people send back. |
| **Kyoto Soda** | เกียวโตโซดา | Содовая «Киото» | ⚠️ **What flavour is this?** Fill it in. |
| Lemon Soda | โซดาเลมอน | Лимонная содовая | Plain, sharp lemon / เลมอนเปรี้ยวคม ๆ / Просто резкий лимон |
| Lychee Sparkling | ลิ้นจี่สปาร์กลิง | Игристый личи | Floral and sweet / หอมดอกไม้ หวานกลมกล่อม / Цветочный и сладкий |
| Melon Tea Sparkling | เมลอนทีสปาร์กลิง | Игристый дынный чай | Melon over tea / เมลอนบนชา / Дыня на чае |
| Muscat Grape Sparkling | องุ่นมัสแคทสปาร์กลิง | Игристый мускатный виноград | Muscat grape, perfumed / องุ่นมัสแคท หอมหวาน / Мускатный виноград, ароматный |
| Passion Fruit Pineapple (Black Tea) | เสาวรสสับปะรด (ชาดำ) | Маракуйя-ананас (чёрный чай) | Tropical and sharp / เปรี้ยวสดชื่นแบบเขตร้อน / Тропический и резкий |
| Peach Orange (Black Tea) | พีชส้ม (ชาดำ) | Персик-апельсин (чёрный чай) | Peach and orange on black tea / พีชกับส้มบนชาดำ / Персик и апельсин на чёрном чае |
| Peach Tea Sparkling | พีชทีสปาร์กลิง | Игристый персиковый чай | Peach tea, sparkling / ชาพีชแบบซ่า / Персиковый чай с газом |
| Plum Sparkling (Black Tea) | พลัมสปาร์กลิง (ชาดำ) | Игристая слива (чёрный чай) | Plum on black tea / พลัมบนชาดำ / Слива на чёрном чае |
| Raspberry (Black Tea) | ราสเบอร์รี่ (ชาดำ) | Малина (чёрный чай) | Raspberry on black tea / ราสเบอร์รี่บนชาดำ / Малина на чёрном чае |
| Root Beer Soda | โซดารูทเบียร์ | Рутбир | Root beer — sarsaparilla, not fruit / รูทเบียร์ ไม่ใช่รสผลไม้ / Рутбир — сарсапарель, не фрукты |
| Strawberry Melon (Black Tea) | สตรอว์เบอร์รี่เมลอน (ชาดำ) | Клубника-дыня (чёрный чай) | Strawberry and melon on black tea / สตรอว์เบอร์รี่กับเมลอนบนชาดำ / Клубника и дыня на чёрном чае |
| Ume Soda | โซดาบ๊วย | Содовая умэ | Japanese plum — salty-sour, not sweet / บ๊วยญี่ปุ่น เค็มเปรี้ยว ไม่หวาน / Японская слива — солоновато-кислая |
| Vanilla (Cola) | วานิลลา (โคล่า) | Ваниль (кола) | Vanilla cola / โคล่าวานิลลา / Ванильная кола |
| Watermelon Soda (Black Tea) | โซดาแตงโม (ชาดำ) | Арбузная содовая (чёрный чай) | Watermelon on black tea / แตงโมบนชาดำ / Арбуз на чёрном чае |
| Yuzu Soda | โซดายูซุ | Содовая с юдзу | Sharp, floral, more citrus than sweet / เปรี้ยวคม หอมดอกไม้ หวานน้อย / Резкий, цветочный, скорее цитрус |

**Ume and Plum are not the same thing** and the menu sells both. Ume is
Japanese plum, salty-sour; Plum is the sweet one. If the bottles disagree with
that, swap the notes.

## Food — ฿169

| English (the key) | ไทย | Русский | Description EN / ไทย / Русский |
|---|---|---|---|
| Sandwich Ham | แซนด์วิชแฮม | Сэндвич с ветчиной | — |
| Sandwich Bacon | แซนด์วิชเบคอน | Сэндвич с беконом | — |
| Sandwich Eggs | แซนด์วิชไข่ | Сэндвич с яйцом | — |
| Sandwich Shrimp | แซนด์วิชกุ้ง | Сэндвич с креветками | — |
| Braised Pork Belly | ข้าวหน้าหมูตุ๋น | Рис с томлёной свиной грудинкой | Slow-cooked until it gives way / ตุ๋นช้า ๆ จนเปื่อยนุ่ม / Томится до мягкости |
| Onigiri Pork Belly | ข้าวปั้นหมูตุ๋น | Онигири со свиной грудинкой | Rice ball, same braised pork / ข้าวปั้น หมูตุ๋นแบบเดียวกัน / Рисовый шарик, та же грудинка |
| Crispy Fried Chicken | ไก่ทอดกรอบ | Хрустящая жареная курица | **`5 pieces/serves` is already set in English — add the Thai and Russian:** 5 ชิ้นต่อจาน / 5 кусочков в порции |
| Burrito Beef | เบอร์ริโตเนื้อ | Буррито с говядиной | — |
| Shrimp Cream Sauce with Toast | ซุปครีมกุ้งเสิร์ฟพร้อมขนมปัง | Креветочный крем-суп с тостом | Served with toast / เสิร์ฟพร้อมขนมปังปิ้ง / Подаётся с тостом |

---

## Why this is worth an evening

- **The Russian menu does not exist.** The launch kit named Russian speakers as one of three target audiences and the site runs in Russian — and then hands them 32 English product names.
- **It unblocks the weekly posting engine.** `content-plan.md` §3 needs one tasting note a week for twenty-three weeks. That is this table.
- **Three flavours nobody can describe.** Colaburi, Kyoto Soda and Jelly (Cola) are sold to customers who cannot tell what they are either. The staff know; the menu should say.

## Keep it from drifting again

A new item added through the POS starts with blank Thai and Russian, renders
in English, and looks fine. Same silent fallback as the category labels did
before #9. When you add something, fill all three names at the time — the
placeholder under the category field says so now.
