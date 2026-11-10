"use client";

import { useState, useEffect } from "react";
import { sendRoomReaction } from "@/lib/firebase/rooms";
import { BattleRoom } from "@/types/battle";

interface QuickReactionToolbarProps {
  room: BattleRoom;
  currentUserUid: string;
  currentUserName: string;
}

const REACTIONS = [
  { emoji: "🔥", text: "Nhanh lên đối thủ ơi!" },
  { emoji: "😎", text: "Câu này quá dễ!" },
  { emoji: "😱", text: "Toang rồi, chọn nhầm!" },
  { emoji: "👏", text: "Hay lắm bạn tôi!" },
  { emoji: "⚡", text: "Chuỗi bất bại!" },
];

export default function QuickReactionToolbar({
  room,
  currentUserUid,
  currentUserName,
}: QuickReactionToolbarProps) {
  const [activeBubble, setActiveBubble] = useState<{
    senderName: string;
    emoji: string;
    text: string;
    isMe: boolean;
  } | null>(null);

  // Lắng nghe reaction thay đổi trong phòng
  useEffect(() => {
    if (!room.reaction || Date.now() - room.reaction.sentAt > 4000) return;

    setActiveBubble({
      senderName: room.reaction.senderName,
      emoji: room.reaction.emoji,
      text: room.reaction.text,
      isMe: room.reaction.senderUid === currentUserUid,
    });

    const timer = setTimeout(() => {
      setActiveBubble(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [room.reaction, currentUserUid]);

  const handleSend = async (emoji: string, text: string) => {
    await sendRoomReaction(room.roomCode, currentUserUid, currentUserName, emoji, text);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      
      {/* Floating Reaction Bubble */}
      {activeBubble && (
        <div className={`mb-3 py-2 px-4 rounded-2xl border shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300 ${
          activeBubble.isMe
            ? "bg-indigo-950/90 border-indigo-500 text-indigo-200"
            : "bg-pink-950/90 border-pink-500 text-pink-200"
        }`}>
          <span className="text-2xl animate-bounce">{activeBubble.emoji}</span>
          <div className="text-xs">
            <span className="font-extrabold block">
              {activeBubble.isMe ? "Bạn" : activeBubble.senderName}:
            </span>
            <span className="font-semibold text-white">{activeBubble.text}</span>
          </div>
        </div>
      )}

      {/* Emoji Reaction Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <span className="text-[10px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">
          Cảm xúc:
        </span>
        {REACTIONS.map((r, i) => (
          <button
            key={i}
            onClick={() => handleSend(r.emoji, r.text)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold active:scale-95"
            title={r.text}
          >
            <span className="text-base">{r.emoji}</span>
            <span className="hidden md:inline text-[11px] text-slate-400">{r.text}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

