"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import CreateDeckModal from "@/components/flashcard/CreateDeckModal";
import { VocabDeck } from "@/types/vocab";
import { getAllDecks, saveDeckToFirebase } from "@/lib/firebase/decks";
import { 
  BookOpen, 
  FileSpreadsheet, 
  Swords, 
  Plus, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Layers
} from "lucide-react";

export default function DecksPage() {
  const [decks, setDecks] = useState<VocabDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetTitle, setSheetTitle] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedDeckForBattle, setSelectedDeckForBattle] = useState<string | null>(null);

  const fetchDecks = async () => {
    setLoading(true);
    const all = await getAllDecks();
    setDecks(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleImportSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    setIsParsing(true);
    try {
      // Gọi Server API route (Không bị lỗi CORS trình duyệt)
      const res = await fetch("/api/sheets/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải từ Google Sheet.");
      }

      const newDeckId = `deck_sheet_${Date.now()}`;
      const newDeck: VocabDeck = {
        id: newDeckId,
        title: sheetTitle.trim() || `Google Sheet (${data.cardCount} từ)`,
        description: `Bộ từ vựng nhập trực tiếp từ Google Sheet (${data.cardCount} từ)`,
        category: "Custom",
        cardCount: data.cardCount,
        isDefault: false,
        sourceType: "google_sheet",
        googleSheetUrl: sheetUrl,
        createdAt: Date.now(),
        cards: data.cards,
      };

      // Lưu lên Firebase Realtime Database
      await saveDeckToFirebase(newDeck);
      setDecks(prev => [...prev, newDeck]);
      setIsImportModalOpen(false);
      setSheetUrl("");
      setSheetTitle("");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Lỗi nhập dữ liệu Google Sheet.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Tích Hợp Google Sheet & Thẻ Từ Vựng
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Kho Bộ Thẻ Từ Vựng
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Học Flashcard 3D có phát âm hoặc chọn bộ từ để thách đấu 1v1
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateDeckOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              Tạo Bộ Thẻ Mới
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Nhập Từ Google Sheet
            </button>
          </div>
        </div>

        {/* Decks Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm font-semibold">
            Đang tải danh sách bộ thẻ...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      deck.sourceType === "google_sheet"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    }`}>
                      {deck.sourceType === "google_sheet" ? "Google Sheet" : deck.category}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {deck.cards.length} thẻ
                    </span>
                  </div>

                  <Link href={`/decks/${deck.id}`} className="group">
                    <h3 className="font-bold text-lg text-white mb-1.5 group-hover:text-indigo-400 transition">
                      {deck.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {deck.description}
                  </p>

                  {/* Sample Words Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {deck.cards.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {c.word}
                      </span>
                    ))}
                    {deck.cards.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                        +{deck.cards.length - 4} từ nữa
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
                  <Link
                    href={`/decks/${deck.id}/study`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Luyện Flashcard
                  </Link>

                  <button
                    onClick={() => setSelectedDeckForBattle(deck.id)}
                    className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                    title="Tạo phòng thi đấu 1v1 bằng bộ từ vựng này"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Đấu 1v1
                  </button>

                  <Link
                    href={`/decks/${deck.id}`}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Xem chi tiết danh sách từ"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Import Google Sheet Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-900/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Nhập Từ Vựng Từ Google Sheet
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Dán đường link bảng tính Google Sheet để tự động chuyển thành bộ Flashcard và đề thi đấu AI.
            </p>

            <form onSubmit={handleImportSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Bộ Thẻ (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="VD: Từ Vựng Unit 5 Lớp 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Đường Dẫn Google Sheet:
                </label>
                <input
                  type="url"
                  required
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="text-emerald-400 font-semibold">📌 Lưu ý thiết lập bảng tính:</p>
                <p>1. Mở file Sheet $\to$ <strong className="text-slate-200">Chia sẻ</strong> $\to$ Chọn <strong className="text-slate-200">"Bất kỳ ai có đường liên kết đều có thể xem"</strong>.</p>
                <p>2. Dòng 1 chứa tiêu đề cột: <code className="text-pink-400">Word</code> (hoặc Từ), <code className="text-pink-400">Meaning</code> (hoặc Nghĩa).</p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isParsing || !sheetUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang Đọc Sheet...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Nhập Vào Kho
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Deck Modal */}
      <CreateDeckModal
        isOpen={isCreateDeckOpen}
        onClose={() => setIsCreateDeckOpen(false)}
        onDeckCreated={(newDeck) => setDecks(prev => [...prev, newDeck])}
      />

      {/* Battle Create Modal */}
      {selectedDeckForBattle && (
        <CreateRoomModal
          isOpen={Boolean(selectedDeckForBattle)}
          onClose={() => setSelectedDeckForBattle(null)}
        />
      )}

    </div>
  );
}
