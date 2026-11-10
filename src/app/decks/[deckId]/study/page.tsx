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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-sm font-semibold text-slate-400 mb-4">
            Đang tải dữ liệu bộ thẻ hoặc bộ thẻ chưa có từ vựng...
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 w-full flex-1 flex flex-col items-center justify-between">
        
        {/* Top Header & Progress */}
        <div className="w-full flex items-center justify-between mb-4">
          <Link
            href={`/decks/${deck.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Chi Tiết Bộ Từ
          </Link>

          {/* Quick Mastery Counters */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {masteredIds.size} thuộc
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {needsReviewIds.size} cần ôn
            </span>
          </div>

          <button
            onClick={() => setIsBattleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 text-xs font-bold hover:bg-pink-600 hover:text-white transition"
          >
            <Swords className="w-3.5 h-3.5" />
            Đấu 1v1 Bộ Này
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / deck.cards.length) * 100}%` }}
          />
        </div>

        {/* Finished Screen OR Active Card */}
        {isFinished ? (
          <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center shadow-2xl my-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              Hoàn Thành Phiên Luyện Thẻ! 🎉
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Bạn đã duyệt qua toàn bộ {deck.cards.length} từ vựng trong bộ <span className="text-indigo-400 font-semibold font-mono">"{deck.title}"</span>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/60">
                <span className="text-2xl font-black text-emerald-400 font-mono">{masteredIds.size}</span>
                <span className="block text-xs text-slate-300 font-bold mt-1">Từ Đã Thuộc</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60">
                <span className="text-2xl font-black text-rose-400 font-mono">{needsReviewIds.size}</span>
                <span className="block text-xs text-slate-300 font-bold mt-1">Từ Cần Ôn Lại</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Ôn Luyện Lại
              </button>
              <button
                onClick={() => setIsBattleModalOpen(true)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
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
                className={`preserve-3d relative w-full h-full rounded-3xl transition-transform duration-500 shadow-2xl ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                
                {/* Front of Card */}
                <div className="backface-hidden absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentCard.partOfSpeech || "Vocabulary"}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" /> Bấm hoặc Space để lật
                    </span>
                  </div>

                  <div className="text-center my-auto">
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
                      {currentCard.word}
                    </h2>
                    {currentCard.phonetic && (
                      <p className="text-sm sm:text-base font-mono text-indigo-400">
                        {currentCard.phonetic}
                      </p>
                    )}

                    <button
                      onClick={handleSpeak}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-xs font-bold text-white transition shadow"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="w-4 h-4 text-indigo-300" />
                      Nghe Phát Âm
                    </button>
                  </div>

                  <div className="text-center text-[11px] text-slate-500">
                    Thẻ {currentIndex + 1} / {deck.cards.length}
                  </div>
                </div>

                {/* Back of Card */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border-2 border-purple-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Định Nghĩa & Ngữ Cảnh
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" /> Bấm để lật lại
                    </span>
                  </div>

                  <div className="text-center my-auto space-y-4">
                    <div>
                      <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
                        Nghĩa Tiếng Việt
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        {currentCard.meaning}
                      </h3>
                    </div>

                    {currentCard.exampleSentence && (
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-900/40 text-left">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200">
                          "{currentCard.exampleSentence}"
                        </p>
                        {currentCard.exampleTranslation && (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            $\rightarrow$ {currentCard.exampleTranslation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[11px] text-slate-500">
                    Mặt sau thẻ từ vựng
                  </div>
                </div>

              </div>
            </div>

            {/* Assessment & Navigation Controls */}
            <div className="w-full flex items-center justify-center gap-3 mt-8">
              <button
                onClick={handleMarkReview}
                className="flex-1 max-w-[160px] py-3.5 px-4 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                title="Phím tắt: 1"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Cần Ôn (1)
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <RotateCw className="w-4 h-4" />
                Lật Thẻ
              </button>

              <button
                onClick={handleMarkMastered}
                className="flex-1 max-w-[160px] py-3.5 px-4 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                title="Phím tắt: 2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
