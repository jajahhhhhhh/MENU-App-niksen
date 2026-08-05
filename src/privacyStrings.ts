import { Lang } from './i18n';

// --- Company / controller details -------------------------------------------------
// Fill in the bracketed placeholders before publishing. These render directly
// into the "Who we are" and "Contact us" sections of the policy.
export const COMPANY = {
  brand: 'niksen secret bar',
  legalName: 'NICHEN Co., Ltd.',
  registration: '0845568023436',
  email: 'privacy@niksensamui.com',
  phone: '+66 62 962 4644',
  address: '15 Moo 2, Bo Phut, Ko Samui, Surat Thani 84320, Thailand',
  effectiveDate: '18 August 2026',
};

export interface PolicySection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PrivacyStrings {
  pageTitle: string;
  home: string;
  order: string;
  effectiveLabel: string;
  tocLabel: string;
  intro: string[];
  sections: PolicySection[];
  labels: {
    business: string;
    registration: string;
    address: string;
    email: string;
    phone: string;
  };
}

export const PRIVACY: Record<Lang, PrivacyStrings> = {
  en: {
    pageTitle: 'Privacy Policy',
    home: 'Back to site',
    order: 'Order online',
    effectiveLabel: 'Effective',
    tocLabel: 'On this page',
    intro: [
      'This Privacy Policy explains how niksen secret bar (“we”, “us”, “our”) collects, uses, discloses and protects your personal data when you order from us, join our rewards programme, or use our website.',
      'We handle personal data in accordance with Thailand’s Personal Data Protection Act B.E. 2562 (2019) (the “PDPA”). By placing an order or giving us your details, you acknowledge the practices described here.',
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
        id: 'who',
        heading: '1. Who we are',
        paragraphs: [
          'niksen secret bar is a café and bar in Bophut, Koh Samui, Thailand. For the purposes of the PDPA, the data controller responsible for your personal data is:',
        ],
      },
      {
        id: 'collect',
        heading: '2. Personal data we collect',
        paragraphs: ['When you order or join our rewards programme, we may collect:'],
        bullets: [
          'Your name',
          'Your phone number — which also acts as your rewards ID',
          'Your email address, if you choose to give it',
          'A delivery address, for delivery orders only',
          'Order details and any notes or preferences you add',
          'Your rewards balance, tier and spending history',
          'Your language preference for our website',
        ],
      },
      {
        id: 'payments',
        heading: '3. Payments',
        paragraphs: [
          'When you pay by PromptPay, you do so through your own banking app — we do not see or store your card or bank-account credentials. Cash payments involve no online data. We keep a record of the amount, date and order the payment relates to.',
        ],
      },
      {
        id: 'use',
        heading: '4. How and why we use your data',
        paragraphs: ['We use your personal data for the following purposes and legal bases under the PDPA:'],
        bullets: [
          'To prepare, fulfil and deliver your orders (performance of a contract)',
          'To run our rewards programme and link points to your phone number (contract and/or your consent)',
          'To contact you about your order when needed (contract / legitimate interest)',
          'To improve our menu, service and website (legitimate interest)',
          'To meet tax, accounting and other legal obligations (legal obligation)',
        ],
      },
      {
        id: 'sharing',
        heading: '5. When we share your data',
        paragraphs: ['We share personal data only where necessary, and never sell it. We may share it with:'],
        bullets: [
          'Delivery partners (for example Grab, LINE MAN or foodpanda) — your name, phone and address — only to deliver an order you placed for delivery',
          'Payment services — PromptPay and your bank process the payment itself',
          'Trusted service providers who host or support our systems, under confidentiality obligations',
          'Government authorities or law enforcement where we are legally required to do so',
        ],
      },
      {
        id: 'cookies',
        heading: '6. Cookies and local storage',
        paragraphs: [
          'Our website uses minimal browser storage — for example, to remember your language choice. The staff point-of-sale uses a session cookie to keep staff signed in. We do not use advertising or cross-site tracking cookies.',
        ],
      },
      {
        id: 'retention',
        heading: '7. How long we keep your data',
        paragraphs: [
          'We keep order and rewards records for as long as your rewards account is active and for the period required by Thai tax and accounting law (generally at least five years). After that we delete or anonymise them. You can ask us to delete your data sooner — see “Your rights” below.',
        ],
      },
      {
        id: 'security',
        heading: '8. How we protect your data',
        paragraphs: [
          'We limit access to authorised staff, protect the point-of-sale with a PIN, and store data on systems we control. No method of transmission or storage is completely secure, but we take reasonable technical and organisational steps to protect your personal data.',
        ],
      },
      {
        id: 'rights',
        heading: '9. Your rights under the PDPA',
        paragraphs: ['Subject to the PDPA, you have the right to:'],
        bullets: [
          'Access a copy of the personal data we hold about you',
          'Correct data that is inaccurate or out of date',
          'Have your data erased',
          'Restrict or object to certain processing',
          'Receive or transfer your data (data portability)',
          'Withdraw consent at any time, without affecting past processing',
          'Lodge a complaint with the Personal Data Protection Committee (PDPC)',
        ],
      },
      {
        id: 'children',
        heading: '10. Children’s privacy',
        paragraphs: [
          'Our services are intended for a general audience and are not directed at children. We do not knowingly collect personal data from a child without the consent of a parent or guardian where the law requires it. If you believe a child has given us their data, please contact us and we will remove it.',
        ],
      },
      {
        id: 'transfers',
        heading: '11. International transfers',
        paragraphs: [
          'We operate in Thailand. Where a service provider processes personal data outside Thailand, we take steps to ensure it receives a standard of protection consistent with the PDPA.',
        ],
      },
      {
        id: 'changes',
        heading: '12. Changes to this policy',
        paragraphs: [
          'We may update this policy from time to time. The current version and its effective date are always shown on this page. Significant changes will be highlighted where appropriate.',
        ],
      },
      {
        id: 'contact',
        heading: '13. Contact us',
        paragraphs: [
          'For any privacy question, or to exercise any of your rights, please contact us:',
        ],
      },
    ],
  },

  th: {
    pageTitle: 'นโยบายความเป็นส่วนตัว',
    home: 'กลับสู่เว็บไซต์',
    order: 'สั่งออนไลน์',
    effectiveLabel: 'มีผลบังคับใช้',
    tocLabel: 'ในหน้านี้',
    intro: [
      'นโยบายความเป็นส่วนตัวฉบับนี้อธิบายวิธีที่ niksen secret bar (“เรา”) เก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลของคุณ เมื่อคุณสั่งซื้อ เข้าร่วมโปรแกรมสะสมแต้ม หรือใช้งานเว็บไซต์ของเรา',
      'เราดำเนินการกับข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (“PDPA”) การสั่งซื้อหรือการให้ข้อมูลของคุณถือว่าคุณรับทราบแนวปฏิบัติที่อธิบายไว้ในนโยบายนี้',
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
        id: 'who',
        heading: '1. เราคือใคร',
        paragraphs: [
          'niksen secret bar เป็นคาเฟ่และบาร์ในบ่อผุด เกาะสมุย ประเทศไทย ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล ผู้ควบคุมข้อมูลส่วนบุคคลที่รับผิดชอบข้อมูลของคุณคือ:',
        ],
      },
      {
        id: 'collect',
        heading: '2. ข้อมูลส่วนบุคคลที่เราเก็บ',
        paragraphs: ['เมื่อคุณสั่งซื้อหรือเข้าร่วมโปรแกรมสะสมแต้ม เราอาจเก็บข้อมูลต่อไปนี้:'],
        bullets: [
          'ชื่อของคุณ',
          'หมายเลขโทรศัพท์ของคุณ — ซึ่งใช้เป็นรหัสสมาชิกสะสมแต้มด้วย',
          'อีเมลของคุณ หากคุณเลือกที่จะให้',
          'ที่อยู่จัดส่ง เฉพาะกรณีสั่งแบบจัดส่ง',
          'รายละเอียดคำสั่งซื้อ และหมายเหตุหรือความชอบที่คุณระบุ',
          'ยอดแต้มสะสม ระดับสมาชิก และประวัติการใช้จ่ายของคุณ',
          'ภาษาที่คุณเลือกใช้บนเว็บไซต์ของเรา',
        ],
      },
      {
        id: 'payments',
        heading: '3. การชำระเงิน',
        paragraphs: [
          'เมื่อคุณชำระเงินด้วยพร้อมเพย์ คุณทำผ่านแอปธนาคารของคุณเอง — เราไม่เห็นและไม่จัดเก็บข้อมูลบัตรหรือข้อมูลบัญชีธนาคารของคุณ การชำระด้วยเงินสดไม่มีข้อมูลออนไลน์ใด ๆ เราเก็บเพียงบันทึกจำนวนเงิน วันที่ และคำสั่งซื้อที่เกี่ยวข้องกับการชำระเงินนั้น',
        ],
      },
      {
        id: 'use',
        heading: '4. เราใช้ข้อมูลของคุณอย่างไรและเพราะเหตุใด',
        paragraphs: ['เราใช้ข้อมูลส่วนบุคคลของคุณเพื่อวัตถุประสงค์และฐานทางกฎหมายตาม PDPA ดังนี้:'],
        bullets: [
          'เพื่อเตรียม จัดทำ และจัดส่งคำสั่งซื้อของคุณ (การปฏิบัติตามสัญญา)',
          'เพื่อดำเนินโปรแกรมสะสมแต้มและผูกแต้มกับหมายเลขโทรศัพท์ของคุณ (สัญญาและ/หรือความยินยอมของคุณ)',
          'เพื่อติดต่อคุณเกี่ยวกับคำสั่งซื้อเมื่อจำเป็น (สัญญา / ประโยชน์โดยชอบด้วยกฎหมาย)',
          'เพื่อปรับปรุงเมนู บริการ และเว็บไซต์ของเรา (ประโยชน์โดยชอบด้วยกฎหมาย)',
          'เพื่อปฏิบัติตามภาระผูกพันด้านภาษี บัญชี และกฎหมายอื่น ๆ (การปฏิบัติตามกฎหมาย)',
        ],
      },
      {
        id: 'sharing',
        heading: '5. เมื่อเราเปิดเผยข้อมูลของคุณ',
        paragraphs: ['เราเปิดเผยข้อมูลส่วนบุคคลเท่าที่จำเป็นเท่านั้น และไม่มีการขายข้อมูล เราอาจเปิดเผยข้อมูลแก่:'],
        bullets: [
          'พาร์ตเนอร์จัดส่ง (เช่น Grab, LINE MAN หรือ foodpanda) — ชื่อ เบอร์โทร และที่อยู่ของคุณ — เพื่อจัดส่งคำสั่งซื้อแบบจัดส่งที่คุณสั่งเท่านั้น',
          'บริการชำระเงิน — พร้อมเพย์และธนาคารของคุณเป็นผู้ดำเนินการชำระเงิน',
          'ผู้ให้บริการที่เชื่อถือได้ซึ่งดูแลหรือสนับสนุนระบบของเรา ภายใต้ข้อผูกพันด้านการรักษาความลับ',
          'หน่วยงานราชการหรือเจ้าหน้าที่บังคับใช้กฎหมายเมื่อกฎหมายกำหนด',
        ],
      },
      {
        id: 'cookies',
        heading: '6. คุกกี้และการจัดเก็บในเบราว์เซอร์',
        paragraphs: [
          'เว็บไซต์ของเราใช้การจัดเก็บในเบราว์เซอร์เพียงเล็กน้อย เช่น เพื่อจดจำภาษาที่คุณเลือก ระบบขายหน้าร้านสำหรับพนักงานใช้คุกกี้เซสชันเพื่อให้พนักงานยังคงเข้าสู่ระบบ เราไม่ใช้คุกกี้เพื่อการโฆษณาหรือการติดตามข้ามเว็บไซต์',
        ],
      },
      {
        id: 'retention',
        heading: '7. เราเก็บข้อมูลของคุณนานเท่าใด',
        paragraphs: [
          'เราเก็บบันทึกคำสั่งซื้อและแต้มสะสมตราบเท่าที่บัญชีสะสมแต้มของคุณยังใช้งานอยู่ และตามระยะเวลาที่กฎหมายภาษีและบัญชีของไทยกำหนด (โดยทั่วไปอย่างน้อยห้าปี) หลังจากนั้นเราจะลบหรือทำให้ข้อมูลไม่ระบุตัวตน คุณสามารถขอให้เราลบข้อมูลก่อนกำหนดได้ — ดู “สิทธิของคุณ” ด้านล่าง',
        ],
      },
      {
        id: 'security',
        heading: '8. เราคุ้มครองข้อมูลของคุณอย่างไร',
        paragraphs: [
          'เราจำกัดการเข้าถึงเฉพาะพนักงานที่ได้รับอนุญาต ป้องกันระบบขายหน้าร้านด้วยรหัส PIN และจัดเก็บข้อมูลในระบบที่เราควบคุม ไม่มีวิธีการส่งหรือจัดเก็บข้อมูลใดปลอดภัยโดยสมบูรณ์ แต่เราใช้มาตรการทางเทคนิคและองค์กรที่เหมาะสมเพื่อคุ้มครองข้อมูลของคุณ',
        ],
      },
      {
        id: 'rights',
        heading: '9. สิทธิของคุณตาม PDPA',
        paragraphs: ['ภายใต้ PDPA คุณมีสิทธิดังนี้:'],
        bullets: [
          'ขอเข้าถึงและขอสำเนาข้อมูลส่วนบุคคลที่เรามีเกี่ยวกับคุณ',
          'ขอแก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่เป็นปัจจุบัน',
          'ขอให้ลบข้อมูลของคุณ',
          'ขอให้ระงับหรือคัดค้านการประมวลผลบางประการ',
          'ขอรับหรือโอนย้ายข้อมูลของคุณ (สิทธิในการโอนย้ายข้อมูล)',
          'ถอนความยินยอมเมื่อใดก็ได้ โดยไม่กระทบต่อการประมวลผลที่ผ่านมา',
          'ร้องเรียนต่อคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (PDPC)',
        ],
      },
      {
        id: 'children',
        heading: '10. ความเป็นส่วนตัวของเด็ก',
        paragraphs: [
          'บริการของเรามีไว้สำหรับบุคคลทั่วไปและไม่ได้มุ่งเป้าไปที่เด็ก เราจะไม่เก็บข้อมูลส่วนบุคคลของเด็กโดยเจตนาโดยปราศจากความยินยอมของบิดามารดาหรือผู้ปกครองในกรณีที่กฎหมายกำหนด หากคุณเชื่อว่าเด็กได้ให้ข้อมูลแก่เรา โปรดติดต่อเราเพื่อให้เราลบข้อมูลนั้น',
        ],
      },
      {
        id: 'transfers',
        heading: '11. การโอนข้อมูลระหว่างประเทศ',
        paragraphs: [
          'เราดำเนินกิจการในประเทศไทย ในกรณีที่ผู้ให้บริการประมวลผลข้อมูลส่วนบุคคลนอกประเทศไทย เราจะดำเนินการเพื่อให้มั่นใจว่าข้อมูลได้รับการคุ้มครองในมาตรฐานที่สอดคล้องกับ PDPA',
        ],
      },
      {
        id: 'changes',
        heading: '12. การเปลี่ยนแปลงนโยบายนี้',
        paragraphs: [
          'เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว ฉบับปัจจุบันและวันที่มีผลบังคับใช้จะแสดงบนหน้านี้เสมอ การเปลี่ยนแปลงที่สำคัญจะได้รับการเน้นย้ำตามความเหมาะสม',
        ],
      },
      {
        id: 'contact',
        heading: '13. ติดต่อเรา',
        paragraphs: ['หากมีคำถามด้านความเป็นส่วนตัว หรือต้องการใช้สิทธิใด ๆ ของคุณ โปรดติดต่อเรา:'],
      },
    ],
  },

  ru: {
    pageTitle: 'Политика конфиденциальности',
    home: 'На сайт',
    order: 'Заказать',
    effectiveLabel: 'Действует с',
    tocLabel: 'На этой странице',
    intro: [
      'Эта Политика конфиденциальности объясняет, как niksen secret bar («мы») собирает, использует, раскрывает и защищает ваши персональные данные, когда вы делаете заказ, участвуете в программе лояльности или пользуетесь нашим сайтом.',
      'Мы обрабатываем персональные данные в соответствии с Законом Таиланда о защите персональных данных B.E. 2562 (2019) («PDPA»). Оформляя заказ или предоставляя свои данные, вы подтверждаете, что ознакомлены с описанными здесь практиками.',
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
        id: 'who',
        heading: '1. Кто мы',
        paragraphs: [
          'niksen secret bar — это кафе и бар в Бопхуте, Самуи, Таиланд. В соответствии с PDPA оператором, ответственным за ваши персональные данные, является:',
        ],
      },
      {
        id: 'collect',
        heading: '2. Какие данные мы собираем',
        paragraphs: ['Когда вы делаете заказ или участвуете в программе лояльности, мы можем собирать:'],
        bullets: [
          'Ваше имя',
          'Ваш номер телефона — он же ваш идентификатор в программе лояльности',
          'Ваш адрес электронной почты, если вы его укажете',
          'Адрес доставки — только для заказов с доставкой',
          'Детали заказа, а также заметки и предпочтения, которые вы добавляете',
          'Ваш баланс баллов, уровень и историю расходов',
          'Выбранный вами язык сайта',
        ],
      },
      {
        id: 'payments',
        heading: '3. Платежи',
        paragraphs: [
          'При оплате через PromptPay вы делаете это в своём банковском приложении — мы не видим и не храним данные вашей карты или банковского счёта. Оплата наличными не связана с онлайн-данными. Мы храним только запись о сумме, дате и заказе, к которому относится платёж.',
        ],
      },
      {
        id: 'use',
        heading: '4. Как и зачем мы используем ваши данные',
        paragraphs: ['Мы используем ваши персональные данные для следующих целей и на следующих правовых основаниях согласно PDPA:'],
        bullets: [
          'Для подготовки, выполнения и доставки ваших заказов (исполнение договора)',
          'Для работы программы лояльности и привязки баллов к вашему номеру телефона (договор и/или ваше согласие)',
          'Для связи с вами по поводу заказа при необходимости (договор / законный интерес)',
          'Для улучшения меню, сервиса и сайта (законный интерес)',
          'Для выполнения налоговых, бухгалтерских и иных требований закона (юридическая обязанность)',
        ],
      },
      {
        id: 'sharing',
        heading: '5. Когда мы передаём ваши данные',
        paragraphs: ['Мы передаём персональные данные только при необходимости и никогда их не продаём. Мы можем передавать их:'],
        bullets: [
          'Партнёрам по доставке (например, Grab, LINE MAN или foodpanda) — имя, телефон и адрес — только для доставки оформленного вами заказа',
          'Платёжным сервисам — PromptPay и ваш банк проводят сам платёж',
          'Надёжным поставщикам услуг, которые размещают или поддерживают наши системы, с обязательством о конфиденциальности',
          'Государственным органам или правоохранительным органам, когда это требуется по закону',
        ],
      },
      {
        id: 'cookies',
        heading: '6. Файлы cookie и локальное хранилище',
        paragraphs: [
          'Наш сайт использует минимальное хранилище браузера — например, чтобы запомнить выбранный вами язык. Кассовая система для персонала использует сессионный cookie, чтобы сотрудники оставались в системе. Мы не используем рекламные или трекинговые cookie.',
        ],
      },
      {
        id: 'retention',
        heading: '7. Сколько мы храним ваши данные',
        paragraphs: [
          'Мы храним записи о заказах и баллах, пока активен ваш аккаунт лояльности, и в течение срока, установленного налоговым и бухгалтерским законодательством Таиланда (как правило, не менее пяти лет). После этого мы удаляем или обезличиваем их. Вы можете попросить удалить ваши данные раньше — см. «Ваши права» ниже.',
        ],
      },
      {
        id: 'security',
        heading: '8. Как мы защищаем ваши данные',
        paragraphs: [
          'Мы ограничиваем доступ только уполномоченным сотрудникам, защищаем кассовую систему PIN-кодом и храним данные в системах, которые контролируем. Ни один способ передачи или хранения не является абсолютно безопасным, но мы принимаем разумные технические и организационные меры для защиты ваших данных.',
        ],
      },
      {
        id: 'rights',
        heading: '9. Ваши права согласно PDPA',
        paragraphs: ['В соответствии с PDPA вы имеете право:'],
        bullets: [
          'Получить доступ к копии ваших персональных данных, которые у нас есть',
          'Исправить неточные или устаревшие данные',
          'Потребовать удаления ваших данных',
          'Ограничить обработку или возразить против неё',
          'Получить или передать ваши данные (переносимость данных)',
          'Отозвать согласие в любой момент, без влияния на прошлую обработку',
          'Подать жалобу в Комитет по защите персональных данных (PDPC)',
        ],
      },
      {
        id: 'children',
        heading: '10. Конфиденциальность детей',
        paragraphs: [
          'Наши услуги предназначены для широкой аудитории и не адресованы детям. Мы сознательно не собираем персональные данные ребёнка без согласия родителя или опекуна, если этого требует закон. Если вы считаете, что ребёнок предоставил нам свои данные, свяжитесь с нами, и мы их удалим.',
        ],
      },
      {
        id: 'transfers',
        heading: '11. Международная передача данных',
        paragraphs: [
          'Мы работаем в Таиланде. Если поставщик услуг обрабатывает персональные данные за пределами Таиланда, мы принимаем меры, чтобы обеспечить уровень защиты, соответствующий PDPA.',
        ],
      },
      {
        id: 'changes',
        heading: '12. Изменения в этой политике',
        paragraphs: [
          'Мы можем время от времени обновлять эту политику. Текущая версия и дата вступления в силу всегда указаны на этой странице. Существенные изменения будут выделяться при необходимости.',
        ],
      },
      {
        id: 'contact',
        heading: '13. Свяжитесь с нами',
        paragraphs: ['По любым вопросам конфиденциальности или для реализации ваших прав, пожалуйста, свяжитесь с нами:'],
      },
    ],
  },
};
