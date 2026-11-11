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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Vào Phòng Đấu 1v1</h2>
            <p className="text-xs text-slate-500">Nhập mã PIN 6 số do bạn bè chia sẻ</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
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
              className="w-full text-center tracking-[0.4em] font-mono text-2xl font-black uppercase bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-emerald-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || pinCode.trim().length !== 6}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
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

