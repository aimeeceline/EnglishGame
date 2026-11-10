import { ref, set, get, remove } from "firebase/database";
import { rtdb } from "./config";
import { VocabDeck, FlashcardItem } from "@/types/vocab";
import { DEFAULT_DECKS } from "@/lib/mockData";

/**
 * Lưu bộ thẻ từ vựng lên Firebase Realtime Database
 */
export async function saveDeckToFirebase(deck: VocabDeck): Promise<void> {
  try {
    const deckRef = ref(rtdb, `decks/${deck.id}`);
    await set(deckRef, deck);
  } catch (err) {
    console.warn("Lỗi lưu deck lên Firebase, fallback localStorage:", err);
  }

  // Luôn backup vào localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(`custom_deck_${deck.id}`, JSON.stringify(deck));
  }
}

/**
 * Lấy toàn bộ danh sách bộ thẻ từ Firebase Realtime Database kết hợp Default Decks
 */
export async function getAllDecks(): Promise<VocabDeck[]> {
  const decksMap = new Map<string, VocabDeck>();

  // 1. Nạp Default Decks
  DEFAULT_DECKS.forEach(d => decksMap.set(d.id, d));

  // 2. Nạp từ localStorage
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("custom_deck_")) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "");
          if (item && item.id) {
            decksMap.set(item.id, item);
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  // 3. Nạp từ Firebase Realtime Database
  try {
    const decksRef = ref(rtdb, "decks");
    const snap = await get(decksRef);
    if (snap.exists()) {
      const liveDecks = snap.val() as Record<string, VocabDeck>;
      Object.values(liveDecks).forEach(deck => {
        if (deck && deck.id) {
          decksMap.set(deck.id, deck);
        }
      });
    }
  } catch (err) {
    console.warn("Lỗi lấy danh sách decks từ Firebase:", err);
  }

  return Array.from(decksMap.values());
}

/**
 * Lấy chi tiết 1 bộ thẻ theo ID
 */
export async function getDeckById(deckId: string): Promise<VocabDeck | null> {
  // Tìm trong default
  const defaultDeck = DEFAULT_DECKS.find(d => d.id === deckId);
  if (defaultDeck) return defaultDeck;

  // Tìm trong Firebase
  try {
    const deckRef = ref(rtdb, `decks/${deckId}`);
    const snap = await get(deckRef);
    if (snap.exists()) {
      return snap.val() as VocabDeck;
    }
  } catch (err) {
    console.warn("Lỗi đọc deck từ Firebase:", err);
  }

  // Tìm trong localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`custom_deck_${deckId}`);
    if (stored) {
      try {
        return JSON.parse(stored) as VocabDeck;
      } catch (e) {
        console.warn(e);
      }
    }
  }

  return null;
}

/**
 * Xóa một bộ thẻ tùy chỉnh
 */
export async function deleteDeck(deckId: string): Promise<void> {
  try {
    const deckRef = ref(rtdb, `decks/${deckId}`);
    await remove(deckRef);
  } catch (e) {
    console.warn(e);
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(`custom_deck_${deckId}`);
  }
}

/**
 * Thêm một thẻ từ vựng mới vào bộ thẻ
 */
export async function addCardToDeck(deckId: string, card: FlashcardItem): Promise<VocabDeck | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;

  // Tránh trùng ID
  const newCard = { ...card, id: card.id || `card_${Date.now()}` };
  const updatedCards = [...deck.cards, newCard];

  const updatedDeck: VocabDeck = {
    ...deck,
    cards: updatedCards,
    cardCount: updatedCards.length,
  };

  await saveDeckToFirebase(updatedDeck);
  return updatedDeck;
}

/**
 * Xóa một thẻ từ vựng khỏi bộ thẻ
 */
export async function deleteCardFromDeck(deckId: string, cardId: string): Promise<VocabDeck | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;

  const updatedCards = deck.cards.filter(c => c.id !== cardId);
  const updatedDeck: VocabDeck = {
    ...deck,
    cards: updatedCards,
    cardCount: updatedCards.length,
  };

  await saveDeckToFirebase(updatedDeck);
  return updatedDeck;
}


/**
 * Tự động đồng bộ / cập nhật lại từ vựng mới nhất từ link Google Sheet
 */
export async function syncGoogleSheetDeck(deckId: string): Promise<VocabDeck | null> {
  const deck = await getDeckById(deckId);
  if (!deck || !deck.googleSheetUrl) return null;

  try {
    const res = await fetch("/api/sheets/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl: deck.googleSheetUrl }),
    });

    if (!res.ok) {
      console.warn("Đồng bộ Google Sheet thất bại");
      return deck;
    }

    const data = await res.json();
    if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
      const updatedDeck: VocabDeck = {
        ...deck,
        cards: data.cards,
        cardCount: data.cards.length,
        lastSyncedAt: Date.now(),
      };

      await saveDeckToFirebase(updatedDeck);
      return updatedDeck;
    }
  } catch (err) {
    console.error("Lỗi đồng bộ Google Sheet:", err);
  }

  return deck;
}

/**
 * Lưu các từ vựng cần ôn lại từ trận đấu vào bộ Flashcard "Sổ Tay Ôn Tập"
 */
export async function addCardsToReviewDeck(newCards: { word: string; meaning: string; example?: string }[]): Promise<string> {
  const reviewDeckId = "review_mistakes_deck";
  let reviewDeck = await getDeckById(reviewDeckId);

  const formattedCards: FlashcardItem[] = newCards.map((c, i) => ({
    id: `card_${Date.now()}_${i}`,
    word: c.word,
    meaning: c.meaning,
    exampleSentence: c.example || "",
  }));

  if (!reviewDeck) {
    reviewDeck = {
      id: reviewDeckId,
      title: "Sổ Tay Từ Vựng Cần Ôn Lại",
      description: "Tập hợp các từ vựng cần củng cố được lưu từ các trận đấu 1v1",
      category: "Custom",
      cardCount: formattedCards.length,
      cards: formattedCards,
      isDefault: false,
      sourceType: "manual",
      createdAt: Date.now(),
    };
  } else {
    // Tránh trùng lặp từ vựng
    const existingWords = new Set(reviewDeck.cards.map(c => c.word.toLowerCase()));
    const uniqueNew = formattedCards.filter(c => !existingWords.has(c.word.toLowerCase()));
    reviewDeck = {
      ...reviewDeck,
      cards: [...uniqueNew, ...reviewDeck.cards],
      cardCount: uniqueNew.length + reviewDeck.cards.length,
    };
  }

  await saveDeckToFirebase(reviewDeck);
  return reviewDeckId;
}

