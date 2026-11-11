"use client";

import { useState } from "react";
import { X, Plus, Volume2, Loader2, Sparkles } from "lucide-react";
import { FlashcardItem } from "@/types/vocab";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: FlashcardItem) => Promise<void>;
}

export default function AddCardModal({
  isOpen,
  onClose,
  onAddCard,
}: AddCardModalProps) {
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("noun");
  const [meaning, setMeaning] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSpeak = () => {
    if (!word.trim()) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;

    setIsSaving(true);
    const newCard: FlashcardItem = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      word: word.trim(),
      phonetic: phonetic.trim() || undefined,
      partOfSpeech: partOfSpeech.trim() || undefined,
      meaning: meaning.trim(),
      exampleSentence: exampleSentence.trim() || undefined,
      exampleTranslation: exampleTranslation.trim() || undefined,
    };

    try {
      await onAddCard(newCard);
      onClose();
      // Reset form
      setWord("");
      setPhonetic("");
      setMeaning("");
      setExampleSentence("");
      setExampleTranslation("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Thêm Từ Vựng Mới</h2>
            <p className="text-xs text-slate-500">Bổ sung từ mới vào bộ thẻ để học và thi đấu 1v1</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Word & Audio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Từ Tiếng Anh: *
              </label>
              {word.trim() && (
                <button
                  type="button"
                  onClick={handleSpeak}
                  className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Nghe thử
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="VD: Perseverance"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-bold"
              autoFocus
            />
          </div>

          {/* Phonetic & Part of speech */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phiên Âm (IPA):
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="VD: /ˌpɜː.sɪˈvɪə.rəns/"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Từ Loại:
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="noun">Danh từ (noun)</option>
                <option value="verb">Động từ (verb)</option>
                <option value="adjective">Tính từ (adj)</option>
                <option value="adverb">Trạng từ (adv)</option>
                <option value="phrase">Cụm từ (phrase)</option>
              </select>
            </div>
          </div>

          {/* Vietnamese Meaning */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nghĩa Tiếng Việt: *
            </label>
            <input
              type="text"
              required
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="VD: Sự kiên trì, bền chí"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Example Sentence & Translation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Câu Ví Dụ Ngữ Cảnh:
            </label>
            <input
              type="text"
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="VD: Through perseverance, she reached her dreams."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dịch Nghĩa Câu Ví Dụ:
            </label>
            <input
              type="text"
              value={exampleTranslation}
              onChange={(e) => setExampleTranslation(e.target.value)}
              placeholder="VD: Bằng sự kiên trì, cô ấy đã chạm tới ước mơ của mình."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || !word.trim() || !meaning.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4 active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang Thêm...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Thêm Từ Này Vào Bộ Thẻ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

