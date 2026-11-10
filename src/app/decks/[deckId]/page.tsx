"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import AddCardModal from "@/components/flashcard/AddCardModal";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import { VocabDeck, FlashcardItem } from "@/types/vocab";
import { getDeckById, addCardToDeck, deleteCardFromDeck, deleteDeck, syncGoogleSheetDeck } from "@/lib/firebase/decks";
import { 
  ArrowLeft, 
  BookOpen, 
  Swords, 
  Plus, 
  Trash2, 
  Volume2, 
  Sparkles,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Loader2
} from "lucide-react";

export default function DeckDetailPage({
  params,
}: {
  params: { deckId: string };
}) {
  const router = useRouter();
  const deckId = params.deckId;

  const [deck, setDeck] = useState<VocabDeck | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isBattleOpen, setIsBattleOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDeck = async () => {
    setLoading(true);
    const d = await getDeckById(deckId);
    setDeck(d);
    setLoading(false);

    // Tự động kiểm tra và cập nhật từ vựng mới từ Google Sheet nếu có
    if (d && d.sourceType === "google_sheet" && d.googleSheetUrl) {
      setIsSyncing(true);
      const synced = await syncGoogleSheetDeck(deckId);
      if (synced) {
        setDeck(synced);
      }
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!deck || !deck.googleSheetUrl) return;
    setIsSyncing(true);
    const synced = await syncGoogleSheetDeck(deckId);
    if (synced) {
      setDeck(synced);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  const handleAddCard = async (newCard: FlashcardItem) => {
    const updated = await addCardToDeck(deckId, newCard);
    if (updated) {
      setDeck(updated);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm("Bạn có chắc muốn xóa từ vựng này khỏi bộ thẻ?")) {
      const updated = await deleteCardFromDeck(deckId, cardId);
      if (updated) {
        setDeck(updated);
      }
    }
  };

  const handleDeleteEntireDeck = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ bộ thẻ này không?")) {
      await deleteDeck(deckId);
      router.push("/decks");
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-sm font-semibold">
          Đang tải thông tin bộ thẻ...
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-sm font-semibold text-slate-400 mb-4">
            Không tìm thấy bộ từ vựng này.
          </p>
          <Link
            href="/decks"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Quay lại Kho Thẻ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        {/* Top Back Navigation */}
        <Link
          href="/decks"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Kho Thẻ
        </Link>

        {/* Deck Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                deck.sourceType === "google_sheet"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
              }`}>
                {deck.sourceType === "google_sheet" ? "Google Sheet" : deck.category}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {deck.cards.length} thẻ từ vựng
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white">{deck.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              {deck.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <Link
              href={`/decks/${deck.id}/study`}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <BookOpen className="w-4 h-4" />
              Luyện Thẻ 3D Flashcard
            </Link>

            <button
              onClick={() => setIsBattleOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
            >
              <Swords className="w-4 h-4" />
              Đấu 1v1 Bộ Này
            </button>

            <button
              onClick={() => setIsAddCardOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Thêm Từ Vựng Mới
            </button>

            {deck.sourceType === "google_sheet" && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-900/50 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Đang Cập Nhật..." : "Cập Nhật Từ Sheet"}
              </button>
            )}

            {!deck.isDefault && (
              <button
                onClick={handleDeleteEntireDeck}
                className="py-2 px-3 text-slate-500 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa Bộ Thẻ Này
              </button>
            )}
          </div>
        </div>

        {/* Word Cards List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Danh Sách Từ Vựng ({deck.cards.length})
            </h2>
          </div>

          {deck.cards.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-sm font-semibold mb-3">
                Bộ thẻ này chưa có từ vựng nào!
              </p>
              <button
                onClick={() => setIsAddCardOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                Thêm Từ Vựng Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {deck.cards.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Word, POS, Audio, Delete */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">{card.word}</span>
                        {card.partOfSpeech && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {card.partOfSpeech}
                          </span>
                        )}
                        <button
                          onClick={() => handleSpeak(card.word)}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {!deck.isDefault && (
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Xóa từ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Phonetic */}
                    {card.phonetic && (
                      <p className="text-xs font-mono text-indigo-400 mb-2">{card.phonetic}</p>
                    )}

                    {/* Meaning */}
                    <p className="text-sm font-bold text-slate-200 mb-2">
                      👉 {card.meaning}
                    </p>

                    {/* Example */}
                    {card.exampleSentence && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-0.5">
                        <p className="font-medium text-slate-200">"{card.exampleSentence}"</p>
                        {card.exampleTranslation && (
                          <p className="text-slate-400 italic">$\rightarrow$ {card.exampleTranslation}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modals */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
      />

      <CreateRoomModal
        isOpen={isBattleOpen}
        onClose={() => setIsBattleOpen(false)}
      />
    </div>
  );
}

