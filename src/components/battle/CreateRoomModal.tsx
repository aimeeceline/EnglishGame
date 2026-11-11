"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, FileSpreadsheet, Layers, Clock, Zap, Loader2 } from "lucide-react";
import { getAllDecks } from "@/lib/firebase/decks";
import { createBattleRoom } from "@/lib/firebase/rooms";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { extractGoogleSheetInfo, getGoogleSheetCsvUrl, parseVocabCsv } from "@/lib/sheets/parser";
import { VocabDeck } from "@/types/vocab";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDeckId?: string;
}

export default function CreateRoomModal({ isOpen, onClose, initialDeckId }: CreateRoomModalProps) {
  const router = useRouter();
  const { user } = useUserIdentity();

  const [decks, setDecks] = useState<VocabDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [useGoogleSheet, setUseGoogleSheet] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetError, setSheetError] = useState("");
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);

  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const allDecks = await getAllDecks();
      setDecks(allDecks);
      if (initialDeckId && allDecks.some(d => d.id === initialDeckId)) {
        setSelectedDeckId(initialDeckId);
        setUseGoogleSheet(false);
      } else if (allDecks.length > 0) {
        setSelectedDeckId(allDecks[0].id);
        setUseGoogleSheet(false);
      } else {
        setUseGoogleSheet(true);
      }
    })();
  }, [isOpen, initialDeckId]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    setSheetError("");

    let deckTitle = decks.find(d => d.id === selectedDeckId)?.title || "Bộ Từ Vựng";
    let finalDeckId = selectedDeckId;

    // Nếu chọn nguồn từ Google Sheet
    if (useGoogleSheet) {
      if (!sheetUrl.trim()) {
        setSheetError("Vui lòng nhập đường liên kết Google Sheet!");
        setIsCreating(false);
        return;
      }

      const csvUrl = getGoogleSheetCsvUrl(sheetUrl);
      if (!csvUrl) {
        setSheetError("Link Google Sheet không hợp lệ! Hãy đảm bảo link có dạng: https://docs.google.com/spreadsheets/d/...");
        setIsCreating(false);
        return;
      }

      setIsFetchingSheet(true);
      try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error("Không thể tải file CSV từ Google Sheet. Hãy chắc chắn bạn đã bật quyền 'Bất kỳ ai có liên kết đều có thể xem'!");
        }
        const text = await response.text();
        const parsedItems = parseVocabCsv(text);

        if (parsedItems.length === 0) {
          throw new Error("Không tìm thấy từ vựng nào hợp lệ trong Sheet. Hãy kiểm tra các tiêu đề cột (Word, Meaning)!");
        }

        // Lưu tạm bộ thẻ Google Sheet vào localStorage
        finalDeckId = `deck_sheet_${Date.now()}`;
        deckTitle = `Google Sheet (${parsedItems.length} từ)`;
        const customDeck: VocabDeck = {
          id: finalDeckId,
          title: deckTitle,
          description: "Bộ từ vựng nhập trực tiếp từ Google Sheet",
          category: "Custom",
          cardCount: parsedItems.length,
          isDefault: false,
          sourceType: "google_sheet",
          googleSheetUrl: sheetUrl,
          createdAt: Date.now(),
          cards: parsedItems,
        };
        localStorage.setItem(`custom_deck_${finalDeckId}`, JSON.stringify(customDeck));
      } catch (err: unknown) {
        setSheetError((err as Error).message || "Lỗi đọc dữ liệu từ Google Sheet.");
        setIsCreating(false);
        setIsFetchingSheet(false);
        return;
      }
      setIsFetchingSheet(false);
    }

    try {
      const roomCode = await createBattleRoom(
        { uid: user.uid, displayName: user.displayName },
        {
          deckId: finalDeckId,
          deckTitle,
          totalQuestions,
          timePerQuestion,
          difficulty,
        }
      );

      router.push(`/battle/${roomCode}`);
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tạo Phòng Đấu 1v1</h2>
            <p className="text-xs text-slate-500">Chọn cấu hình trận đấu và mời bạn bè cùng so tài</p>
          </div>
        </div>

        {/* Deck Selection Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Nguồn Từ Vựng Để AI Sinh Đề
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setUseGoogleSheet(false)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                !useGoogleSheet
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Bộ Từ Có Sẵn
            </button>
            <button
              type="button"
              onClick={() => setUseGoogleSheet(true)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                useGoogleSheet
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Dán Google Sheet
            </button>
          </div>
        </div>

        {/* Deck Content */}
        {!useGoogleSheet ? (
          <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
            {decks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                <p className="mb-2">Chưa có bộ từ vựng nào trong kho.</p>
                <button
                  type="button"
                  onClick={() => setUseGoogleSheet(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                >
                  Dán Link Google Sheet Ngay
                </button>
              </div>
            ) : (
              decks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedDeckId === deck.id
                      ? "border-blue-500 bg-blue-50/70 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">{deck.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {deck.cards.length} từ
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{deck.description}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Đường dẫn Google Sheet (Chế độ xem công khai):
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                💡 Cần mở Sheet $\to$ <span className="text-emerald-600 font-semibold">Chia sẻ</span> $\to$ Chọn <span className="text-slate-700 font-medium">"Bất kỳ ai có đường liên kết đều có thể xem"</span>.
              </p>
            </div>
            {sheetError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                ⚠️ {sheetError}
              </p>
            )}
          </div>
        )}

        {/* Match Settings: Questions, Time, Difficulty */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Số Lượng Câu Hỏi
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalQuestions(count)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                    totalQuestions === count
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {count} câu
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Thời Gian Mỗi Câu
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 15, 20].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimePerQuestion(sec)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                    timePerQuestion === sec
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Độ Khó Câu Hỏi AI
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'easy', label: 'Cơ bản (A2-B1)' },
              { id: 'medium', label: 'Tiêu chuẩn (B2)' },
              { id: 'hard', label: 'Thử thách (C1)' },
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setDifficulty(diff.id as 'easy' | 'medium' | 'hard')}
                className={`py-2 px-1 rounded-lg text-xs font-semibold border text-center transition ${
                  difficulty === diff.id
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCreate}
          disabled={isCreating || isFetchingSheet}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang Tạo Phòng & Mã PIN...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Khởi Tạo Phòng Đấu 1v1
            </>
          )}
        </button>

      </div>
    </div>
  );
}

