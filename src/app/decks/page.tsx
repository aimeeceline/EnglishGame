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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2 shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Tích Hợp Google Sheet & Thẻ Từ Vựng
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Kho Bộ Thẻ Từ Vựng
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Học Flashcard 3D có phát âm hoặc chọn bộ từ để thách đấu 1v1
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateDeckOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs transition"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              Tạo Bộ Thẻ Mới
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Nhập Từ Google Sheet
            </button>
          </div>
        </div>

        {/* Decks Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm font-semibold">
            Đang tải danh sách bộ thẻ...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 flex flex-col justify-between transition shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      deck.sourceType === "google_sheet"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {deck.sourceType === "google_sheet" ? "Google Sheet" : deck.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {deck.cards.length} thẻ
                    </span>
                  </div>

                  <Link href={`/decks/${deck.id}`} className="group">
                    <h3 className="font-bold text-lg text-slate-900 mb-1.5 group-hover:text-blue-600 transition">
                      {deck.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {deck.description}
                  </p>

                  {/* Sample Words Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {deck.cards.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
                      >
                        {c.word}
                      </span>
                    ))}
                    {deck.cards.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                        +{deck.cards.length - 4} từ nữa
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/decks/${deck.id}/study`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Luyện Flashcard
                  </Link>

                  <button
                    onClick={() => setSelectedDeckForBattle(deck.id)}
                    className="py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                    title="Tạo phòng thi đấu 1v1 bằng bộ từ vựng này"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Đấu 1v1
                  </button>

                  <Link
                    href={`/decks/${deck.id}`}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Nhập Từ Vựng Từ Google Sheet
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Dán đường link bảng tính Google Sheet để tự động chuyển thành bộ Flashcard và đề thi đấu AI.
            </p>

            <form onSubmit={handleImportSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Bộ Thẻ (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="VD: Từ Vựng Unit 5 Lớp 10"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đường Dẫn Google Sheet:
                </label>
                <input
                  type="url"
                  required
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-slate-600 space-y-1">
                <p className="text-emerald-800 font-bold">📌 Lưu ý thiết lập bảng tính:</p>
                <p>1. Mở file Sheet $\to$ <strong className="text-slate-800">Chia sẻ</strong> $\to$ Chọn <strong className="text-slate-800">"Bất kỳ ai có đường liên kết đều có thể xem"</strong>.</p>
                <p>2. Dòng 1 chứa tiêu đề cột: <code className="text-blue-600 font-bold">Word</code> (hoặc Từ), <code className="text-emerald-600 font-bold">Meaning</code> (hoặc Nghĩa).</p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isParsing || !sheetUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 transition disabled:opacity-50"
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
