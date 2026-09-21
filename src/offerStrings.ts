import { Lang } from './i18n';
import { LegalSection } from './LegalPage';

export interface OfferStrings {
  pageTitle: string;
  home: string;
  order: string;
  effectiveLabel: string;
  tocLabel: string;
  intro: string[];
  sections: LegalSection[];
  labels: {
    business: string;
    registration: string;
    address: string;
    email: string;
    phone: string;
  };
}

export const OFFER: Record<Lang, OfferStrings> = {
  en: {
    pageTitle: 'Public Offer',
    home: 'Back to site',
    order: 'Order online',
    effectiveLabel: 'Effective',
    tocLabel: 'On this page',
    intro: [
      'This Public Offer sets out the terms on which niksen secret bar (“we”, “us”, “the Seller”) sells food and drinks to you (“the Customer”) for pickup.',
      'It is a public offer under Thai law. When you place an order with us, you accept these terms and a binding agreement is formed between you and us. Please read it before ordering — if you do not agree, please do not place an order.',
    ],
    labels: {
      business: 'Business',
      registration: 'Registration',
      address: 'Address',
      email: 'Email',
      phone: 'Phone',
    },
    sections: [
      {
        id: 'seller',
        heading: '1. The Seller',
        paragraphs: ['Your order is sold and fulfilled by:'],
      },
      {
        id: 'definitions',
        heading: '2. Definitions',
        bullets: [
          '“Offer” — this document and the terms it contains.',
          '“Order” — a request to buy items that you submit through our website or at the bar.',
          '“Acceptance” — our confirmation of your order, at which point the agreement is formed.',
          '“Menu” — the items and prices we currently offer, which may change from time to time.',
        ],
      },
      {
        id: 'subject',
        heading: '3. What this offer covers',
        paragraphs: [
          'We offer prepared food and drinks for pickup at our bar in Bophut, Koh Samui, at the prices shown in our menu at the time you order.',
        ],
      },
      {
        id: 'ordering',
        heading: '4. Placing an order',
        bullets: [
          'You can order through our website or in person at the bar.',
          'Please give a correct name and phone number.',
          'Your order is accepted when we confirm it and give you an order number.',
          'We may decline or cancel an order — for example if an item is unavailable, or we suspect an error or fraud — and we will refund any payment already made.',
        ],
      },
      {
        id: 'prices',
        heading: '5. Prices and tax',
        paragraphs: [
          'Prices are shown in Thai Baht (฿). The tax shown at checkout (currently 7%) is added to your order total. The price that applies is the one shown when you confirm your order. We may change menu prices at any time, but not for an order that has already been confirmed.',
        ],
      },
      {
        id: 'payment',
        heading: '6. Payment',
        paragraphs: [
          'You can pay in advance by PromptPay — by scanning the QR code shown after you order — or pay by cash when you collect your order, as shown at checkout.',
          'When you pay by PromptPay you do so through your own banking app. We never see or store your card or bank-account details.',
        ],
      },
      {
        id: 'fulfilment',
        heading: '7. Pickup',
        bullets: [
          'We are open daily 07:30–14:00 and 17:00–23:00. Pickup is at our bar in Bophut, Koh Samui.',
          'We will tell you when your order will be ready, and hold it for you at the bar.',
          'Please keep your phone reachable so we can contact you about your order.',
          'We do not deliver at present. If that changes, these terms will be updated before we accept a delivery order.',
        ],
      },
      {
        id: 'changes',
        heading: '8. Changes and cancellation',
        paragraphs: [
          'Once an order is confirmed, its contents cannot be changed. To cancel, please contact us as soon as possible and before we begin preparing your order. We cannot cancel an order that is already being prepared or is ready for pickup.',
        ],
      },
      {
        id: 'rewards',
        heading: '9. Rewards points',
        bullets: [
          'You earn 1 point for every ฿50 spent on paid orders.',
          'Points are linked to your phone number and can be redeemed in-store for money off.',
          'Points are personal, non-transferable and have no cash value.',
          'Points may be reversed if the related order is cancelled or refunded.',
          'We may change or end the rewards programme, giving reasonable notice of any material change.',
        ],
      },
      {
        id: 'quality',
        heading: '10. Quality, complaints and refunds',
        paragraphs: [
          'Please check your order when you receive it. If something is missing, incorrect or not of acceptable quality, contact us promptly — ideally within 30 minutes of collecting it — so we can put it right.',
          'We will replace the item or, where appropriate, offer a refund. Refunds are made to your original payment method, typically within 5–15 business days.',
        ],
      },
      {
        id: 'responsibilities',
        heading: '11. Your responsibilities',
        bullets: [
          'Give accurate order and contact details.',
          'Be available to collect your order at the bar at the agreed time.',
          'Tell us about any allergy or dietary requirement before you order (see the next section).',
        ],
      },
      {
        id: 'allergens',
        heading: '12. Allergens and liability',
        paragraphs: [
          'Our food is prepared in a kitchen that also handles common allergens, such as nuts, dairy, gluten, soy and shellfish. If you have an allergy or dietary requirement, please check with us before ordering.',
          'To the extent permitted by law, we are not liable for indirect or unforeseeable losses, and we are not responsible for delays or failures caused by events beyond our reasonable control.',
        ],
      },
      {
        id: 'data',
        heading: '13. Personal data',
        paragraphs: [
          'We handle the personal data you give us when ordering — such as your name and phone number — in line with our Privacy Policy.',
        ],
        link: { href: '/privacy', label: 'Read the Privacy Policy' },
      },
      {
        id: 'law',
        heading: '14. Governing law and disputes',
        paragraphs: [
          'These terms are governed by the laws of Thailand. We will try to resolve any issue with you directly and in good faith. Any dispute that cannot be resolved is subject to the competent courts of Thailand.',
        ],
      },
      {
        id: 'contact',
        heading: '15. Contact us',
        paragraphs: ['For any question about your order or these terms, please contact us:'],
      },
    ],
  },

  th: {
    pageTitle: 'ข้อเสนอสาธารณะ',
    home: 'กลับสู่เว็บไซต์',
    order: 'สั่งออนไลน์',
    effectiveLabel: 'มีผลบังคับใช้',
    tocLabel: 'ในหน้านี้',
    intro: [
      'ข้อเสนอสาธารณะฉบับนี้กำหนดเงื่อนไขที่ niksen secret bar (“เรา” หรือ “ผู้ขาย”) จำหน่ายอาหารและเครื่องดื่มให้แก่คุณ (“ลูกค้า”) สำหรับการรับที่ร้าน',
      'ถือเป็นข้อเสนอสาธารณะตามกฎหมายไทย เมื่อคุณสั่งซื้อกับเรา ถือว่าคุณยอมรับเงื่อนไขเหล่านี้ และเกิดเป็นข้อตกลงที่มีผลผูกพันระหว่างคุณกับเรา โปรดอ่านก่อนสั่งซื้อ — หากคุณไม่ยอมรับ โปรดอย่าสั่งซื้อ',
    ],
    labels: {
      business: 'ผู้ประกอบการ',
      registration: 'เลขทะเบียน',
      address: 'ที่อยู่',
      email: 'อีเมล',
      phone: 'โทรศัพท์',
    },
    sections: [
      {
        id: 'seller',
        heading: '1. ผู้ขาย',
        paragraphs: ['คำสั่งซื้อของคุณจำหน่ายและจัดทำโดย:'],
      },
      {
        id: 'definitions',
        heading: '2. คำนิยาม',
        bullets: [
          '“ข้อเสนอ” — เอกสารฉบับนี้และเงื่อนไขที่ระบุไว้',
          '“คำสั่งซื้อ” — คำขอซื้อสินค้าที่คุณส่งผ่านเว็บไซต์ของเราหรือที่ร้าน',
          '“การยอมรับ” — การยืนยันคำสั่งซื้อของเรา ซึ่งเป็นจุดที่ข้อตกลงเกิดขึ้น',
          '“เมนู” — รายการสินค้าและราคาที่เราเสนอในปัจจุบัน ซึ่งอาจเปลี่ยนแปลงได้เป็นครั้งคราว',
        ],
      },
      {
        id: 'subject',
        heading: '3. ขอบเขตของข้อเสนอนี้',
        paragraphs: [
          'เราจำหน่ายอาหารและเครื่องดื่มที่จัดเตรียมแล้ว สำหรับการรับที่ร้านของเราในบ่อผุด เกาะสมุย ตามราคาที่แสดงในเมนูของเรา ณ เวลาที่คุณสั่งซื้อ',
        ],
      },
      {
        id: 'ordering',
        heading: '4. การสั่งซื้อ',
        bullets: [
          'คุณสามารถสั่งซื้อผ่านเว็บไซต์ของเราหรือด้วยตนเองที่ร้าน',
          'โปรดระบุชื่อและหมายเลขโทรศัพท์ที่ถูกต้อง',
          'คำสั่งซื้อของคุณจะได้รับการยอมรับเมื่อเรายืนยันและให้หมายเลขคำสั่งซื้อแก่คุณ',
          'เราอาจปฏิเสธหรือยกเลิกคำสั่งซื้อ เช่น หากสินค้าไม่พร้อมจำหน่าย หรือเราสงสัยว่ามีข้อผิดพลาดหรือการฉ้อโกง โดยเราจะคืนเงินที่ชำระมาแล้ว',
        ],
      },
      {
        id: 'prices',
        heading: '5. ราคาและภาษี',
        paragraphs: [
          'ราคาแสดงเป็นเงินบาทไทย (฿) ภาษีที่แสดง ณ ขั้นตอนชำระเงิน (ปัจจุบัน 7%) จะถูกบวกเข้ากับยอดรวมของคุณ ราคาที่มีผลคือราคาที่แสดงเมื่อคุณยืนยันคำสั่งซื้อ เราอาจเปลี่ยนแปลงราคาเมนูเมื่อใดก็ได้ แต่จะไม่กระทบคำสั่งซื้อที่ยืนยันแล้ว',
        ],
      },
      {
        id: 'payment',
        heading: '6. การชำระเงิน',
        paragraphs: [
          'คุณสามารถชำระล่วงหน้าด้วยพร้อมเพย์ — โดยสแกนคิวอาร์โค้ดที่แสดงหลังสั่งซื้อ — หรือชำระด้วยเงินสดเมื่อมารับที่ร้าน ตามที่แสดง ณ ขั้นตอนชำระเงิน',
          'เมื่อคุณชำระด้วยพร้อมเพย์ คุณทำผ่านแอปธนาคารของคุณเอง เราไม่เห็นและไม่จัดเก็บข้อมูลบัตรหรือบัญชีธนาคารของคุณ',
        ],
      },
      {
        id: 'fulfilment',
        heading: '7. การรับที่ร้าน',
        bullets: [
          'เราเปิดทุกวัน 07:30–14:00 น. และ 17:00–23:00 น. รับสินค้าที่ร้านของเราในบ่อผุด เกาะสมุย',
          'เราจะแจ้งเวลาที่คำสั่งซื้อของคุณพร้อม และเก็บไว้ให้คุณที่ร้าน',
          'โปรดเปิดรับสายโทรศัพท์ เพื่อให้เราติดต่อคุณเรื่องคำสั่งซื้อได้',
          'ขณะนี้เราไม่มีบริการจัดส่ง หากมีในภายหลัง เราจะปรับปรุงข้อกำหนดนี้ก่อนรับคำสั่งซื้อแบบจัดส่ง',
        ],
      },
      {
        id: 'changes',
        heading: '8. การเปลี่ยนแปลงและการยกเลิก',
        paragraphs: [
          'เมื่อยืนยันคำสั่งซื้อแล้ว จะไม่สามารถเปลี่ยนแปลงรายการได้ หากต้องการยกเลิก โปรดติดต่อเราโดยเร็วที่สุดและก่อนที่เราจะเริ่มจัดเตรียม เราไม่สามารถยกเลิกคำสั่งซื้อที่กำลังจัดเตรียมอยู่หรือพร้อมให้รับแล้ว',
        ],
      },
      {
        id: 'rewards',
        heading: '9. แต้มสะสม',
        bullets: [
          'คุณจะได้รับ 1 แต้มทุก ๆ ฿50 ที่ใช้จ่ายในคำสั่งซื้อที่ชำระเงินแล้ว',
          'แต้มผูกกับหมายเลขโทรศัพท์ของคุณ และใช้เป็นส่วนลดที่ร้านได้',
          'แต้มเป็นสิทธิเฉพาะบุคคล ไม่สามารถโอนให้ผู้อื่น และไม่มีมูลค่าเป็นเงินสด',
          'แต้มอาจถูกหักคืนหากคำสั่งซื้อที่เกี่ยวข้องถูกยกเลิกหรือคืนเงิน',
          'เราอาจเปลี่ยนแปลงหรือยุติโปรแกรมสะสมแต้ม โดยจะแจ้งล่วงหน้าตามสมควรสำหรับการเปลี่ยนแปลงที่มีนัยสำคัญ',
        ],
      },
      {
        id: 'quality',
        heading: '10. คุณภาพ ข้อร้องเรียน และการคืนเงิน',
        paragraphs: [
          'โปรดตรวจสอบคำสั่งซื้อของคุณเมื่อได้รับ หากมีรายการขาด ไม่ถูกต้อง หรือคุณภาพไม่เป็นที่ยอมรับ โปรดติดต่อเราโดยเร็ว — ควรภายใน 30 นาทีหลังรับสินค้า — เพื่อให้เราแก้ไขให้',
          'เราจะเปลี่ยนสินค้าให้ หรือคืนเงินตามความเหมาะสม การคืนเงินจะทำผ่านช่องทางการชำระเงินเดิมของคุณ โดยทั่วไปภายใน 5–15 วันทำการ',
        ],
      },
      {
        id: 'responsibilities',
        heading: '11. ความรับผิดชอบของคุณ',
        bullets: [
          'ให้ข้อมูลคำสั่งซื้อและข้อมูลติดต่อที่ถูกต้อง',
          'มารับสินค้าที่ร้านตามเวลาที่ตกลงกัน',
          'แจ้งเราเกี่ยวกับอาการแพ้หรือข้อจำกัดด้านอาหารก่อนสั่งซื้อ (ดูหัวข้อถัดไป)',
        ],
      },
      {
        id: 'allergens',
        heading: '12. สารก่อภูมิแพ้และความรับผิด',
        paragraphs: [
          'อาหารของเราจัดเตรียมในครัวที่มีการจัดการสารก่อภูมิแพ้ทั่วไป เช่น ถั่ว นม กลูเตน ถั่วเหลือง และหอย/กุ้ง หากคุณมีอาการแพ้หรือข้อจำกัดด้านอาหาร โปรดสอบถามเราก่อนสั่งซื้อ',
          'เท่าที่กฎหมายอนุญาต เราไม่รับผิดต่อความเสียหายทางอ้อมหรือที่ไม่อาจคาดหมายได้ และไม่รับผิดชอบต่อความล่าช้าหรือความล้มเหลวอันเกิดจากเหตุการณ์ที่อยู่นอกเหนือการควบคุมตามสมควรของเรา',
        ],
      },
      {
        id: 'data',
        heading: '13. ข้อมูลส่วนบุคคล',
        paragraphs: [
          'เราจัดการข้อมูลส่วนบุคคลที่คุณให้เมื่อสั่งซื้อ — เช่น ชื่อ และหมายเลขโทรศัพท์ — ตามนโยบายความเป็นส่วนตัวของเรา',
        ],
        link: { href: '/privacy', label: 'อ่านนโยบายความเป็นส่วนตัว' },
      },
      {
        id: 'law',
        heading: '14. กฎหมายที่ใช้บังคับและข้อพิพาท',
        paragraphs: [
          'เงื่อนไขเหล่านี้อยู่ภายใต้กฎหมายของประเทศไทย เราจะพยายามแก้ไขปัญหากับคุณโดยตรงด้วยความสุจริต ข้อพิพาทที่ไม่สามารถตกลงกันได้ให้อยู่ในเขตอำนาจของศาลไทยที่มีเขตอำนาจ',
        ],
      },
      {
        id: 'contact',
        heading: '15. ติดต่อเรา',
        paragraphs: ['หากมีคำถามเกี่ยวกับคำสั่งซื้อหรือเงื่อนไขเหล่านี้ โปรดติดต่อเรา:'],
      },
    ],
  },

  ru: {
    pageTitle: 'Публичная оферта',
    home: 'На сайт',
    order: 'Заказать',
    effectiveLabel: 'Действует с',
    tocLabel: 'На этой странице',
    intro: [
      'Эта Публичная оферта устанавливает условия, на которых niksen secret bar («мы», «Продавец») продаёт вам («Покупатель») еду и напитки для самовывоза.',
      'Это публичная оферта по законодательству Таиланда. Оформляя заказ, вы принимаете эти условия, и между вами и нами заключается обязывающее соглашение. Пожалуйста, ознакомьтесь с офертой перед заказом — если вы не согласны, не оформляйте заказ.',
    ],
    labels: {
      business: 'Компания',
      registration: 'Регистрация',
      address: 'Адрес',
      email: 'Эл. почта',
      phone: 'Телефон',
    },
    sections: [
      {
        id: 'seller',
        heading: '1. Продавец',
        paragraphs: ['Ваш заказ продаётся и исполняется:'],
      },
      {
        id: 'definitions',
        heading: '2. Определения',
        bullets: [
          '«Оферта» — настоящий документ и содержащиеся в нём условия.',
          '«Заказ» — запрос на покупку товаров, который вы направляете через наш сайт или в баре.',
          '«Акцепт» — наше подтверждение заказа, с этого момента соглашение считается заключённым.',
          '«Меню» — товары и цены, которые мы предлагаем в настоящее время; они могут время от времени меняться.',
        ],
      },
      {
        id: 'subject',
        heading: '3. Что охватывает эта оферта',
        paragraphs: [
          'Мы предлагаем готовую еду и напитки для самовывоза в нашем баре в Бопхуте, Самуи, по ценам, указанным в меню на момент заказа.',
        ],
      },
      {
        id: 'ordering',
        heading: '4. Оформление заказа',
        bullets: [
          'Вы можете заказать через наш сайт или лично в баре.',
          'Пожалуйста, укажите верное имя и номер телефона.',
          'Заказ считается принятым, когда мы подтверждаем его и присваиваем номер заказа.',
          'Мы можем отклонить или отменить заказ — например, если товара нет в наличии или мы подозреваем ошибку либо мошенничество — и вернём уже внесённую оплату.',
        ],
      },
      {
        id: 'prices',
        heading: '5. Цены и налог',
        paragraphs: [
          'Цены указаны в тайских батах (฿). Налог, показанный при оформлении (сейчас 7%), добавляется к сумме заказа. Применяется цена, показанная в момент подтверждения заказа. Мы можем изменять цены меню в любое время, но не для уже подтверждённого заказа.',
        ],
      },
      {
        id: 'payment',
        heading: '6. Оплата',
        paragraphs: [
          'Вы можете оплатить заранее через PromptPay — отсканировав QR-код, показанный после заказа, — или оплатить наличными при получении заказа, как указано при оформлении.',
          'При оплате через PromptPay вы платите в своём банковском приложении. Мы никогда не видим и не храним данные вашей карты или банковского счёта.',
        ],
      },
      {
        id: 'fulfilment',
        heading: '7. Самовывоз',
        bullets: [
          'Мы открыты каждый день с 07:30 до 14:00 и с 17:00 до 23:00. Самовывоз — в нашем баре в Бопхуте, Самуи.',
          'Мы сообщим, когда заказ будет готов, и придержим его для вас в баре.',
          'Пожалуйста, будьте на связи по телефону, чтобы мы могли связаться с вами по заказу.',
          'Сейчас мы не осуществляем доставку. Если это изменится, мы обновим эти условия до приёма заказа с доставкой.',
        ],
      },
      {
        id: 'changes',
        heading: '8. Изменение и отмена',
        paragraphs: [
          'После подтверждения состав заказа изменить нельзя. Чтобы отменить заказ, свяжитесь с нами как можно скорее и до начала приготовления. Мы не можем отменить заказ, который уже готовится или готов к выдаче.',
        ],
      },
      {
        id: 'rewards',
        heading: '9. Баллы лояльности',
        bullets: [
          'Вы получаете 1 балл за каждые ฿50, потраченные в оплаченных заказах.',
          'Баллы привязаны к вашему номеру телефона и могут быть использованы как скидка в баре.',
          'Баллы персональные, не подлежат передаче и не имеют денежной стоимости.',
          'Баллы могут быть аннулированы, если связанный заказ отменён или возвращён.',
          'Мы можем изменить или прекратить программу лояльности, разумно уведомив о существенных изменениях.',
        ],
      },
      {
        id: 'quality',
        heading: '10. Качество, жалобы и возвраты',
        paragraphs: [
          'Пожалуйста, проверяйте заказ при получении. Если чего-то не хватает, что-то неверно или качество неприемлемо, свяжитесь с нами как можно скорее — желательно в течение 30 минут после получения — чтобы мы могли всё исправить.',
          'Мы заменим товар или, при необходимости, предложим возврат средств. Возврат производится на исходный способ оплаты, обычно в течение 5–15 рабочих дней.',
        ],
      },
      {
        id: 'responsibilities',
        heading: '11. Ваши обязанности',
        bullets: [
          'Указывать точные данные заказа и контактные данные.',
          'Забрать заказ в баре в согласованное время.',
          'Сообщать нам об аллергии или диетических требованиях до заказа (см. следующий раздел).',
        ],
      },
      {
        id: 'allergens',
        heading: '12. Аллергены и ответственность',
        paragraphs: [
          'Наша еда готовится на кухне, где также используются распространённые аллергены, такие как орехи, молочные продукты, глютен, соя и морепродукты. При наличии аллергии или диетических требований, пожалуйста, уточните у нас до заказа.',
          'В пределах, допускаемых законом, мы не несём ответственности за косвенные или непредвиденные убытки и не отвечаем за задержки или сбои, вызванные обстоятельствами вне нашего разумного контроля.',
        ],
      },
      {
        id: 'data',
        heading: '13. Персональные данные',
        paragraphs: [
          'Мы обрабатываем персональные данные, которые вы предоставляете при заказе — например, имя и номер телефона — в соответствии с нашей Политикой конфиденциальности.',
        ],
        link: { href: '/privacy', label: 'Читать Политику конфиденциальности' },
      },
      {
        id: 'law',
        heading: '14. Применимое право и споры',
        paragraphs: [
          'Эти условия регулируются законодательством Таиланда. Мы постараемся решить любой вопрос с вами напрямую и добросовестно. Спор, который не удалось урегулировать, подлежит рассмотрению в компетентных судах Таиланда.',
        ],
      },
      {
        id: 'contact',
        heading: '15. Свяжитесь с нами',
        paragraphs: ['По любым вопросам о заказе или этих условиях, пожалуйста, свяжитесь с нами:'],
      },
    ],
  },
};
