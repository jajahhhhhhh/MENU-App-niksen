import { Lang } from './i18n';

/**
 * The journal — the owner's own writing, not marketing copy.
 *
 * Thai is the authored version; English and Russian are translations of it.
 * Keep them plain. The value of these entries is that they sound like a person
 * rather than a brand, so resist tidying the phrasing into something smoother.
 */
export interface JournalPost {
  slug: string;
  /** ISO date — rendered per locale at display time. */
  date: string;
  title: string;
  body: string[];
}

export interface JournalContent {
  pageTitle: string;
  metaTitle: string;
  kicker: string;
  intro: string;
  home: string;
  order: string;
  posts: JournalPost[];
}

export const JOURNAL: Record<Lang, JournalContent> = {
  en: {
    pageTitle: 'Journal',
    metaTitle: 'Journal · niksen secret bar — Bophut, Koh Samui',
    kicker: 'Journal',
    intro: 'Notes from before we open, and from after.',
    home: 'Home',
    order: 'Order online',
    posts: [
      {
        slug: 'at-least-we-have-started',
        date: '2026-08-10',
        title: 'At least we have started',
        body: [
          'If you ask what I want this place to be, I still think the same as I always have.',
          'I want it to be a place where you can sit and rest. Put things down. Let your mind go, let yourself go. Let yourself stop for a while — let yourself stop being tired.',
          'If you ask whether this place is finished, for me it is not. Not for a lot of reasons.',
          'But I feel that at least we have started. It is a small thing. But at least we have done it. At least a small piece of who we are is out in the world now.',
        ],
      },
    ],
  },

  th: {
    pageTitle: 'บันทึก',
    metaTitle: 'บันทึก · niksen secret bar — บ่อผุด เกาะสมุย',
    kicker: 'บันทึก',
    intro: 'บันทึกจากช่วงก่อนเปิดร้าน และหลังจากนั้น',
    home: 'หน้าแรก',
    order: 'สั่งออนไลน์',
    posts: [
      {
        slug: 'at-least-we-have-started',
        date: '2026-08-10',
        title: 'อย่างน้อยก็ได้เริ่มแล้ว',
        body: [
          'ถ้าถามว่าอยากให้สถานที่นี้เป็นอะไร เรายังคงคิดเหมือนเดิม',
          'เราอยากให้ที่นี่เป็นที่ที่ได้นั่งพัก ปล่อยวาง ปล่อยใจ ปล่อยตัว ให้ตัวเองยอมพัก ยอมหายเหนื่อยบ้าง',
          'ถ้าถามว่าสถานที่นี้คอมพลีทหรือยัง สำหรับเรามันยัง ด้วยอะไรหลาย ๆ อย่าง',
          'แต่เราก็รู้สึกว่า อย่างน้อยเราก็ได้เริ่มแล้ว แม้จะเล็กน้อย แต่อย่างน้อยก็ได้ทำแล้ว ได้ปล่อย ได้แบ่งปันความเป็นตัวเราเล็ก ๆ ออกไปแล้ว',
        ],
      },
    ],
  },

  ru: {
    pageTitle: 'Дневник',
    metaTitle: 'Дневник · niksen secret bar — Бопхут, Самуи',
    kicker: 'Дневник',
    intro: 'Записи до открытия — и после.',
    home: 'На главную',
    order: 'Заказать онлайн',
    posts: [
      {
        slug: 'at-least-we-have-started',
        date: '2026-08-10',
        title: 'По крайней мере, мы начали',
        body: [
          'Если спросить, каким я хочу видеть это место, — я думаю так же, как и раньше.',
          'Я хочу, чтобы здесь можно было просто посидеть и отдохнуть. Отпустить. Отпустить мысли, отпустить себя. Позволить себе остановиться — позволить себе перестать уставать хотя бы ненадолго.',
          'Если спросить, готово ли это место, — для меня нет. По многим причинам.',
          'Но я чувствую, что мы хотя бы начали. Это малое. Но мы это сделали. И маленькая часть нас теперь есть в этом мире.',
        ],
      },
    ],
  },
};
