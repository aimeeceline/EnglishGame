export interface FlashcardItem {
  id: string;
  word: string;               // Ví dụ: "Negotiate"
  phonetic?: string;          // Ví dụ: "/nəˈɡoʊ.ʃi.eɪt/"
  partOfSpeech?: string;      // "verb" | "noun" | "adj" | "adv"
  meaning: string;            // "thương lượng, đàm phán"
  exampleSentence?: string;   // "They are trying to negotiate a new contract."
  exampleTranslation?: string;// "Họ đang cố gắng thương lượng một hợp đồng mới."
  audioUrl?: string;
}

export interface VocabDeck {
  id: string;
  title: string;              // "300 Từ Vựng Giao Tiếp Công Sở"
  description: string;
  category: 'General' | 'TOEIC' | 'IELTS' | 'Business' | 'Communication' | 'Custom';
  cardCount: number;
  isDefault: boolean;         // true: Bộ từ mẫu hệ thống cung cấp sẵn
  creatorId?: string;
  createdAt: number;
  sourceType: 'manual' | 'google_sheet' | 'csv';
  googleSheetUrl?: string;
  lastSyncedAt?: number;
  cards: FlashcardItem[];
}

