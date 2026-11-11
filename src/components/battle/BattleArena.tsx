"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BattleRoom } from "@/types/battle";
import { submitPlayerAnswer, proceedToNextQuestion } from "@/lib/firebase/rooms";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Crown, Swords, Zap, CheckCircle2, XCircle, Clock, Sparkles, PenTool, Send, HelpCircle, LogOut } from "lucide-react";
import QuickReactionToolbar from "./QuickReactionToolbar";

interface BattleArenaProps {
  room: BattleRoom;
  currentUserUid: string;
}

export default function BattleArena({ room, currentUserUid }: BattleArenaProps) {
  const { playCorrect, playWrong, playTick } = useSoundEffects();
  const router = useRouter();

  const isHost = room.host.uid === currentUserUid;
  const myPlayer = isHost ? room.host : room.guest;
  const opponentPlayer = isHost ? room.guest : room.host;

  const currentQ = room.questions[room.currentQuestionIndex];
  const timePerQ = room.settings.timePerQuestion || 15;

  const [timeLeft, setTimeLeft] = useState<number>(timePerQ);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [typedWord, setTypedWord] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const handleLeaveBattle = () => {
    if (confirm("Bạn có muốn tạm rời khỏi trận đấu? Trận đấu vẫn đang diễn ra và bạn có thể quay lại bất cứ lúc nào từ Trang chủ hoặc Thanh điều hướng.")) {
      router.push("/");
    }
  };

  // Xác định câu hiện tại là điền từ hay trắc nghiệm
  const isFillInBlank = Boolean(
    currentQ && (currentQ.type === 'fill_in_blank' || !currentQ.options || currentQ.options.length === 0)
  );

  // Sync state when round changes
  useEffect(() => {
    setSelectedKey(null);
    setTypedWord("");
    setTimeLeft(timePerQ);

    // Tự động focus vào ô nhập từ khi sang câu hỏi điền từ mới
    if (isFillInBlank) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [room.currentQuestionIndex, timePerQ, isFillInBlank]);

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
        // Tự động nộp câu trả lời nếu chưa chọn
        if (myPlayer && !myPlayer.currentAnswer) {
          const autoAnswer = isFillInBlank && typedWord.trim() ? typedWord.trim() : null;
          submitPlayerAnswer(room.roomCode, currentUserUid, autoAnswer, 0);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room.status, room.questionStartedAt, timePerQ, myPlayer, room.roomCode, currentUserUid, playTick, isFillInBlank, typedWord]);

  // Tự động chuyển câu khi round_result kết thúc (sau 2.8 giây để đọc lời giải thích)
  const isTransitioningRef = useRef(false);
  useEffect(() => {
    if (room.status === 'round_result' && isHost && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      const timer = setTimeout(async () => {
        await proceedToNextQuestion(room.roomCode);
        isTransitioningRef.current = false;
      }, 2800);
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

  // Xử lý nộp đáp án dạng trắc nghiệm A/B/C/D
  const handleSelectOption = async (key: string) => {
    if (room.status !== 'playing' || selectedKey !== null) return;

    setSelectedKey(key);

    const isCorrect = key.toUpperCase() === currentQ.correctAnswer.toUpperCase();
    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }

    await submitPlayerAnswer(room.roomCode, currentUserUid, key, timeLeft);
  };

  // Xử lý nộp đáp án dạng gõ từ vựng vào chỗ trống
  const handleTypedSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (room.status !== 'playing' || selectedKey !== null) return;

    const trimmed = typedWord.trim();
    if (!trimmed) return;

    setSelectedKey(trimmed);

    const cleanAnswer = trimmed.toLowerCase();
    const cleanTarget = currentQ.targetWord.trim().toLowerCase();
    const cleanCorrect = currentQ.correctAnswer.trim().toLowerCase();
    const isCorrect = cleanAnswer === cleanTarget || cleanAnswer === cleanCorrect;

    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }

    await submitPlayerAnswer(room.roomCode, currentUserUid, trimmed, timeLeft);
  };

  const hasAnswered = selectedKey !== null || (myPlayer?.currentAnswer?.questionIndex === room.currentQuestionIndex);
  const opponentHasAnswered = Boolean(opponentPlayer?.currentAnswer?.questionIndex === room.currentQuestionIndex);
  const isRoundResult = room.status === 'round_result';

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col items-center">
      
      {/* 1v1 Versus Top Header */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 mb-6 shadow-sm relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-blue-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-emerald-500/5 pointer-events-none" />

        <div className="grid grid-cols-7 items-center gap-2">
          
          {/* Host Info (3 cols) */}
          <div className="col-span-3 flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-md shadow-blue-500/20 shrink-0">
              {room.host.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                  {room.host.displayName}
                </span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-blue-600 font-mono">
                {room.host.score.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">điểm</span>
              </div>
              {room.host.currentStreak > 1 && (
                <div className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Chuỗi x{room.host.currentStreak}
                </div>
              )}
            </div>
          </div>

          {/* Center Timer & Round (1 col) */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-500 tracking-wider">
              {room.currentQuestionIndex + 1}/{room.questions.length}
            </span>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-mono font-black text-lg sm:text-xl border-2 my-1 transition-all ${
              timeLeft <= 5
                ? "bg-rose-50 border-rose-500 text-rose-600 animate-pulse scale-105"
                : "bg-blue-50 border-blue-500 text-blue-700 shadow-xs"
            }`}>
              {timeLeft}
            </div>
          </div>

          {/* Guest Info (3 cols) */}
          <div className="col-span-3 flex items-center justify-end gap-2 sm:gap-3 text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-1">
                <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                  {room.guest?.displayName || "Đối thủ"}
                </span>
                <Swords className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-black text-emerald-600 font-mono">
                {(room.guest?.score || 0).toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">điểm</span>
              </div>
              {(room.guest?.currentStreak || 0) > 1 && (
                <div className="text-[10px] font-bold text-amber-600 flex items-center justify-end gap-0.5">
                  <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Chuỗi x{room.guest?.currentStreak}
                </div>
              )}
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-md shadow-emerald-500/20 shrink-0">
              {room.guest?.displayName.charAt(0).toUpperCase() || "?"}
            </div>
          </div>

        </div>

        {/* Live Opponent Status Indicator */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Bạn:</span>
            {isRoundResult ? (
              myPlayer?.currentAnswer?.isCorrect ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đúng! +{myPlayer?.currentAnswer?.pointsEarned || 0} điểm
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" /> Chưa chính xác (0 điểm)
                </span>
              )
            ) : hasAnswered ? (
              <span className="text-blue-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Đã nộp bài (đợi đối thủ...)
              </span>
            ) : (
              <span className="text-amber-600 font-semibold animate-pulse">
                Đang suy nghĩ...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Đối thủ:</span>
              {isRoundResult ? (
                opponentPlayer?.currentAnswer?.isCorrect ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in zoom-in-95 duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đối thủ đúng (+{opponentPlayer?.currentAnswer?.pointsEarned || 0})
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" /> Đối thủ sai (0đ)
                  </span>
                )
              ) : opponentHasAnswered ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 animate-bounce">
                  ⚡ ĐÃ NỘP BÀI!
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  Đang cân nhắc...
                </span>
              )}
            </div>

            <button
              onClick={handleLeaveBattle}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200"
              title="Tạm rời trận (Bạn có thể quay lại bất cứ lúc nào từ Trang chủ hoặc Thanh điều hướng)"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Tạm rời</span>
            </button>
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
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm text-center relative">
        {isFillInBlank ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            Dạng bài: Gõ từ vựng tiếng Anh vào chỗ trống
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Từ vựng: <span className="font-mono text-slate-900 text-sm font-bold">{currentQ.targetWord}</span>
          </div>
        )}

        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
          {currentQ.prompt}
        </h3>

        {/* Gợi ý cho câu hỏi (nếu có) */}
        {currentQ.hint && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{currentQ.hint}</span>
          </div>
        )}
      </div>

      {/* Answer Area: Conditional based on Question Type */}
      {isFillInBlank ? (
        /* ================= DẠNG 1: GÕ TỪ VÀO CHỖ TRỐNG ================= */
        <div className="w-full max-w-xl mx-auto mb-6">
          <form onSubmit={handleTypedSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                disabled={hasAnswered || isRoundResult}
                placeholder="Gõ từ vựng tiếng Anh vào đây..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className={`w-full px-5 py-4 pr-12 rounded-2xl border-2 font-mono text-lg sm:text-xl font-bold transition-all shadow-sm outline-none ${
                  isRoundResult
                    ? myPlayer?.currentAnswer?.isCorrect
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                    : hasAnswered
                    ? "bg-blue-50 border-blue-400 text-blue-900"
                    : "bg-white border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-800"
                }`}
              />
              {typedWord && !hasAnswered && !isRoundResult && (
                <button
                  type="button"
                  onClick={() => setTypedWord("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              )}
            </div>

            {!hasAnswered && !isRoundResult ? (
              <button
                type="submit"
                disabled={!typedWord.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white font-extrabold text-base shadow-md shadow-blue-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Nộp Đáp Án</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20">Enter ↵</span>
                <Send className="w-4 h-4 ml-1" />
              </button>
            ) : hasAnswered && !isRoundResult ? (
              <div className="py-3 px-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-center font-bold text-sm flex items-center justify-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Đã nộp: &quot;{typedWord || myPlayer?.currentAnswer?.selectedKey}&quot; — Đang đợi đối thủ...
              </div>
            ) : null}
          </form>

          {/* Chi tiết kết quả khi hết vòng đấu điền từ */}
          {isRoundResult && (
            <div className="mt-4 p-4 rounded-2xl border bg-white shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold block mb-1">Từ bạn đã nhập:</span>
                  <div className="flex items-center gap-2 font-bold font-mono text-base">
                    {myPlayer?.currentAnswer?.isCorrect ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        {myPlayer?.currentAnswer?.selectedKey || "(Chưa nhập)"}
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        {myPlayer?.currentAnswer?.selectedKey || "(Chưa nhập)"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-semibold block mb-1">Đáp án chính xác:</span>
                  <div className="font-bold font-mono text-base text-emerald-900">
                    {currentQ.targetWord}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= DẠNG 2: TRẮC NGHIỆM 4 LỰA CHỌN ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-6">
          {(currentQ.options || []).map((opt) => {
            const isSelected = selectedKey === opt.key || myPlayer?.currentAnswer?.selectedKey === opt.key;
            const isCorrect = opt.key.toUpperCase() === currentQ.correctAnswer.toUpperCase();
            
            let btnStyle = "bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-slate-800 shadow-xs";

            if (isRoundResult) {
              if (isCorrect) {
                btnStyle = "bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/15 scale-[1.01]";
              } else if (isSelected) {
                btnStyle = "bg-rose-50 border-2 border-rose-500 text-rose-900";
              } else {
                btnStyle = "bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-60";
              }
            } else if (isSelected) {
              btnStyle = "bg-blue-600 border-2 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]";
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
                    ? "bg-white text-blue-700"
                    : isRoundResult && isCorrect
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {opt.key}
                </div>
                <span className="font-semibold text-sm sm:text-base flex-1">
                  {opt.text}
                </span>
                {isRoundResult && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isRoundResult && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Round Result Explanation Bar */}
      {isRoundResult && (
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 animate-in fade-in duration-300 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              💡 Giải Thích Chi Tiết Của AI:
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {currentQ.explanation}
          </p>
        </div>
      )}

    </div>
  );
}
