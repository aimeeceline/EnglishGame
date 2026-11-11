"use client";

import { useState } from "react";
import { X, Layers, Plus, Loader2 } from "lucide-react";
import { VocabDeck } from "@/types/vocab";
import { saveDeckToFirebase } from "@/lib/firebase/decks";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated: (deck: VocabDeck) => void;
}

export default function CreateDeckModal({
  isOpen,
  onClose,
  onDeckCreated,
}: CreateDeckModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<VocabDeck["category"]>("General");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const newDeckId = `deck_custom_${Date.now()}`;
    const newDeck: VocabDeck = {
      id: newDeckId,
      title: title.trim(),
      description: description.trim() || "Bộ từ vựng tự tạo",
      category,
      cardCount: 0,
      isDefault: false,
      sourceType: "manual",
      createdAt: Date.now(),
      cards: [],
    };

    try {
      await saveDeckToFirebase(newDeck);
      onDeckCreated(newDeck);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tạo Bộ Thẻ Mới</h2>
            <p className="text-xs text-slate-500">Tự soạn danh sách từ vựng theo ý muốn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Bộ Thẻ: *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: 50 Động Từ Bất Quy Tắc Hay Gặp"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô Tả:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về mục tiêu của bộ thẻ này..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chủ Đề (Danh mục):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["General", "TOEIC", "IELTS", "Communication", "Business", "Custom"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition ${
                    category === cat
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !title.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang Lưu...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Tạo Bộ Thẻ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

