"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { joinBattleRoom } from "@/lib/firebase/rooms";
import { useUserIdentity } from "@/hooks/useUserIdentity";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const { user } = useUserIdentity();

  const [pinCode, setPinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = pinCode.trim().toUpperCase();

    if (cleanCode.length !== 6) {
      setErrorMsg("Mã PIN phòng phải gồm đúng 6 ký tự!");
      return;
    }

    setIsJoining(true);
    setErrorMsg("");

    try {
      const result = await joinBattleRoom(cleanCode, {
        uid: user.uid,
        displayName: user.displayName,
      });

      if (!result.success) {
        setErrorMsg(result.message || "Không thể vào phòng này!");
        setIsJoining(false);
        return;
      }

      router.push(`/battle/${cleanCode}`);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Lỗi khi vào phòng");
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-900/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Vào Phòng Đấu 1v1</h2>
            <p className="text-xs text-slate-400">Nhập mã PIN 6 số do bạn bè chia sẻ</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Mã PIN Phòng (6 ký tự)
            </label>
            <input
              type="text"
              maxLength={6}
              value={pinCode}
              onChange={(e) => {
                setPinCode(e.target.value.toUpperCase());
                setErrorMsg("");
              }}
              placeholder="VD: ENG888"
              className="w-full text-center tracking-[0.4em] font-mono text-2xl font-black uppercase bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-pink-400 placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || pinCode.trim().length !== 6}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang Kết Nối Vào Phòng...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Vào Phòng Ngay
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

