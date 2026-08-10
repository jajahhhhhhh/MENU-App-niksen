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
  customise: string;
  from: string;
  chooseIngredients: string;
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
    customise: 'Build it',
    from: 'from',
    chooseIngredients: 'Pick anything you like — mix and match.',
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
    openingCta: 'Ordering opens 18 Aug',
  },
  th: {
    tagline: 'สั่งออนไลน์ · บ่อผุด เกาะสมุย',
    all: 'ทั้งหมด',
    loading: 'กำลังโหลดเมนู…',
    emptyMenu: 'เมนูกำลังจัดเตรียม โปรดกลับมาใหม่เร็ว ๆ นี้',
    soldOut: 'หมด',
    add: 'เพิ่ม',
    customise: 'จัดโบวล์',
    from: 'เริ่มต้น',
    chooseIngredients: 'เลือกส่วนผสมที่ชอบได้เลย ผสมกันตามใจ',
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
    openingCta: 'เปิดรับออเดอร์ 18 ส.ค.',
  },
  ru: {
    tagline: 'Онлайн-заказ · Бопхут, Самуи',
    all: 'Все',
    loading: 'Загрузка меню…',
    emptyMenu: 'Меню скоро появится — загляните позже.',
    soldOut: 'Нет в наличии',
    add: 'Добавить',
    customise: 'Собрать',
    from: 'от',
    chooseIngredients: 'Выберите любые ингредиенты — комбинируйте как хотите.',
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
