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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full text-center shadow-xs mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500" />
        
        <p className="text-xs uppercase tracking-widest text-blue-600 font-extrabold mb-1">
          Mã PIN Phòng Đấu 1v1
        </p>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] text-slate-900 bg-slate-100/80 px-6 py-2 rounded-2xl border border-slate-200">
            {room.roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-xs transition"
            title="Sao chép mã PIN"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Chia sẻ mã PIN này hoặc liên kết trực tiếp cho bạn bè cùng vào so tài
        </p>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs transition"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          {copied ? "Đã sao chép liên kết!" : "Sao chép liên kết phòng đấu"}
        </button>
      </div>

      {/* 2-Player Versus Arena Preview */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full items-center mb-8">
        
        {/* Host Card (3 cols) */}
        <div className="md:col-span-3 p-6 rounded-3xl bg-white border-2 border-blue-500 flex flex-col items-center text-center relative shadow-sm">
          <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-xs">
            <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
            Chủ Phòng (Host)
          </div>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-3xl font-black text-white shadow-md shadow-blue-500/20 my-2">
            {room.host.displayName.charAt(0).toUpperCase()}
          </div>

          <h3 className="font-bold text-lg text-slate-900 mt-1">
            {room.host.displayName}
            {isHost && <span className="text-xs text-blue-600 ml-1.5 font-bold">(Bạn)</span>}
          </h3>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Đã Sẵn Sàng
          </div>
        </div>

        {/* VS Center Badge (1 col) */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/20 animate-pulse">
            VS
          </div>
        </div>

        {/* Guest Card (3 cols) */}
        <div className={`md:col-span-3 p-6 rounded-3xl border-2 flex flex-col items-center text-center relative shadow-sm transition ${
          room.guest
            ? room.guest.isReady
              ? "bg-white border-emerald-500 shadow-emerald-500/10"
              : "bg-white border-slate-300"
            : "bg-slate-50 border-dashed border-slate-300"
        }`}>
          {room.guest ? (
            <>
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-xs">
                <Swords className="w-3 h-3 text-white" />
                Đối Thủ (Challenger)
              </div>

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-3xl font-black text-white shadow-md shadow-emerald-500/20 my-2">
                {room.guest.displayName.charAt(0).toUpperCase()}
              </div>

              <h3 className="font-bold text-lg text-slate-900 mt-1">
                {room.guest.displayName}
                {isGuest && <span className="text-xs text-emerald-600 ml-1.5 font-bold">(Bạn)</span>}
              </h3>

              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                room.guest.isReady
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {room.guest.isReady ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Đã Sẵn Sàng
                  </>
                ) : (
                  <>
                    <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    Chưa Sẵn Sàng
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 animate-pulse">
                <Hourglass className="w-7 h-7 text-blue-500 animate-spin" />
              </div>
              <p className="font-bold text-sm text-slate-700">Đang chờ bạn bè vào phòng...</p>
              <p className="text-xs text-slate-500 mt-1">Hãy gửi mã <span className="text-blue-600 font-mono font-bold">{room.roomCode}</span> cho đối thủ</p>
            </div>
          )}
        </div>

      </div>

      {/* Match Config Summary */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 mb-8 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Thông Tin Trận Đấu
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              Bộ Từ Vựng
            </span>
            <span className="font-bold text-slate-800 line-clamp-1">{room.settings.deckTitle}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Số Lượng
            </span>
            <span className="font-bold text-slate-800">{room.settings.totalQuestions} câu hỏi</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Thời Gian
            </span>
            <span className="font-bold text-slate-800">{room.settings.timePerQuestion}s / mỗi câu</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Độ Khó AI</span>
            <span className="font-bold text-emerald-700 uppercase">{room.settings.difficulty}</span>
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
            className={`w-full sm:w-80 py-4 rounded-2xl font-black text-base shadow-md transition flex items-center justify-center gap-2 ${
              room.guest.isReady
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25"
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
              className="w-full sm:w-80 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-base shadow-md shadow-blue-600/25 flex items-center justify-center gap-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
              <span className="text-xs text-amber-600 font-medium">
                ⏳ Đang chờ người chơi thứ 2 vào phòng...
              </span>
            ) : !room.guest.isReady ? (
              <span className="text-xs text-amber-600 font-medium">
                ⏳ Đang chờ đối thủ bấm "Sẵn Sàng"...
              </span>
            ) : null}
          </div>
        )}

        {/* If Spectator (neither host nor guest) */}
        {!isHost && !isGuest && (
          <p className="text-xs text-slate-500">
            Bạn đang xem phòng với tư cách quan sát viên.
          </p>
        )}

      </div>

    </div>
  );
}

