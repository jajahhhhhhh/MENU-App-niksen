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
  order: string;
  staff: string;
  // hero
  heroBadge: string;
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
}

export const LANDING: Record<Lang, LandingStrings> = {
  en: {
    navStory: 'Story',
    navMenu: 'Menu',
    navRewards: 'Rewards',
    navVisit: 'Visit',
    order: 'Order online',
    staff: 'Staff',

    heroBadge: 'Opening 18 August 2026 · Bophut',
    heroTitleA: 'The fine art of',
    heroTitleEm: 'doing nothing',
    heroSub: 'A secret little bar in Bophut for slow mornings, honest food and very good coffee. Come early. Take the quiet seat. Do gloriously nothing.',
    heroLocation: 'Bophut · Koh Samui',
    heroHours: 'Daily 07:00–14:00 · 17:00–23:00',
    heroCta: 'Order online',
    heroCta2: 'Find us',
    heroCardLabel: 'niksen secret bar',
    heroCardHours: 'Every day · 07:00–14:00 · 17:00–23:00',
    heroCardNote: 'Coffee · bowls · slow breakfasts',

    strip: ['Specialty coffee', 'Healthy bowls', 'Slow breakfasts', 'Open from 7:00', 'Bophut · Koh Samui', 'Pickup & delivery', 'Earn points'],

    storyKicker: 'What is niksen?',
    storyTitle: 'Doing nothing, on purpose.',
    storyP1: 'Niksen is the Dutch art of doing nothing — being idle with no goal at all. It sounds simple, but on a busy island it feels almost radical. So we built a whole little bar around it.',
    storyP2: 'Fast food should be nutritious, and rest should be effortless. Our menu is honest, fresh and made for the way island mornings actually feel — unhurried, warm and just a little bit secret.',
    storyQuote: 'The best mornings ask nothing of you.',
    storyQuoteBy: '— the niksen house rule',

    pillarsKicker: 'Why niksen',
    pillarsTitle: 'Three small promises.',
    pillars: [
      { icon: 'coffee', title: 'Slow mornings', body: 'We open at 7:00, hours before the island really wakes up. Specialty coffee, quiet corners, and absolutely no rush.' },
      { icon: 'leaf', title: 'Honest food', body: 'Healthy bowls, breakfasts, sandwiches and smoothies. Real ingredients, made fresh, priced fair.' },
      { icon: 'moon', title: 'Doing nothing, deliciously', body: 'Niksen is our house philosophy — less hurry, more presence. Order, settle in, and stay a while.' },
    ],

    menuKicker: 'A taste of it',
    menuTitle: 'A few of our favourites.',
    menuSub: 'Order ahead for pickup or delivery in Bophut. The full, live menu lives on the ordering page.',
    menuSample: 'Sample selection — see the live menu to order',
    menuItems: [
      { emoji: '☕', name: 'Specialty coffee', note: 'Espresso, filter & iced — roasted for slow mornings', price: '฿60+' },
      { emoji: '🥗', name: 'Signature bowls', note: 'Fresh, balanced, built to order', price: '฿199+' },
      { emoji: '🥣', name: 'Slow breakfasts', note: 'Overnight oats, eggs & warm toasts', price: '฿120+' },
      { emoji: '🥤', name: 'Fresh smoothies', note: 'Fruit, greens & good mornings', price: '฿90+' },
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

    visitKicker: 'Visit',
    visitTitle: 'Find the secret bar.',
    visitAddressLabel: 'Where',
    visitAddress: 'Bophut, Koh Samui, Surat Thani, Thailand',
    visitHoursLabel: 'When',
    visitHours: 'Every day · 07:00–14:00 and 17:00–23:00',
    visitDirections: 'Get directions',
    visitAlsoOn: 'Also on',
    soon: 'soon',
    mapHint: 'Tap for directions',

    ctaTitle: 'Ready to do nothing?',
    ctaSub: 'Order ahead and skip the wait — pickup or delivery in Bophut.',
    ctaButton: 'Order online',

    socialKicker: 'Stay close',
    socialTitle: 'Follow along.',
    socialSub: 'Slow mornings, new bowls and secret-bar moments.',

    footerTagline: 'The art of doing nothing. Bophut, Koh Samui.',
    footerExplore: 'Explore',
    footerLegal: 'Legal',
    footerConnect: 'Connect',
    privacy: 'Privacy Policy',
    offer: 'Public Offer',
    rights: 'All rights reserved.',
  },

  th: {
    navStory: 'เรื่องราว',
    navMenu: 'เมนู',
    navRewards: 'สะสมแต้ม',
    navVisit: 'มาหาเรา',
    order: 'สั่งออนไลน์',
    staff: 'พนักงาน',

    heroBadge: 'เปิด 18 สิงหาคม 2026 · บ่อผุด',
    heroTitleA: 'ศิลปะของการ',
    heroTitleEm: 'ไม่ทำอะไรเลย',
    heroSub: 'บาร์ลับเล็ก ๆ ในบ่อผุด สำหรับเช้าที่ช้าลง อาหารจริงใจ และกาแฟดี ๆ มาเช้าหน่อย เลือกมุมเงียบ ๆ แล้วปล่อยใจไม่ต้องทำอะไรเลย',
    heroLocation: 'บ่อผุด · เกาะสมุย',
    heroHours: 'ทุกวัน 07:00–14:00 · 17:00–23:00',
    heroCta: 'สั่งออนไลน์',
    heroCta2: 'ดูที่ตั้ง',
    heroCardLabel: 'niksen secret bar',
    heroCardHours: 'ทุกวัน · 07:00–14:00 · 17:00–23:00',
    heroCardNote: 'กาแฟ · โบวล์ · อาหารเช้าสบาย ๆ',

    strip: ['กาแฟพิเศษ', 'โบวล์เพื่อสุขภาพ', 'อาหารเช้าสบาย ๆ', 'เปิดตั้งแต่ 7:00', 'บ่อผุด · เกาะสมุย', 'รับเอง & จัดส่ง', 'สะสมแต้ม'],

    storyKicker: 'niksen คืออะไร?',
    storyTitle: 'ตั้งใจ…ที่จะไม่ทำอะไรเลย',
    storyP1: 'Niksen คือศิลปะแบบดัตช์ของการไม่ทำอะไรเลย — อยู่เฉย ๆ โดยไม่มีเป้าหมายใด ๆ ฟังดูง่าย แต่บนเกาะที่วุ่นวาย มันกลับรู้สึกพิเศษ เราเลยสร้างบาร์เล็ก ๆ ทั้งร้านขึ้นมาเพื่อสิ่งนี้',
    storyP2: 'อาหารจานด่วนก็มีคุณค่าได้ และการพักผ่อนก็ควรง่ายดาย เมนูของเราจริงใจ สดใหม่ และทำมาเพื่อความรู้สึกของเช้าบนเกาะจริง ๆ — ไม่รีบร้อน อบอุ่น และลับเฉพาะนิด ๆ',
    storyQuote: 'เช้าที่ดีที่สุด คือเช้าที่ไม่เรียกร้องอะไรจากคุณเลย',
    storyQuoteBy: '— กฎประจำร้าน niksen',

    pillarsKicker: 'ทำไมต้อง niksen',
    pillarsTitle: 'สามสัญญาเล็ก ๆ',
    pillars: [
      { icon: 'coffee', title: 'เช้าที่ช้าลง', body: 'เราเปิด 7:00 ก่อนเกาะจะตื่นจริง ๆ หลายชั่วโมง กาแฟพิเศษ มุมเงียบ ๆ และไม่ต้องรีบเลย' },
      { icon: 'leaf', title: 'อาหารจริงใจ', body: 'โบวล์เพื่อสุขภาพ อาหารเช้า แซนด์วิช และสมูทตี้ วัตถุดิบจริง ทำสด ราคาสมเหตุสมผล' },
      { icon: 'moon', title: 'ไม่ทำอะไร…อย่างมีรสชาติ', body: 'Niksen คือปรัชญาของร้าน — รีบให้น้อย อยู่กับปัจจุบันให้มาก สั่ง นั่งลง แล้วอยู่ต่อสักพัก' },
    ],

    menuKicker: 'ลองชิมดู',
    menuTitle: 'เมนูโปรดบางส่วนของเรา',
    menuSub: 'สั่งล่วงหน้าเพื่อรับเองหรือจัดส่งในบ่อผุด เมนูเต็มแบบเรียลไทม์อยู่ที่หน้าสั่งซื้อ',
    menuSample: 'ตัวอย่างเมนู — ดูเมนูจริงเพื่อสั่งซื้อ',
    menuItems: [
      { emoji: '☕', name: 'กาแฟพิเศษ', note: 'เอสเพรสโซ ดริป และเย็น คั่วมาเพื่อเช้าสบาย ๆ', price: '฿60+' },
      { emoji: '🥗', name: 'โบวล์ซิกเนเจอร์', note: 'สด สมดุล จัดตามใจคุณ', price: '฿199+' },
      { emoji: '🥣', name: 'อาหารเช้าสบาย ๆ', note: 'โอ๊ตข้ามคืน ไข่ และขนมปังอุ่น ๆ', price: '฿120+' },
      { emoji: '🥤', name: 'สมูทตี้สดใหม่', note: 'ผลไม้ ผักใบเขียว และเช้าที่ดี', price: '฿90+' },
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

    visitKicker: 'มาหาเรา',
    visitTitle: 'ตามหาบาร์ลับของเรา',
    visitAddressLabel: 'ที่ไหน',
    visitAddress: 'บ่อผุด เกาะสมุย สุราษฎร์ธานี ประเทศไทย',
    visitHoursLabel: 'เมื่อไหร่',
    visitHours: 'ทุกวัน · 07:00–14:00 และ 17:00–23:00',
    visitDirections: 'ดูเส้นทาง',
    visitAlsoOn: 'สั่งได้ที่',
    soon: 'เร็ว ๆ นี้',
    mapHint: 'แตะเพื่อดูเส้นทาง',

    ctaTitle: 'พร้อมจะไม่ทำอะไรหรือยัง?',
    ctaSub: 'สั่งล่วงหน้าไม่ต้องรอ — รับเองหรือจัดส่งในบ่อผุด',
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
  },

  ru: {
    navStory: 'История',
    navMenu: 'Меню',
    navRewards: 'Бонусы',
    navVisit: 'Визит',
    order: 'Заказать',
    staff: 'Персонал',

    heroBadge: 'Открытие 18 августа 2026 · Бопхут',
    heroTitleA: 'Тонкое искусство',
    heroTitleEm: 'ничего не делать',
    heroSub: 'Маленький секретный бар в Бопхуте — для неспешных утр, честной еды и очень хорошего кофе. Приходите пораньше, займите тихое место и с наслаждением не делайте ничего.',
    heroLocation: 'Бопхут · Самуи',
    heroHours: 'Каждый день 07:00–14:00 · 17:00–23:00',
    heroCta: 'Заказать',
    heroCta2: 'Как нас найти',
    heroCardLabel: 'niksen secret bar',
    heroCardHours: 'Каждый день · 07:00–14:00 · 17:00–23:00',
    heroCardNote: 'Кофе · боулы · неспешные завтраки',

    strip: ['Спешелти-кофе', 'Полезные боулы', 'Неспешные завтраки', 'Открыто с 7:00', 'Бопхут · Самуи', 'Самовывоз и доставка', 'Копите баллы'],

    storyKicker: 'Что такое niksen?',
    storyTitle: 'Ничего не делать — намеренно.',
    storyP1: 'Niksen — это голландское искусство ничего не делать, быть праздным без всякой цели. Звучит просто, но на шумном острове это почти вызов. Поэтому мы построили вокруг этого целый маленький бар.',
    storyP2: 'Быстрая еда может быть полезной, а отдых — лёгким. Наше меню честное, свежее и создано под то, каким на самом деле бывает островное утро — неспешным, тёплым и чуточку секретным.',
    storyQuote: 'Лучшие утра ничего от вас не требуют.',
    storyQuoteBy: '— домашнее правило niksen',

    pillarsKicker: 'Почему niksen',
    pillarsTitle: 'Три маленьких обещания.',
    pillars: [
      { icon: 'coffee', title: 'Неспешные утра', body: 'Мы открываемся в 7:00 — задолго до того, как остров по-настоящему проснётся. Спешелти-кофе, тихие уголки и полное отсутствие спешки.' },
      { icon: 'leaf', title: 'Честная еда', body: 'Полезные боулы, завтраки, сэндвичи и смузи. Настоящие ингредиенты, готовим свежим, справедливые цены.' },
      { icon: 'moon', title: 'Ничего не делать, вкусно', body: 'Niksen — наша философия: меньше суеты, больше присутствия. Закажите, устройтесь поудобнее и останьтесь подольше.' },
    ],

    menuKicker: 'Попробуйте',
    menuTitle: 'Немного наших любимцев.',
    menuSub: 'Закажите заранее с самовывозом или доставкой в Бопхуте. Полное живое меню — на странице заказа.',
    menuSample: 'Пример меню — откройте живое меню, чтобы заказать',
    menuItems: [
      { emoji: '☕', name: 'Спешелти-кофе', note: 'Эспрессо, фильтр и айс — обжарен для неспешных утр', price: '฿60+' },
      { emoji: '🥗', name: 'Фирменные боулы', note: 'Свежие, сбалансированные, на ваш вкус', price: '฿199+' },
      { emoji: '🥣', name: 'Неспешные завтраки', note: 'Ночная овсянка, яйца и тёплые тосты', price: '฿120+' },
      { emoji: '🥤', name: 'Свежие смузи', note: 'Фрукты, зелень и доброе утро', price: '฿90+' },
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

    visitKicker: 'Визит',
    visitTitle: 'Найдите секретный бар.',
    visitAddressLabel: 'Где',
    visitAddress: 'Бопхут, Самуи, Сураттхани, Таиланд',
    visitHoursLabel: 'Когда',
    visitHours: 'Каждый день · 07:00–14:00 и 17:00–23:00',
    visitDirections: 'Проложить маршрут',
    visitAlsoOn: 'Также в',
    soon: 'скоро',
    mapHint: 'Нажмите для маршрута',

    ctaTitle: 'Готовы ничего не делать?',
    ctaSub: 'Закажите заранее и не ждите — самовывоз или доставка в Бопхуте.',
    ctaButton: 'Заказать',

    socialKicker: 'Оставайтесь рядом',
    socialTitle: 'Следите за нами.',
    socialSub: 'Неспешные утра, новые боулы и моменты секретного бара.',

    footerTagline: 'Искусство ничего не делать. Бопхут, Самуи.',
    footerExplore: 'Обзор',
    footerLegal: 'Правовое',
    footerConnect: 'Контакты',
    privacy: 'Политика конфиденциальности',
    offer: 'Публичная оферта',
    rights: 'Все права защищены.',
  },
};
