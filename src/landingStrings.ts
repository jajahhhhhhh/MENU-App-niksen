import { Lang } from './i18n';

export interface PillarCopy {
  icon: 'coffee' | 'leaf' | 'moon';
  title: string;
  body: string;
}

export interface SampleItem {
  emoji: string;
  name: string;
  note: string;
  price: string;
}

export interface LandingStrings {
  // nav
  navStory: string;
  navMenu: string;
  navRewards: string;
  navVisit: string;
  navJournal: string;
  order: string;
  staff: string;
  // hero
  heroBadge: (date: string | null) => string;
  heroTitleA: string;
  heroTitleEm: string;
  heroSub: string;
  heroLocation: string;
  heroHours: string;
  heroCta: string;
  heroCta2: string;
  heroCardLabel: string;
  heroCardHours: string;
  heroCardNote: string;
  // marquee strip
  strip: string[];
  // story
  storyKicker: string;
  storyTitle: string;
  storyP1: string;
  storyP2: string;
  storyQuote: string;
  storyQuoteBy: string;
  // pillars
  pillarsKicker: string;
  pillarsTitle: string;
  pillars: PillarCopy[];
  // menu
  menuKicker: string;
  menuTitle: string;
  menuSub: string;
  menuSample: string;
  menuItems: SampleItem[];
  menuCta: string;
  // rewards
  rewardsKicker: string;
  rewardsTitle: string;
  rewardsBody: string;
  rewardsPoints: string[];
  rewardsCta: string;
  // private events (whole-venue buyout)
  privateKicker: string;
  privateTitle: string;
  privateBody: string;
  privateOffers: { name: string; price: string; note: string }[];
  privateCta: string;
  privateNote: string;
  // visit
  visitKicker: string;
  visitTitle: string;
  visitAddressLabel: string;
  visitAddress: string;
  visitHoursLabel: string;
  visitHours: string;
  visitDirections: string;
  visitAlsoOn: string;
  soon: string;
  mapHint: string;
  // cta band
  ctaTitle: string;
  ctaSub: string;
  ctaButton: string;
  // socials
  socialKicker: string;
  socialTitle: string;
  socialSub: string;
  // footer
  footerTagline: string;
  footerExplore: string;
  footerLegal: string;
  footerConnect: string;
  privacy: string;
  offer: string;
  rights: string;
  comeIn: string;
}

export const LANDING: Record<Lang, LandingStrings> = {
  en: {
    navStory: 'Story',
    navMenu: 'Menu',
    navRewards: 'Rewards',
    navVisit: 'Visit',
    navJournal: 'Journal',
    order: 'Order online',
    staff: 'Staff',

    heroBadge: date => date ? `Opening ${date} · Bophut` : 'Opening soon · Bophut',
    heroTitleA: 'The fine art of',
    heroTitleEm: 'doing nothing',
    heroSub: 'A secret little café and bar in Bophut, Koh Samui. Twenty-three craft sodas, sandwiches and rice from 7:30, and the bar opens again in the evening. Come early. Take the quiet seat. Do gloriously nothing.',
    heroLocation: 'Bophut · Koh Samui',
    heroHours: 'Daily 07:30–14:00 · 17:00–23:00',
    heroCta: 'Order online',
    heroCta2: 'Find us',
    heroCardLabel: 'niksen secret bar',
    heroCardHours: 'Every day · 07:30–14:00 · 17:00–23:00',
    heroCardNote: 'Craft soda · sandwiches · rice · evening bar',

    strip: ['23 craft sodas', 'Sandwiches, rice & burritos', 'Open from 7:30', 'Evening bar from 17:00', 'Bophut · Koh Samui', 'Order ahead for pickup', 'Earn points'],

    storyKicker: 'What is niksen?',
    storyTitle: 'Doing nothing, on purpose.',
    storyP1: 'Niksen is the Dutch art of doing nothing — being idle with no goal at all. It sounds simple, but on a busy island it feels almost radical. So we built a whole little bar around it.',
    storyP2: 'Fast food should be nutritious, and rest should be effortless. Our menu is honest, fresh and made for the way island mornings actually feel — unhurried, warm and just a little bit secret.',
    storyQuote: 'The best mornings ask nothing of you.',
    storyQuoteBy: '— the niksen house rule',

    pillarsKicker: 'Why niksen',
    pillarsTitle: 'Three small promises.',
    pillars: [
      { icon: 'coffee', title: 'Slow mornings', body: 'We open at 7:30, hours before the island really wakes up. Quiet corners, something cold and fizzy, and absolutely no rush.' },
      { icon: 'leaf', title: 'Honest food', body: 'Sandwiches, rice and burritos. Real ingredients, made fresh, priced fair.' },
      { icon: 'moon', title: 'Evenings at the bar', body: 'From 17:00 the secret bar opens again — cocktails and beer, low light, and nowhere else to be. Every day until 23:00.' },
    ],

    menuKicker: 'A taste of it',
    menuTitle: 'A few of our favourites.',
    menuSub: 'Order ahead and collect at the bar in Bophut. The full, live menu lives on the ordering page.',
    menuSample: 'Sample selection — see the live menu to order',
    menuItems: [
      { emoji: '🥤', name: 'Craft soda — 23 flavours', note: 'Yuzu, ume, lychee, root beer, muscat — poured over ice', price: '฿89' },
      { emoji: '🥪', name: 'Sandwiches', note: 'Ham, bacon, egg or shrimp', price: '฿169' },
      { emoji: '🍚', name: 'Braised pork belly rice', note: 'Slow-cooked until it gives way', price: '฿169' },
      { emoji: '🍗', name: 'Crispy fried chicken', note: 'Fried to order, eaten with your hands', price: '฿169' },
    ],
    menuCta: 'See full menu & order',

    rewardsKicker: 'Rewards',
    rewardsTitle: 'Sip. Earn. Repeat.',
    rewardsBody: 'Every ฿50 you spend earns a point — online or in-store. Points turn into baht off your next order, linked simply to your phone number.',
    rewardsPoints: [
      '1 point for every ฿50 spent',
      'No card and no app to install',
      'Redeem for money off, right at the bar',
    ],
    rewardsCta: 'Start earning',

    privateKicker: 'Private events',
    privateTitle: 'Take the whole place.',
    privateBody: 'Hire the whole café and bar exclusively — birthdays, private dinners, team gatherings, launch parties. We close the doors to everyone else and the venue is yours, here in Bophut, Koh Samui.',
    privateOffers: [
      { name: 'Small private group', price: '฿3,500', note: '4.5 hours · the whole venue' },
      { name: 'Workshop space', price: '฿500', note: 'per hour · hire the room by the hour' },
    ],
    privateCta: 'Ask about a booking',
    privateNote: 'Daytime or evening, any day of the week. Call to check the date.',

    visitKicker: 'Visit',
    visitTitle: 'Find the secret bar.',
    visitAddressLabel: 'Where',
    visitAddress: '15 Moo 2, Bo Phut, Ko Samui, Surat Thani 84320, Thailand',
    visitHoursLabel: 'When',
    visitHours: 'Every day · 07:30–14:00 and 17:00–23:00',
    visitDirections: 'Get directions',
    visitAlsoOn: 'Also on',
    soon: 'soon',
    mapHint: 'Tap for directions',

    ctaTitle: 'Ready to do nothing?',
    ctaSub: 'Order ahead and skip the wait — collect at the bar in Bophut.',
    ctaButton: 'Order online',

    socialKicker: 'Stay close',
    socialTitle: 'Follow along.',
    socialSub: 'Slow mornings, new soda flavours and secret-bar moments.',

    footerTagline: 'The art of doing nothing. Bophut, Koh Samui.',
    footerExplore: 'Explore',
    footerLegal: 'Legal',
    footerConnect: 'Connect',
    privacy: 'Privacy Policy',
    offer: 'Public Offer',
    rights: 'All rights reserved.',
    comeIn: 'Please come in.',
  },

  th: {
    navStory: 'เรื่องราว',
    navMenu: 'เมนู',
    navRewards: 'สะสมแต้ม',
    navVisit: 'มาหาเรา',
    navJournal: 'บันทึก',
    order: 'สั่งออนไลน์',
    staff: 'พนักงาน',

    heroBadge: date => date ? `เปิด ${date} · บ่อผุด` : 'เปิดเร็ว ๆ นี้ · บ่อผุด',
    heroTitleA: 'ศิลปะของการ',
    heroTitleEm: 'ไม่ทำอะไรเลย',
    heroSub: 'คาเฟ่และบาร์ลับเล็ก ๆ ในบ่อผุด เกาะสมุย คราฟต์โซดา 23 รส แซนด์วิชและข้าว ตั้งแต่ 7:30 และเปิดบาร์อีกครั้งในช่วงเย็น มาเช้าหน่อย เลือกมุมเงียบ ๆ แล้วปล่อยใจไม่ต้องทำอะไรเลย',
    heroLocation: 'บ่อผุด · เกาะสมุย',
    heroHours: 'ทุกวัน 07:30–14:00 · 17:00–23:00',
    heroCta: 'สั่งออนไลน์',
    heroCta2: 'ดูที่ตั้ง',
    heroCardLabel: 'niksen secret bar',
    heroCardHours: 'ทุกวัน · 07:30–14:00 · 17:00–23:00',
    heroCardNote: 'คราฟต์โซดา · แซนด์วิช · ข้าว · บาร์ตอนเย็น',

    strip: ['คราฟต์โซดา 23 รส', 'แซนด์วิช ข้าว เบอร์ริโต', 'เปิดตั้งแต่ 7:30', 'บาร์ตอนเย็นตั้งแต่ 17:00', 'บ่อผุด · เกาะสมุย', 'สั่งล่วงหน้ารับเองที่ร้าน', 'สะสมแต้ม'],

    storyKicker: 'niksen คืออะไร?',
    storyTitle: 'ตั้งใจ…ที่จะไม่ทำอะไรเลย',
    storyP1: 'Niksen คือศิลปะแบบดัตช์ของการไม่ทำอะไรเลย — อยู่เฉย ๆ โดยไม่มีเป้าหมายใด ๆ ฟังดูง่าย แต่บนเกาะที่วุ่นวาย มันกลับรู้สึกพิเศษ เราเลยสร้างบาร์เล็ก ๆ ทั้งร้านขึ้นมาเพื่อสิ่งนี้',
    storyP2: 'อาหารจานด่วนก็มีคุณค่าได้ และการพักผ่อนก็ควรง่ายดาย เมนูของเราจริงใจ สดใหม่ และทำมาเพื่อความรู้สึกของเช้าบนเกาะจริง ๆ — ไม่รีบร้อน อบอุ่น และลับเฉพาะนิด ๆ',
    storyQuote: 'เช้าที่ดีที่สุด คือเช้าที่ไม่เรียกร้องอะไรจากคุณเลย',
    storyQuoteBy: '— กฎประจำร้าน niksen',

    pillarsKicker: 'ทำไมต้อง niksen',
    pillarsTitle: 'สามสัญญาเล็ก ๆ',
    pillars: [
      { icon: 'coffee', title: 'เช้าที่ช้าลง', body: 'เราเปิด 7:30 ก่อนเกาะจะตื่นจริง ๆ หลายชั่วโมง มุมเงียบ ๆ ของเย็น ๆ ซ่า ๆ สักแก้ว และไม่ต้องรีบเลย' },
      { icon: 'leaf', title: 'อาหารจริงใจ', body: 'แซนด์วิช ข้าว และเบอร์ริโต วัตถุดิบจริง ทำสด ราคาสมเหตุสมผล' },
      { icon: 'moon', title: 'ค่ำคืนที่บาร์', body: 'ตั้งแต่ 17:00 บาร์ลับเปิดอีกครั้ง — ค็อกเทลและเบียร์ แสงไฟสลัว ๆ และไม่ต้องรีบไปไหน ทุกวันถึง 23:00' },
    ],

    menuKicker: 'ลองชิมดู',
    menuTitle: 'เมนูโปรดบางส่วนของเรา',
    menuSub: 'สั่งล่วงหน้าแล้วมารับที่ร้านในบ่อผุด เมนูเต็มแบบเรียลไทม์อยู่ที่หน้าสั่งซื้อ',
    menuSample: 'ตัวอย่างเมนู — ดูเมนูจริงเพื่อสั่งซื้อ',
    menuItems: [
      { emoji: '🥤', name: 'คราฟต์โซดา 23 รส', note: 'ยูซุ บ๊วย ลิ้นจี่ รูทเบียร์ มัสแคท — เทบนน้ำแข็ง', price: '฿89' },
      { emoji: '🥪', name: 'แซนด์วิช', note: 'แฮม เบคอน ไข่ หรือกุ้ง', price: '฿169' },
      { emoji: '🍚', name: 'ข้าวหมูสามชั้นตุ๋น', note: 'ตุ๋นช้า ๆ จนเปื่อยนุ่ม', price: '฿169' },
      { emoji: '🍗', name: 'ไก่ทอดกรอบ', note: 'ทอดใหม่ทุกจาน กินด้วยมือ', price: '฿169' },
    ],
    menuCta: 'ดูเมนูเต็ม & สั่งซื้อ',

    rewardsKicker: 'สะสมแต้ม',
    rewardsTitle: 'จิบ สะสม แล้วกลับมาใหม่',
    rewardsBody: 'ทุก ๆ ฿50 ที่ใช้จ่าย รับ 1 แต้ม ทั้งออนไลน์และที่ร้าน แต้มเปลี่ยนเป็นส่วนลดครั้งถัดไป ผูกกับเบอร์โทรของคุณง่าย ๆ',
    rewardsPoints: [
      '1 แต้มทุก ๆ ฿50 ที่ใช้จ่าย',
      'ไม่ต้องมีบัตร ไม่ต้องโหลดแอป',
      'ใช้เป็นส่วนลดได้เลยที่ร้าน',
    ],
    rewardsCta: 'เริ่มสะสมแต้ม',

    privateKicker: 'เหมาร้าน · จัดงานส่วนตัว',
    privateTitle: 'เหมาร้านทั้งร้าน เป็นของคุณคนเดียว',
    privateBody: 'รับจัดงานไพรเวทที่บ่อผุด เกาะสมุย — งานวันเกิด งานเลี้ยงบริษัท ปาร์ตี้ส่วนตัว หรือมื้อค่ำเฉพาะกลุ่ม เราปิดร้านให้ทั้งร้าน ไม่รับลูกค้าทั่วไปในวันนั้น',
    privateOffers: [
      { name: 'เหมาร้าน กลุ่มส่วนตัว', price: '฿3,500', note: '4.5 ชั่วโมง · เหมาทั้งร้าน' },
      { name: 'เช่าสถานที่จัดเวิร์กช็อป', price: '฿500', note: 'ต่อชั่วโมง · เช่าเป็นรายชั่วโมง' },
    ],
    privateCta: 'สอบถามและจอง',
    privateNote: 'ได้ทั้งกลางวันและกลางคืน ทุกวัน โทรเช็ควันว่างได้เลย',

    visitKicker: 'มาหาเรา',
    visitTitle: 'ตามหาบาร์ลับของเรา',
    visitAddressLabel: 'ที่ไหน',
    visitAddress: '15 หมู่ 2 ตำบลบ่อผุด อำเภอเกาะสมุย สุราษฎร์ธานี 84320',
    visitHoursLabel: 'เมื่อไหร่',
    visitHours: 'ทุกวัน · 07:30–14:00 และ 17:00–23:00',
    visitDirections: 'ดูเส้นทาง',
    visitAlsoOn: 'สั่งได้ที่',
    soon: 'เร็ว ๆ นี้',
    mapHint: 'แตะเพื่อดูเส้นทาง',

    ctaTitle: 'พร้อมจะไม่ทำอะไรหรือยัง?',
    ctaSub: 'สั่งล่วงหน้าไม่ต้องรอ — มารับที่ร้านในบ่อผุด',
    ctaButton: 'สั่งออนไลน์',

    socialKicker: 'ติดตามกัน',
    socialTitle: 'ตามเรามาสิ',
    socialSub: 'เช้าสบาย ๆ เมนูใหม่ ๆ และช่วงเวลาในบาร์ลับ',

    footerTagline: 'ศิลปะของการไม่ทำอะไรเลย บ่อผุด เกาะสมุย',
    footerExplore: 'สำรวจ',
    footerLegal: 'ข้อกำหนด',
    footerConnect: 'ติดต่อ',
    privacy: 'นโยบายความเป็นส่วนตัว',
    offer: 'ข้อเสนอสาธารณะ',
    rights: 'สงวนลิขสิทธิ์',
    comeIn: 'เชิญเข้ามาเลย',
  },

  ru: {
    navStory: 'История',
    navMenu: 'Меню',
    navRewards: 'Бонусы',
    navVisit: 'Визит',
    navJournal: 'Дневник',
    order: 'Заказать',
    staff: 'Персонал',

    heroBadge: date => date ? `Открытие ${date} · Бопхут` : 'Скоро открытие · Бопхут',
    heroTitleA: 'Тонкое искусство',
    heroTitleEm: 'ничего не делать',
    heroSub: 'Маленькое секретное кафе и бар в Бопхуте на Самуи. Двадцать три вкуса крафтовой содовой, сэндвичи и рис с 7:30, а вечером бар открывается снова. Приходите пораньше, займите тихое место и с наслаждением не делайте ничего.',
    heroLocation: 'Бопхут · Самуи',
    heroHours: 'Каждый день 07:30–14:00 · 17:00–23:00',
    heroCta: 'Заказать',
    heroCta2: 'Как нас найти',
    heroCardLabel: 'niksen secret bar',
    heroCardHours: 'Каждый день · 07:30–14:00 · 17:00–23:00',
    heroCardNote: 'Крафтовая содовая · сэндвичи · рис · вечерний бар',

    strip: ['23 вкуса крафтовой содовой', 'Сэндвичи, рис и буррито', 'Открыто с 7:30', 'Вечерний бар с 17:00', 'Бопхут · Самуи', 'Закажите заранее с самовывозом', 'Копите баллы'],

    storyKicker: 'Что такое niksen?',
    storyTitle: 'Ничего не делать — намеренно.',
    storyP1: 'Niksen — это голландское искусство ничего не делать, быть праздным без всякой цели. Звучит просто, но на шумном острове это почти вызов. Поэтому мы построили вокруг этого целый маленький бар.',
    storyP2: 'Быстрая еда может быть полезной, а отдых — лёгким. Наше меню честное, свежее и создано под то, каким на самом деле бывает островное утро — неспешным, тёплым и чуточку секретным.',
    storyQuote: 'Лучшие утра ничего от вас не требуют.',
    storyQuoteBy: '— домашнее правило niksen',

    pillarsKicker: 'Почему niksen',
    pillarsTitle: 'Три маленьких обещания.',
    pillars: [
      { icon: 'coffee', title: 'Неспешные утра', body: 'Мы открываемся в 7:30 — задолго до того, как остров по-настоящему проснётся. Тихие уголки, что-нибудь холодное и газированное, и полное отсутствие спешки.' },
      { icon: 'leaf', title: 'Честная еда', body: 'Сэндвичи, рис и буррито. Настоящие ингредиенты, готовим свежим, справедливые цены.' },
      { icon: 'moon', title: 'Вечера в баре', body: 'С 17:00 секретный бар открывается снова — коктейли и пиво, приглушённый свет и никакой спешки. Каждый день до 23:00.' },
    ],

    menuKicker: 'Попробуйте',
    menuTitle: 'Немного наших любимцев.',
    menuSub: 'Закажите заранее и заберите в баре в Бопхуте. Полное живое меню — на странице заказа.',
    menuSample: 'Пример меню — откройте живое меню, чтобы заказать',
    menuItems: [
      { emoji: '🥤', name: 'Крафтовая содовая, 23 вкуса', note: 'Юдзу, умэ, личи, рутбир, мускат — со льдом', price: '฿89' },
      { emoji: '🥪', name: 'Сэндвичи', note: 'Ветчина, бекон, яйцо или креветка', price: '฿169' },
      { emoji: '🍚', name: 'Рис с томлёной свиной грудинкой', note: 'Томится до мягкости', price: '฿169' },
      { emoji: '🍗', name: 'Хрустящая жареная курица', note: 'Жарим на заказ, едим руками', price: '฿169' },
    ],
    menuCta: 'Всё меню и заказ',

    rewardsKicker: 'Бонусы',
    rewardsTitle: 'Пей. Копи. Повтори.',
    rewardsBody: 'Каждые ฿50 приносят балл — онлайн или в баре. Баллы превращаются в скидку на следующий заказ и привязаны просто к вашему номеру телефона.',
    rewardsPoints: [
      '1 балл за каждые ฿50',
      'Без карты и без приложения',
      'Скидка прямо у стойки',
    ],
    rewardsCta: 'Начать копить',

    privateKicker: 'Частные мероприятия',
    privateTitle: 'Всё заведение — только для вас',
    privateBody: 'Аренда всего кафе и бара целиком — дни рождения, корпоративы, частные ужины и вечеринки. Мы закрываем двери для остальных, и место полностью ваше. Бопхут, Самуи.',
    privateOffers: [
      { name: 'Небольшая частная группа', price: '฿3 500', note: '4,5 часа · всё заведение' },
      { name: 'Площадка для воркшопа', price: '฿500', note: 'в час · почасовая аренда' },
    ],
    privateCta: 'Узнать и забронировать',
    privateNote: 'Днём или вечером, в любой день недели. Позвоните, чтобы уточнить дату.',

    visitKicker: 'Визит',
    visitTitle: 'Найдите секретный бар.',
    visitAddressLabel: 'Где',
    visitAddress: '15 Moo 2, Бопхут, Самуи, Сураттхани 84320, Таиланд',
    visitHoursLabel: 'Когда',
    visitHours: 'Каждый день · 07:30–14:00 и 17:00–23:00',
    visitDirections: 'Проложить маршрут',
    visitAlsoOn: 'Также в',
    soon: 'скоро',
    mapHint: 'Нажмите для маршрута',

    ctaTitle: 'Готовы ничего не делать?',
    ctaSub: 'Закажите заранее и не ждите — заберите в баре в Бопхуте.',
    ctaButton: 'Заказать',

    socialKicker: 'Оставайтесь рядом',
    socialTitle: 'Следите за нами.',
    socialSub: 'Неспешные утра, новые вкусы содовой и моменты секретного бара.',

    footerTagline: 'Искусство ничего не делать. Бопхут, Самуи.',
    footerExplore: 'Обзор',
    footerLegal: 'Правовое',
    footerConnect: 'Контакты',
    privacy: 'Политика конфиденциальности',
    offer: 'Публичная оферта',
    rights: 'Все права защищены.',
    comeIn: 'Заходите, пожалуйста.',
  },
};
