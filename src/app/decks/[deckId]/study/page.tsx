"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import { VocabDeck, FlashcardItem } from "@/types/vocab";
import { getDeckById } from "@/lib/firebase/decks";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  RotateCw, 
  Swords, 
  BookOpen, 
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy
} from "lucide-react";

export default function StudyFlashcardPage({
  params,
}: {
  params: { deckId: string };
}) {
  const deckId = params.deckId;

  const [deck, setDeck] = useState<VocabDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);

  // Thống kê phiên học
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [needsReviewIds, setNeedsReviewIds] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  // Nạp dữ liệu bộ thẻ
  useEffect(() => {
    (async () => {
      const d = await getDeckById(deckId);
      setDeck(d);
    })();
  }, [deckId]);

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "1") {
        handleMarkReview();
      } else if (e.key === "2") {
        handleMarkMastered();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck, currentIndex]);

  if (!deck || deck.cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-sm font-semibold text-slate-500 mb-4">
            Đang tải dữ liệu bộ thẻ hoặc bộ thẻ chưa có từ vựng...
          </p>
          <Link
            href="/decks"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20"
          >
            Quay lại Kho Thẻ
          </Link>
        </div>
      </div>
    );
  }

  const currentCard: FlashcardItem = deck.cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex + 1 >= deck.cards.length) {
      setIsFinished(true);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  // Đánh dấu "Đã thuộc"
  const handleMarkMastered = () => {
    if (!currentCard) return;
    setMasteredIds(prev => new Set(prev).add(currentCard.id));
    setNeedsReviewIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  // Đánh dấu "Cần ôn lại"
  const handleMarkReview = () => {
    if (!currentCard) return;
    setNeedsReviewIds(prev => new Set(prev).add(currentCard.id));
    handleNext();
  };

  // Khởi động lại lượt học
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setMasteredIds(new Set());
    setNeedsReviewIds(new Set());
  };

  // Phát âm chuẩn Web Speech API
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 w-full flex-1 flex flex-col items-center justify-between">
        
        {/* Top Header & Progress */}
        <div className="w-full flex items-center justify-between mb-4">
          <Link
            href={`/decks/${deck.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Chi Tiết Bộ Từ
          </Link>

          {/* Quick Mastery Counters */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {masteredIds.size} thuộc
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {needsReviewIds.size} cần ôn
            </span>
          </div>

          <button
            onClick={() => setIsBattleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-600 hover:text-white transition"
          >
            <Swords className="w-3.5 h-3.5" />
            Đấu 1v1 Bộ Này
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / deck.cards.length) * 100}%` }}
          />
        </div>

        {/* Finished Screen OR Active Card */}
        {isFinished ? (
          <div className="w-full max-w-lg p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl my-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mx-auto mb-4">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Hoàn Thành Phiên Luyện Thẻ! 🎉
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Bạn đã duyệt qua toàn bộ {deck.cards.length} từ vựng trong bộ <span className="text-blue-600 font-semibold font-mono">"{deck.title}"</span>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-2xl font-black text-emerald-600 font-mono">{masteredIds.size}</span>
                <span className="block text-xs text-slate-700 font-bold mt-1">Từ Đã Thuộc</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-2xl font-black text-rose-600 font-mono">{needsReviewIds.size}</span>
                <span className="block text-xs text-slate-700 font-bold mt-1">Từ Cần Ôn Lại</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Ôn Luyện Lại
              </button>
              <button
                onClick={() => setIsBattleModalOpen(true)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-95"
              >
                <Swords className="w-4 h-4" />
                Thách Đấu 1v1 Ngay
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 3D Flip Flashcard */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="perspective-1000 w-full max-w-lg aspect-[4/3] sm:aspect-[16/11] cursor-pointer my-auto"
            >
              <div
                className={`preserve-3d relative w-full h-full rounded-3xl transition-transform duration-500 shadow-xl ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                
                {/* Front of Card */}
                <div className="backface-hidden absolute inset-0 bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {currentCard.partOfSpeech || "Vocabulary"}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                      <RotateCw className="w-3.5 h-3.5 text-blue-600" /> Bấm hoặc Space để lật
                    </span>
                  </div>

                  <div className="text-center my-auto">
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
                      {currentCard.word}
                    </h2>
                    {currentCard.phonetic && (
                      <p className="text-sm sm:text-base font-mono text-blue-600 font-semibold">
                        {currentCard.phonetic}
                      </p>
                    )}

                    <button
                      onClick={handleSpeak}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 transition shadow-xs active:scale-95"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      Nghe Phát Âm
                    </button>
                  </div>

                  <div className="text-center text-[11px] text-slate-400 font-medium">
                    Thẻ {currentIndex + 1} / {deck.cards.length}
                  </div>
                </div>

                {/* Back of Card */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 bg-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Định Nghĩa & Ngữ Cảnh
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-600" /> Bấm để lật lại
                    </span>
                  </div>

                  <div className="text-center my-auto space-y-4">
                    <div>
                      <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                        Nghĩa Tiếng Việt
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                        {currentCard.meaning}
                      </h3>
                    </div>

                    {currentCard.exampleSentence && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">
                          "{currentCard.exampleSentence}"
                        </p>
                        {currentCard.exampleTranslation && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            → {currentCard.exampleTranslation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[11px] text-slate-400 font-medium">
                    Mặt sau thẻ từ vựng
                  </div>
                </div>

              </div>
            </div>

            {/* Assessment & Navigation Controls */}
            <div className="w-full flex items-center justify-center gap-3 mt-8">
              <button
                onClick={handleMarkReview}
                className="flex-1 max-w-[160px] py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
                title="Phím tắt: 1"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                Cần Ôn (1)
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition active:scale-95"
              >
                <RotateCw className="w-4 h-4" />
                Lật Thẻ
              </button>

              <button
                onClick={handleMarkMastered}
                className="flex-1 max-w-[160px] py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-600/20"
                title="Phím tắt: 2"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                Đã Thuộc (2)
              </button>
            </div>
          </>
        )}

      </main>

      {/* Battle Modal */}
      {isBattleModalOpen && (
        <CreateRoomModal
          isOpen={isBattleModalOpen}
          onClose={() => setIsBattleModalOpen(false)}
        />
      )}
    </div>
  );
}
