export type Lang = 'en' | 'th' | 'ru';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'th', label: 'ไทย' },
  { code: 'ru', label: 'RU' },
];

interface Strings {
  tagline: string;
  all: string;
  loading: string;
  emptyMenu: string;
  soldOut: string;
  add: string;
  // Heading of the ordering page, and the action on a dish that is not in the
  // basket yet — spelled out rather than a bare "Add" on the reference card.
  menuTitle: string;
  addToOrder: string;
  customise: string;
  from: string;
  chooseIngredients: string;
  // Shown on the disabled add button when a required group is unanswered.
  choose: string;
  clearAll: string;
  cartItems: (n: number) => string;
  checkout: string;
  yourOrder: string;
  subtotal: string;
  tax: string;
  total: string;
  pickup: string;
  delivery: string;
  namePh: string;
  phonePh: string;
  addressPh: string;
  notesPh: string;
  placeOrder: (type: string) => string;
  placing: string;
  pointsNote: string;
  orderReceived: string;
  orderWord: string;
  totalTax: string;
  scanToPay: string;
  orCashPickup: string;
  orCashDelivery: string;
  payLaterPickup: string;
  payLaterDelivery: string;
  earned: (points: number, balance: number) => string;
  orderMore: string;
  errNetwork: string;
  errGeneric: string;
  openingBanner: string;
  // The app shell: the blue opening block, the cards it offers, and the tab
  // bar. Wording follows the Niksen app rather than being invented here.
  heroLine: string;
  openNow: string;
  homeMenu: string; homeMenuSub: string;
  homeOrder: string; homeOrderSub: string;
  homeTonight: string; homeTonightSub: string;
  homeCard: string; homeCardSub: string;
  homeFind: string; homeFindSub: string;
  hoursBreakfast: string; hoursBar: string; place: string;
  tonightBody: string;
  eventLabel: string; promoLabel: string;
  cartEmpty: string;
  navHome: string; navMenu: string; navOrder: string; navTonight: string; navCard: string;
  openingCta: string;
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    tagline: 'Order online · Bophut, Koh Samui',
    all: 'All',
    loading: 'Loading menu…',
    emptyMenu: 'The menu is being set up — please check back soon.',
    soldOut: 'Sold out',
    add: 'Add',
    menuTitle: 'Menu',
    addToOrder: 'Add to Order',
    customise: 'Build it',
    from: 'from',
    chooseIngredients: 'Pick anything you like — mix and match.',
    choose: 'Choose a',
    clearAll: 'Clear all',
    cartItems: n => `${n} ${n === 1 ? 'item' : 'items'}`,
    checkout: 'Checkout',
    yourOrder: 'Your order',
    subtotal: 'Subtotal',
    tax: 'Tax 7%',
    total: 'Total',
    pickup: 'Pickup',
    delivery: 'Delivery',
    namePh: 'Your name *',
    phonePh: 'Phone number * (earns points)',
    addressPh: 'Delivery address in Bophut *',
    notesPh: 'Notes (optional)',
    placeOrder: type => `Place ${type} order`,
    placing: 'Placing order…',
    pointsNote: 'Earn 1 point per ฿50 spent. Points are linked to your phone number and redeemable in-store.',
    orderReceived: 'Order received!',
    orderWord: 'Order',
    totalTax: 'Total (7% tax incl.)',
    scanToPay: 'Scan to pay with PromptPay',
    orCashPickup: 'Or pay cash on pickup.',
    orCashDelivery: 'Or pay cash on delivery.',
    payLaterPickup: 'Pay by cash or PromptPay on pickup.',
    payLaterDelivery: 'Pay by cash or PromptPay on delivery.',
    earned: (p, b) => `You earned ${p} points — your balance is ${b}. Points give you baht off your next order.`,
    orderMore: 'Order more',
    errNetwork: 'Network error. Please check your connection and try again.',
    errGeneric: 'Something went wrong. Please try again.',
    openingBanner: 'Opening 18 August 2026 — online ordering opens then. Have a look around!',
    heroLine: 'This is a cafe. And a bar. And a theatre, too. Please come in.',
    openNow: 'Open now · bar till 23:00',
    homeMenu: 'Menu', homeMenuSub: 'Breakfast till 14:00 · bar from 17:00',
    homeOrder: 'Order for pickup', homeOrderSub: 'Ready in 15–30 minutes',
    homeTonight: 'On the wall tonight', homeTonightSub: 'Projector · free entrance',
    homeCard: 'De Nikskaart', homeCardSub: 'Points ride on your phone number',
    homeFind: 'Find us', homeFindSub: "The blue window on the Fisherman's Village road",
    hoursBreakfast: '07:00 — 14:00 Breakfast', hoursBar: '17:00 — 23:00 Bar', place: 'Bophut · Koh Samui',
    tonightBody: 'What goes on the wall is decided on the day. Ask at the bar, or just look up when you come in.',
    eventLabel: 'Tonight', promoLabel: 'Offer',
    cartEmpty: 'Nothing in the basket yet.',
    navHome: 'Home', navMenu: 'Menu', navOrder: 'Order', navTonight: 'Tonight', navCard: 'Card',
    openingCta: 'Ordering opens 18 Aug',
  },
  th: {
    tagline: 'สั่งออนไลน์ · บ่อผุด เกาะสมุย',
    all: 'ทั้งหมด',
    loading: 'กำลังโหลดเมนู…',
    emptyMenu: 'เมนูกำลังจัดเตรียม โปรดกลับมาใหม่เร็ว ๆ นี้',
    soldOut: 'หมด',
    add: 'เพิ่ม',
    menuTitle: 'เมนู',
    addToOrder: 'สั่งเมนูนี้',
    customise: 'จัดโบวล์',
    from: 'เริ่มต้น',
    chooseIngredients: 'เลือกส่วนผสมที่ชอบได้เลย ผสมกันตามใจ',
    choose: 'เลือก',
    clearAll: 'ล้างทั้งหมด',
    cartItems: n => `${n} รายการ`,
    checkout: 'ชำระเงิน',
    yourOrder: 'รายการของคุณ',
    subtotal: 'ยอดรวม',
    tax: 'ภาษี 7%',
    total: 'รวมทั้งหมด',
    pickup: 'รับที่ร้าน',
    delivery: 'จัดส่ง',
    namePh: 'ชื่อของคุณ *',
    phonePh: 'เบอร์โทรศัพท์ * (สะสมแต้ม)',
    addressPh: 'ที่อยู่จัดส่งในบ่อผุด *',
    notesPh: 'หมายเหตุ (ถ้ามี)',
    placeOrder: type => `สั่งเลย (${type})`,
    placing: 'กำลังส่งคำสั่งซื้อ…',
    pointsNote: 'สะสม 1 แต้มทุก ๆ ฿50 แต้มผูกกับเบอร์โทรของคุณ ใช้เป็นส่วนลดที่ร้านได้',
    orderReceived: 'ได้รับคำสั่งซื้อแล้ว!',
    orderWord: 'ออเดอร์',
    totalTax: 'ยอดรวม (รวมภาษี 7%)',
    scanToPay: 'สแกนจ่ายด้วยพร้อมเพย์',
    orCashPickup: 'หรือชำระเงินสดตอนรับสินค้า',
    orCashDelivery: 'หรือชำระเงินสดตอนจัดส่ง',
    payLaterPickup: 'ชำระเงินสดหรือพร้อมเพย์ตอนรับสินค้า',
    payLaterDelivery: 'ชำระเงินสดหรือพร้อมเพย์ตอนจัดส่ง',
    earned: (p, b) => `คุณได้รับ ${p} แต้ม — ยอดสะสม ${b} แต้ม ใช้เป็นส่วนลดครั้งถัดไปได้`,
    orderMore: 'สั่งเพิ่ม',
    errNetwork: 'การเชื่อมต่อมีปัญหา กรุณาลองใหม่อีกครั้ง',
    errGeneric: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    openingBanner: 'เปิด 18 สิงหาคม 2026 — เปิดรับออเดอร์ออนไลน์วันนั้น ลองดูเมนูก่อนได้เลย!',
    heroLine: 'ที่นี่เป็นคาเฟ่ เป็นบาร์ และเป็นโรงหนังด้วย เชิญเข้ามาเลย',
    openNow: 'เปิดอยู่ · บาร์ถึง 23:00',
    homeMenu: 'เมนู', homeMenuSub: 'อาหารเช้าถึง 14:00 · บาร์เริ่ม 17:00',
    homeOrder: 'สั่งกลับบ้าน', homeOrderSub: 'พร้อมใน 15–30 นาที',
    homeTonight: 'คืนนี้ฉายอะไร', homeTonightSub: 'โปรเจกเตอร์ · เข้าฟรี',
    homeCard: 'บัตรนิกเซน', homeCardSub: 'แต้มผูกกับเบอร์โทรของคุณ',
    homeFind: 'หาเราเจอได้ที่', homeFindSub: 'หน้าต่างสีน้ำเงิน ถนนหมู่บ้านชาวประมง',
    hoursBreakfast: '07:00 — 14:00 อาหารเช้า', hoursBar: '17:00 — 23:00 บาร์', place: 'บ่อผุด · เกาะสมุย',
    tonightBody: 'จะฉายอะไรตัดสินใจกันวันต่อวัน ถามที่บาร์ได้ หรือเข้ามาแล้วเงยหน้าดูเลย',
    eventLabel: 'คืนนี้', promoLabel: 'โปรโมชั่น',
    cartEmpty: 'ยังไม่มีอะไรในตะกร้า',
    navHome: 'หน้าแรก', navMenu: 'เมนู', navOrder: 'ออเดอร์', navTonight: 'คืนนี้', navCard: 'บัตร',
    openingCta: 'เปิดรับออเดอร์ 18 ส.ค.',
  },
  ru: {
    tagline: 'Онлайн-заказ · Бопхут, Самуи',
    all: 'Все',
    loading: 'Загрузка меню…',
    emptyMenu: 'Меню скоро появится — загляните позже.',
    soldOut: 'Нет в наличии',
    add: 'Добавить',
    menuTitle: 'Меню',
    addToOrder: 'В заказ',
    customise: 'Собрать',
    from: 'от',
    chooseIngredients: 'Выберите любые ингредиенты — комбинируйте как хотите.',
    choose: 'Выберите',
    clearAll: 'Очистить всё',
    cartItems: n => {
      const mod10 = n % 10, mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `${n} позиция`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} позиции`;
      return `${n} позиций`;
    },
    checkout: 'Оформить',
    yourOrder: 'Ваш заказ',
    subtotal: 'Сумма',
    tax: 'Налог 7%',
    total: 'Итого',
    pickup: 'Самовывоз',
    delivery: 'Доставка',
    namePh: 'Ваше имя *',
    phonePh: 'Номер телефона * (начисляются баллы)',
    addressPh: 'Адрес доставки в Бопхуте *',
    notesPh: 'Комментарий (необязательно)',
    placeOrder: type => `Оформить заказ (${type.toLowerCase()})`,
    placing: 'Отправка заказа…',
    pointsNote: '1 балл за каждые ฿50. Баллы привязаны к вашему номеру телефона — это скидка на следующий заказ.',
    orderReceived: 'Заказ принят!',
    orderWord: 'Заказ',
    totalTax: 'Итого (вкл. налог 7%)',
    scanToPay: 'Отсканируйте, чтобы оплатить через PromptPay',
    orCashPickup: 'Или оплатите наличными при получении.',
    orCashDelivery: 'Или оплатите наличными при доставке.',
    payLaterPickup: 'Оплата наличными или PromptPay при получении.',
    payLaterDelivery: 'Оплата наличными или PromptPay при доставке.',
    earned: (p, b) => `Вы получили ${p} баллов — на счету ${b}. Баллы дают скидку на следующий заказ.`,
    orderMore: 'Заказать ещё',
    errNetwork: 'Ошибка сети. Проверьте подключение и попробуйте снова.',
    errGeneric: 'Что-то пошло не так. Попробуйте ещё раз.',
    openingBanner: 'Открытие 18 августа 2026 — тогда откроются онлайн-заказы. Пока осмотритесь!',
    heroLine: 'Это кафе. И бар. И ещё театр. Заходите.',
    openNow: 'Открыто · бар до 23:00',
    homeMenu: 'Меню', homeMenuSub: 'Завтрак до 14:00 · бар с 17:00',
    homeOrder: 'Заказ навынос', homeOrderSub: 'Готово за 15–30 минут',
    homeTonight: 'Что на стене сегодня', homeTonightSub: 'Проектор · вход свободный',
    homeCard: 'Карта Niksen', homeCardSub: 'Баллы привязаны к номеру телефона',
    homeFind: 'Как нас найти', homeFindSub: 'Синее окно на дороге Fisherman\'s Village',
    hoursBreakfast: '07:00 — 14:00 Завтрак', hoursBar: '17:00 — 23:00 Бар', place: 'Бопхут · Ко Самуи',
    tonightBody: 'Что покажем — решаем в тот же день. Спросите у бара или просто поднимите глаза, когда зайдёте.',
    eventLabel: 'Сегодня', promoLabel: 'Акция',
    cartEmpty: 'В корзине пока пусто.',
    navHome: 'Главная', navMenu: 'Меню', navOrder: 'Заказ', navTonight: 'Вечер', navCard: 'Карта',
    openingCta: 'Заказы с 18 авг.',
  },
};

export function detectLang(): Lang {
  const saved = localStorage.getItem('niksen_lang');
  if (saved === 'en' || saved === 'th' || saved === 'ru') return saved;
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('th')) return 'th';
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

export function localizedName(item: { name: string; name_th?: string | null; name_ru?: string | null }, lang: Lang): string {
  if (lang === 'th' && item.name_th) return item.name_th;
  if (lang === 'ru' && item.name_ru) return item.name_ru;
  return item.name;
}

export function localizedDescription(
  item: { description?: string | null; description_th?: string | null; description_ru?: string | null },
  lang: Lang,
): string {
  if (lang === 'th' && item.description_th) return item.description_th;
  if (lang === 'ru' && item.description_ru) return item.description_ru;
  return item.description || '';
}

// Menu category labels per language (falls back to the raw category name).
export const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  en: {},
  th: { Coffee: 'กาแฟ', Bowls: 'โบวล์', Breakfast: 'อาหารเช้า', Smoothies: 'สมูทตี้', Juices: 'น้ำผลไม้', 'Signature Tea': 'ชาซิกเนเจอร์', Soups: 'ซุป', 'Triangle Sandwiches': 'แซนด์วิชสามเหลี่ยม', Burritos: 'เบอร์ริโต' },
  ru: { Coffee: 'Кофе', Bowls: 'Боулы', Breakfast: 'Завтрак', Smoothies: 'Смузи', Juices: 'Соки', 'Signature Tea': 'Фирменный чай', Soups: 'Супы', 'Triangle Sandwiches': 'Треугольные сэндвичи', Burritos: 'Буррито' },
};

export function localizedCategory(category: string, lang: Lang): string {
  return CATEGORY_LABELS[lang]?.[category] || category;
}
