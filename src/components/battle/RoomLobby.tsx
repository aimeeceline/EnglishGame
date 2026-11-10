"use client";

import { useState } from "react";
import { BattleRoom } from "@/types/battle";
import { togglePlayerReady } from "@/lib/firebase/rooms";
import { 
  Crown, 
  Swords, 
  Copy, 
  Check, 
  Clock, 
  Zap, 
  BookOpen, 
  ShieldCheck, 
  Hourglass, 
  Share2, 
  Loader2 
} from "lucide-react";
import QuickReactionToolbar from "./QuickReactionToolbar";

interface RoomLobbyProps {
  room: BattleRoom;
  currentUserUid: string;
  onStartGame: () => Promise<void>;
  isStarting: boolean;
}

export default function RoomLobby({
  room,
  currentUserUid,
  onStartGame,
  isStarting,
}: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);

  const isHost = room.host.uid === currentUserUid;
  const isGuest = room.guest?.uid === currentUserUid;
  const canStart = Boolean(isHost && room.guest && room.guest.isReady);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleReady = async () => {
    if (!room.guest) return;
    const nextReadyState = !room.guest.isReady;
    await togglePlayerReady(room.roomCode, true, nextReadyState);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col items-center">
      
      {/* PIN Code Banner */}
      <div className="bg-slate-900/90 border border-indigo-900/80 rounded-2xl p-6 w-full text-center shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-1">
          Mã PIN Phòng Đấu 1v1
        </p>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] text-pink-400">
            {room.roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow"
            title="Sao chép mã PIN"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Chia sẻ mã PIN này hoặc liên kết trực tiếp cho bạn bè cùng vào so tài
        </p>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 transition"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
          {copied ? "Đã sao chép liên kết!" : "Sao chép liên kết phòng đấu"}
        </button>
      </div>

      {/* 2-Player Versus Arena Preview */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full items-center mb-8">
        
        {/* Host Card (3 cols) */}
        <div className="md:col-span-3 p-6 rounded-2xl bg-slate-900/80 border-2 border-indigo-500/60 flex flex-col items-center text-center relative shadow-lg shadow-indigo-500/10">
          <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow">
            <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
            Chủ Phòng (Host)
          </div>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-600/30 my-2">
            {room.host.displayName.charAt(0).toUpperCase()}
          </div>

          <h3 className="font-bold text-lg text-white mt-1">
            {room.host.displayName}
            {isHost && <span className="text-xs text-indigo-400 ml-1.5">(Bạn)</span>}
          </h3>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Đã Sẵn Sàng
          </div>
        </div>

        {/* VS Center Badge (1 col) */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-pink-500/30 animate-pulse">
            VS
          </div>
        </div>

        {/* Guest Card (3 cols) */}
        <div className={`md:col-span-3 p-6 rounded-2xl border-2 flex flex-col items-center text-center relative shadow-lg transition ${
          room.guest
            ? room.guest.isReady
              ? "bg-slate-900/80 border-pink-500/60 shadow-pink-500/10"
              : "bg-slate-900/80 border-slate-700"
            : "bg-slate-950/40 border-dashed border-slate-800"
        }`}>
          {room.guest ? (
            <>
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-pink-600 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow">
                <Swords className="w-3 h-3 text-white" />
                Đối Thủ (Challenger)
              </div>

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-pink-600/30 my-2">
                {room.guest.displayName.charAt(0).toUpperCase()}
              </div>

              <h3 className="font-bold text-lg text-white mt-1">
                {room.guest.displayName}
                {isGuest && <span className="text-xs text-pink-400 ml-1.5">(Bạn)</span>}
              </h3>

              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                room.guest.isReady
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {room.guest.isReady ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Đã Sẵn Sàng
                  </>
                ) : (
                  <>
                    <Hourglass className="w-3.5 h-3.5 animate-spin" />
                    Chưa Sẵn Sàng
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
                <Hourglass className="w-7 h-7 text-indigo-400 animate-spin" />
              </div>
              <p className="font-bold text-sm text-slate-300">Đang chờ bạn bè vào phòng...</p>
              <p className="text-xs text-slate-500 mt-1">Hãy gửi mã <span className="text-pink-400 font-mono font-bold">{room.roomCode}</span> cho đối thủ</p>
            </div>
          )}
        </div>

      </div>

      {/* Match Config Summary */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-8">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Thông Tin Trận Đấu
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Bộ Từ Vựng
            </span>
            <span className="font-semibold text-white line-clamp-1">{room.settings.deckTitle}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Số Lượng
            </span>
            <span className="font-semibold text-white">{room.settings.totalQuestions} câu hỏi</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Thời Gian
            </span>
            <span className="font-semibold text-white">{room.settings.timePerQuestion}s / mỗi câu</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Độ Khó AI</span>
            <span className="font-semibold text-purple-300 uppercase">{room.settings.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Quick Reaction Toolbar */}
      <div className="w-full mb-6">
        <QuickReactionToolbar
          room={room}
          currentUserUid={currentUserUid}
          currentUserName={isHost ? room.host.displayName : room.guest?.displayName || "Người chơi"}
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
        
        {/* If Guest: Toggle Ready Button */}
        {isGuest && room.guest && (
          <button
            onClick={handleToggleReady}
            className={`w-full sm:w-80 py-4 rounded-2xl font-black text-base shadow-xl transition flex items-center justify-center gap-2 ${
              room.guest.isReady
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            {room.guest.isReady ? "Hủy Sẵn Sàng" : "Tôi Đã Sẵn Sàng!"}
          </button>
        )}

        {/* If Host: Start Game Button */}
        {isHost && (
          <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onStartGame}
              disabled={!canStart || isStarting}
              className="w-full sm:w-80 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Đang Soạn Đề Đấu...
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  Bắt Đầu Trận Đấu!
                </>
              )}
            </button>
            {!room.guest ? (
              <span className="text-xs text-amber-400 font-medium">
                ⏳ Đang chờ người chơi thứ 2 vào phòng...
              </span>
            ) : !room.guest.isReady ? (
              <span className="text-xs text-amber-400 font-medium">
                ⏳ Đang chờ đối thủ bấm "Sẵn Sàng"...
              </span>
            ) : null}
          </div>
        )}

        {/* If Spectator (neither host nor guest) */}
        {!isHost && !isGuest && (
          <p className="text-xs text-slate-400">
            Bạn đang xem phòng với tư cách quan sát viên.
          </p>
        )}

      </div>

    </div>
  );
}

