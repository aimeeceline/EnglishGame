"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, FileSpreadsheet, Layers, Clock, Zap, Loader2 } from "lucide-react";
import { DEFAULT_DECKS } from "@/lib/mockData";
import { createBattleRoom } from "@/lib/firebase/rooms";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { extractGoogleSheetInfo, getGoogleSheetCsvUrl, parseVocabCsv } from "@/lib/sheets/parser";
import { VocabDeck } from "@/types/vocab";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { user } = useUserIdentity();

  const [selectedDeckId, setSelectedDeckId] = useState<string>(DEFAULT_DECKS[0].id);
  const [useGoogleSheet, setUseGoogleSheet] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetError, setSheetError] = useState("");
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);

  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    setSheetError("");

    let deckTitle = DEFAULT_DECKS.find(d => d.id === selectedDeckId)?.title || "Bộ Từ Vựng";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-900/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tạo Phòng Đấu 1v1</h2>
            <p className="text-xs text-slate-400">Chọn cấu hình trận đấu và mời bạn bè cùng so tài</p>
          </div>
        </div>

        {/* Deck Selection Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Nguồn Từ Vựng Để AI Sinh Đề
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setUseGoogleSheet(false)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                !useGoogleSheet
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
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
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Dán Google Sheet
            </button>
          </div>
        </div>

        {/* Deck Content */}
        {!useGoogleSheet ? (
          <div className="space-y-2 mb-4">
            {DEFAULT_DECKS.map((deck) => (
              <div
                key={deck.id}
                onClick={() => setSelectedDeckId(deck.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedDeckId === deck.id
                    ? "border-indigo-500 bg-indigo-950/40"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{deck.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                    {deck.cards.length} từ
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{deck.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Đường dẫn Google Sheet (Chế độ xem công khai):
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                💡 Cần mở Sheet $\to$ <span className="text-emerald-400 font-semibold">Chia sẻ</span> $\to$ Chọn <span className="text-slate-200">"Bất kỳ ai có đường liên kết đều có thể xem"</span>.
              </p>
            </div>
            {sheetError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
                ⚠️ {sheetError}
              </p>
            )}
          </div>
        )}

        {/* Match Settings: Questions, Time, Difficulty */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
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
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {count} câu
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
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
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
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
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                    ? "bg-purple-600/30 border-purple-500 text-purple-200"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
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

