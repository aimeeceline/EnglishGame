"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { BattleRoom, BattleQuestion } from "@/types/battle";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Trophy, Swords, RotateCcw, Home, CheckCircle2, BookOpen, Sparkles, BookmarkPlus, Check } from "lucide-react";
import Link from "next/link";
import AIExplanationModal from "./AIExplanationModal";
import { addCardsToReviewDeck } from "@/lib/firebase/decks";

interface MatchResultModalProps {
  room: BattleRoom;
  currentUserUid: string;
  onRematch: () => void;
}

export default function MatchResultModal({
  room,
  currentUserUid,
  onRematch,
}: MatchResultModalProps) {
  const { playVictory } = useSoundEffects();
  const [selectedQuestionForAI, setSelectedQuestionForAI] = useState<BattleQuestion | null>(null);
  const [savedToFlashcards, setSavedToFlashcards] = useState(false);
  const [savingCards, setSavingCards] = useState(false);

  const handleSaveToFlashcards = async () => {
    if (savingCards || savedToFlashcards) return;
    setSavingCards(true);
    try {
      const cardsToSave = room.questions.map((q) => {
        // Find correct option text
        const correctOpt = q.options.find(o => o.key === q.correctAnswer);
        return {
          word: q.targetWord,
          meaning: correctOpt?.text || q.explanation,
          example: q.prompt,
        };
      });
      await addCardsToReviewDeck(cardsToSave);
      setSavedToFlashcards(true);
    } catch (e) {
      console.warn("Lỗi lưu flashcard:", e);
    } finally {
      setSavingCards(false);
    }
  };

  const isHost = room.host.uid === currentUserUid;
  const myPlayer = isHost ? room.host : room.guest;
  const opponentPlayer = isHost ? room.guest : room.host;

  const isWinner = room.winnerUid === currentUserUid;
  const isDraw = room.winnerUid === 'draw';

  const totalQ = room.questions.length || 1;
  const timePerQ = room.settings.timePerQuestion || 15;

  // Tính tốc độ phản xạ trung bình (giây) của mỗi bên
  const calcAvgTime = (player: typeof myPlayer) => {
    if (!player?.answersHistory) return null;
    const entries = Object.values(player.answersHistory);
    if (entries.length === 0) return null;
    const totalTimeSpent = entries.reduce((acc, a) => {
      const spent = Math.max(0.5, timePerQ - (a.timeRemainingSeconds || 0));
      return acc + spent;
    }, 0);
    return (totalTimeSpent / entries.length).toFixed(1);
  };

  const hostAvgTime = calcAvgTime(room.host);
  const guestAvgTime = calcAvgTime(room.guest);

  useEffect(() => {
    if (isWinner) {
      playVictory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Tự động lưu kết quả vào lịch sử đối đầu
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("battle_history");
        const history = raw ? JSON.parse(raw) : [];
        const alreadySaved = history.some(
          (h: { roomCode: string; date: number }) =>
            h.roomCode === room.roomCode && Date.now() - h.date < 60000
        );
        if (!alreadySaved) {
          history.unshift({
            roomCode: room.roomCode,
            deckTitle: room.settings.deckTitle,
            myScore: myPlayer?.score || 0,
            opponentName: opponentPlayer?.displayName || "Đối thủ",
            opponentScore: opponentPlayer?.score || 0,
            isWinner,
            isDraw,
            date: Date.now(),
          });
          localStorage.setItem("battle_history", JSON.stringify(history.slice(0, 10)));
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, [isWinner, isDraw, playVictory, room.roomCode, room.settings.deckTitle, myPlayer?.score, opponentPlayer?.displayName, opponentPlayer?.score]);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col items-center">
      
      {/* Victory Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-3xl bg-white border border-slate-200 shadow-md mb-4">
          <Trophy className={`w-16 h-16 ${
            isWinner ? "text-amber-500 animate-bounce" : isDraw ? "text-slate-400" : "text-slate-400"
          }`} />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          {isWinner ? (
            <span className="bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-600 bg-clip-text text-transparent">
              CHIẾN THẮNG TUYỆT VỜI! 🏆
            </span>
          ) : isDraw ? (
            <span className="text-slate-700">TRẬN ĐẤU BẤT PHÂN THẮNG BẠI! 🤝</span>
          ) : (
            <span className="text-slate-700">CHÚC BẠN MAY MẮN LẦN SAU! 🔥</span>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">
          Kết quả trận đối kháng 1v1 trong phòng <span className="text-blue-600 font-mono font-bold">{room.roomCode}</span>
        </p>
      </div>

      {/* 2-Player Final Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
        
        {/* Host Final Card */}
        <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center ${
          room.winnerUid === room.host.uid
            ? "bg-white border-blue-500 shadow-md shadow-blue-500/10"
            : "bg-white border-slate-200"
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-2xl font-black text-white mb-2 shadow-sm">
            {room.host.displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-base text-slate-900">{room.host.displayName}</h3>
          <div className="text-3xl font-black text-blue-600 font-mono my-1.5">
            {room.host.score.toLocaleString()} <span className="text-xs text-slate-500 font-sans">điểm</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Đúng: <strong className="text-emerald-600">{room.host.totalCorrect}/{totalQ}</strong> ({Math.round((room.host.totalCorrect / totalQ) * 100)}%)</span>
            <span>•</span>
            <span>Tốc độ: <strong className="text-blue-600">{hostAvgTime ? `${hostAvgTime}s` : "N/A"}</strong></span>
          </div>
        </div>

        {/* Guest Final Card */}
        <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center ${
          room.guest && room.winnerUid === room.guest.uid
            ? "bg-white border-emerald-500 shadow-md shadow-emerald-500/10"
            : "bg-white border-slate-200"
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-2xl font-black text-white mb-2 shadow-sm">
            {room.guest?.displayName.charAt(0).toUpperCase() || "?"}
          </div>
          <h3 className="font-bold text-base text-slate-900">{room.guest?.displayName || "Đối thủ"}</h3>
          <div className="text-3xl font-black text-emerald-600 font-mono my-1.5">
            {(room.guest?.score || 0).toLocaleString()} <span className="text-xs text-slate-500 font-sans">điểm</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Đúng: <strong className="text-emerald-600">{room.guest?.totalCorrect || 0}/{totalQ}</strong> ({Math.round(((room.guest?.totalCorrect || 0) / totalQ) * 100)}%)</span>
            <span>•</span>
            <span>Tốc độ: <strong className="text-emerald-600">{guestAvgTime ? `${guestAvgTime}s` : "N/A"}</strong></span>
          </div>
        </div>

      </div>

      {/* Review All Questions with AI Explanation */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Xem Lại Lời Giải Chi Tiết Của AI</h3>
          </div>

          <button
            onClick={handleSaveToFlashcards}
            disabled={savingCards || savedToFlashcards}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-semibold transition self-start sm:self-auto disabled:opacity-80 shadow-xs"
          >
            {savedToFlashcards ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Đã Lưu Vào Flashcard Ôn Tập!
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
                {savingCards ? "Đang lưu..." : "Lưu Toàn Bộ Từ Vào Flashcard Ôn Tập"}
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {room.questions.map((q, idx) => {
            const myAns = myPlayer?.answersHistory?.[idx];
            const oppAns = opponentPlayer?.answersHistory?.[idx];
            const correctOpt = q.options.find(o => o.key === q.correctAnswer);

            return (
              <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-blue-600 uppercase">
                    Câu {idx + 1}: {q.targetWord}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[11px]">
                    Đáp án đúng: {q.correctAnswer} - {correctOpt?.text}
                  </span>
                </div>
                
                <p className="text-sm font-semibold text-slate-800 mb-3">{q.prompt}</p>

                {/* 1v1 Answer Comparison Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {/* Your Answer */}
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    myAns?.isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : myAns?.selectedKey
                        ? "bg-rose-50 border-rose-300 text-rose-800"
                        : "bg-white border-slate-200 text-slate-500"
                  }`}>
                    <span className="text-slate-600 font-medium">Bạn chọn:</span>
                    <span className="font-bold">
                      {myAns?.selectedKey ? (
                        <>
                          {myAns.selectedKey} {myAns.isCorrect ? "✅ Đúng (+1,000đ)" : "❌ Sai"}
                        </>
                      ) : (
                        "⏱ Hết giờ"
                      )}
                    </span>
                  </div>

                  {/* Opponent Answer */}
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    oppAns?.isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : oppAns?.selectedKey
                        ? "bg-rose-50 border-rose-300 text-rose-800"
                        : "bg-white border-slate-200 text-slate-500"
                  }`}>
                    <span className="text-slate-600 font-medium">{opponentPlayer?.displayName || "Đối thủ"}:</span>
                    <span className="font-bold">
                      {oppAns?.selectedKey ? (
                        <>
                          {oppAns.selectedKey} {oppAns.isCorrect ? "✅ Đúng" : "❌ Sai"}
                        </>
                      ) : (
                        "⏱ Hết giờ"
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 leading-relaxed mb-3">
                  <strong className="text-blue-800">💡 Giải thích của AI:</strong> {q.explanation}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedQuestionForAI(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Gia sư AI phân tích sâu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <button
          onClick={onRematch}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Tái Đấu Trận Mới
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition"
        >
          <Home className="w-4 h-4 text-slate-600" />
          Về Sảnh Đấu Chính
        </Link>
      </div>

      {/* AI Explanation Modal */}
      <AIExplanationModal
        isOpen={Boolean(selectedQuestionForAI)}
        onClose={() => setSelectedQuestionForAI(null)}
        question={selectedQuestionForAI}
        selectedAnswer={null}
      />

    </div>
  );
}

