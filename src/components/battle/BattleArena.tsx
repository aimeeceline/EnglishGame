"use client";

import { useEffect, useState, useRef } from "react";
import { BattleRoom } from "@/types/battle";
import { submitPlayerAnswer, proceedToNextQuestion } from "@/lib/firebase/rooms";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Crown, Swords, Zap, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import QuickReactionToolbar from "./QuickReactionToolbar";

interface BattleArenaProps {
  room: BattleRoom;
  currentUserUid: string;
}

export default function BattleArena({ room, currentUserUid }: BattleArenaProps) {
  const { playCorrect, playWrong, playTick } = useSoundEffects();

  const isHost = room.host.uid === currentUserUid;
  const myPlayer = isHost ? room.host : room.guest;
  const opponentPlayer = isHost ? room.guest : room.host;

  const currentQ = room.questions[room.currentQuestionIndex];
  const timePerQ = room.settings.timePerQuestion || 15;

  const [timeLeft, setTimeLeft] = useState<number>(timePerQ);
  const [selectedKey, setSelectedKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Sync state when round changes
  useEffect(() => {
    setSelectedKey(null);
    setTimeLeft(timePerQ);
  }, [room.currentQuestionIndex, timePerQ]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (room.status !== 'playing') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - room.questionStartedAt) / 1000);
      const remaining = Math.max(0, timePerQ - elapsed);
      setTimeLeft(remaining);

      // Âm thanh tick-tock khi dưới 5s
      if (remaining <= 5 && remaining > 0) {
        playTick();
      }

      // Hết giờ
      if (remaining === 0) {
        clearInterval(interval);
        // Tự động nộp câu trả lời rỗng nếu chưa chọn
        if (myPlayer && !myPlayer.currentAnswer) {
          submitPlayerAnswer(room.roomCode, currentUserUid, null, 0);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room.status, room.questionStartedAt, timePerQ, myPlayer, room.roomCode, currentUserUid, playTick]);

  // Tự động chuyển câu khi round_result kết thúc (sau 2.5 giây)
  const isTransitioningRef = useRef(false);
  useEffect(() => {
    if (room.status === 'round_result' && isHost && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      const timer = setTimeout(async () => {
        await proceedToNextQuestion(room.roomCode);
        isTransitioningRef.current = false;
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [room.status, isHost, room.roomCode]);

  if (!currentQ) {
    return (
      <div className="text-center py-20 text-slate-400">
        Đang tải câu hỏi thi đấu...
      </div>
    );
  }

  const handleSelectOption = async (key: 'A' | 'B' | 'C' | 'D') => {
    if (room.status !== 'playing' || selectedKey !== null) return;

    setSelectedKey(key);

    const isCorrect = key === currentQ.correctAnswer;
    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }

    await submitPlayerAnswer(room.roomCode, currentUserUid, key, timeLeft);
  };

  const hasAnswered = selectedKey !== null || (myPlayer?.currentAnswer?.questionIndex === room.currentQuestionIndex);
  const opponentHasAnswered = Boolean(opponentPlayer?.currentAnswer?.questionIndex === room.currentQuestionIndex);
  const isRoundResult = room.status === 'round_result';

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col items-center">
      
      {/* 1v1 Versus Top Header */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 mb-6 shadow-2xl relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-blue-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-pink-500/5 pointer-events-none" />

        <div className="grid grid-cols-7 items-center gap-2">
          
          {/* Host Info (3 cols) */}
          <div className="col-span-3 flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-lg shadow-indigo-600/30 shrink-0">
              {room.host.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-white truncate">
                  {room.host.displayName}
                </span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-indigo-400 font-mono">
                {room.host.score.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">điểm</span>
              </div>
              {room.host.currentStreak > 1 && (
                <div className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-amber-400" />
                  Chuỗi x{room.host.currentStreak}
                </div>
              )}
            </div>
          </div>

          {/* Center Timer & Round (1 col) */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              {room.currentQuestionIndex + 1}/{room.questions.length}
            </span>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-mono font-black text-lg sm:text-xl border-2 my-1 transition-all ${
              timeLeft <= 5
                ? "bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse scale-105"
                : "bg-slate-950 border-indigo-500 text-indigo-300"
            }`}>
              {timeLeft}
            </div>
          </div>

          {/* Guest Info (3 cols) */}
          <div className="col-span-3 flex items-center justify-end gap-2 sm:gap-3 text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-1">
                <span className="font-bold text-xs sm:text-sm text-white truncate">
                  {room.guest?.displayName || "Đối thủ"}
                </span>
                <Swords className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-black text-pink-400 font-mono">
                {(room.guest?.score || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">điểm</span>
              </div>
              {(room.guest?.currentStreak || 0) > 1 && (
                <div className="text-[10px] font-bold text-amber-400 flex items-center justify-end gap-0.5">
                  <Zap className="w-3 h-3 fill-amber-400" />
                  Chuỗi x{room.guest?.currentStreak}
                </div>
              )}
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-lg shadow-pink-600/30 shrink-0">
              {room.guest?.displayName.charAt(0).toUpperCase() || "?"}
            </div>
          </div>

        </div>

        {/* Live Opponent Status Indicator */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Bạn:</span>
            {isRoundResult ? (
              myPlayer?.currentAnswer?.isCorrect ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đúng! +{myPlayer?.currentAnswer?.pointsEarned || 0} điểm
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Chưa chính xác (0 điểm)
                </span>
              )
            ) : hasAnswered ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn (đang đợi đối thủ...)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold animate-pulse">
                Đang suy nghĩ...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Đối thủ:</span>
            {isRoundResult ? (
              opponentPlayer?.currentAnswer?.isCorrect ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đối thủ đúng (+{opponentPlayer?.currentAnswer?.pointsEarned || 0})
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Đối thủ sai (0đ)
                </span>
              )
            ) : opponentHasAnswered ? (
              <span className="text-pink-400 font-bold flex items-center gap-1 animate-bounce">
                ⚡ ĐÃ CHỌN ĐÁP ÁN!
              </span>
            ) : (
              <span className="text-slate-500 italic">
                Đang cân nhắc...
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Quick Reaction Toolbar */}
      <div className="w-full mb-5">
        <QuickReactionToolbar
          room={room}
          currentUserUid={currentUserUid}
          currentUserName={myPlayer?.displayName || "Người chơi"}
        />
      </div>

      {/* Question Box */}
      <div className="w-full bg-slate-900/90 border border-indigo-900/70 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Từ vựng: <span className="font-mono text-white text-sm">{currentQ.targetWord}</span>
        </div>

        <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed max-w-2xl mx-auto">
          {currentQ.prompt}
        </h3>
      </div>

      {/* 4 Answer Option Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-6">
        {currentQ.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          const isCorrect = opt.key === currentQ.correctAnswer;
          
          let btnStyle = "bg-slate-900/80 border-slate-800 hover:border-indigo-500 hover:bg-slate-800 text-slate-100";

          if (isRoundResult) {
            if (isCorrect) {
              btnStyle = "bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20 scale-[1.02]";
            } else if (isSelected) {
              btnStyle = "bg-rose-950/80 border-2 border-rose-500 text-rose-200";
            } else {
              btnStyle = "bg-slate-950/40 border-slate-800 text-slate-500 opacity-60";
            }
          } else if (isSelected) {
            btnStyle = "bg-indigo-600 border-2 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 scale-[1.01]";
          }

          return (
            <button
              key={opt.key}
              onClick={() => handleSelectOption(opt.key)}
              disabled={hasAnswered || isRoundResult}
              className={`p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-3.5 transition-all active:scale-[0.98] disabled:cursor-not-allowed ${btnStyle}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition ${
                isSelected
                  ? "bg-white text-indigo-900"
                  : isRoundResult && isCorrect
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-300"
              }`}>
                {opt.key}
              </div>
              <span className="font-semibold text-sm sm:text-base flex-1">
                {opt.text}
              </span>
              {isRoundResult && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {isRoundResult && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Round Result Explanation Bar */}
      {isRoundResult && (
        <div className="w-full p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/80 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              💡 Giải Thích Chi Tiết Của AI:
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {currentQ.explanation}
          </p>
        </div>
      )}

    </div>
  );
}

