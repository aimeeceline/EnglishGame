"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Swords, Layers, Trophy, Volume2, VolumeX, Edit3, Check, Sparkles, Flame } from "lucide-react";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import ApiKeyModal from "./ApiKeyModal";

export default function Navbar() {
  const pathname = usePathname();
  const { user, updateName } = useUserIdentity();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

  // Thống kê thành tích thực tế của user từ Local/Firebase
  const [userStats, setUserStats] = useState<{ wins: number; streak: number }>({ wins: 0, streak: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || !user.uid) return;
    try {
      const raw = localStorage.getItem("user_leaderboard_stats");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[user.uid]) {
          setUserStats({
            wins: parsed[user.uid].totalWins || 0,
            streak: parsed[user.uid].streak || 0,
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, [user.uid]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateName(nameInput);
      setIsEditing(false);
    }
  };

  const rankTitle = userStats.wins >= 15 ? "Rank Vàng" : userStats.wins >= 5 ? "Rank Bạc" : "Rank Đồng";
  const rankColor = userStats.wins >= 15 ? "text-amber-600" : userStats.wins >= 5 ? "text-slate-600" : "text-emerald-600";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Eng<span className="gradient-text">Duel</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-xs">
                  1v1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Realtime Vocab Battle Arena</p>
            </div>
          </Link>

          {/* Navigation Tabs (Center) */}
          <nav className="hidden md:flex items-center p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-inner">
            <Link
              href="/"
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                pathname === "/"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Swords className={`w-4 h-4 ${pathname === "/" ? "text-blue-600" : "text-slate-400"}`} />
              Đấu Trường 1v1
            </Link>
            <Link
              href="/decks"
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                pathname.startsWith("/decks")
                  ? "bg-white text-emerald-600 shadow-xs border border-slate-200/50 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Layers className={`w-4 h-4 ${pathname.startsWith("/decks") ? "text-emerald-600" : "text-slate-400"}`} />
              Flashcard & Sheet
            </Link>
            <Link
              href="/leaderboard"
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                pathname === "/leaderboard"
                  ? "bg-white text-amber-600 shadow-xs border border-slate-200/50 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Xếp Hạng
            </Link>
          </nav>

          {/* User Profile & Action Tools */}
          <div className="flex items-center gap-3">
            
            {/* AI Tutor Badge Button */}
            <button
              onClick={() => setIsApiKeyOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 font-semibold text-xs hover:shadow-md transition-all"
              title="Cài đặt Gemini AI API Key cá nhân"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Tutor Ready</span>
            </button>

            {/* Audio sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center text-slate-600 transition-colors"
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Profile Pill */}
            <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all">
              <div className="relative">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${user.avatarColor || "from-blue-600 to-emerald-400"} flex items-center justify-center text-sm font-black text-white ring-2 ring-emerald-500/30`}>
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {userStats.wins > 99 ? "99+" : userStats.wins}
                </span>
              </div>

              <div className="text-left hidden sm:block">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      className="bg-slate-50 text-xs px-2 py-0.5 rounded border border-blue-500 text-slate-800 w-28 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500 text-[10px]"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-800 truncate max-w-[120px]">
                      {user.displayName}
                    </span>
                    <button
                      onClick={() => {
                        setNameInput(user.displayName);
                        setIsEditing(true);
                      }}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Đổi tên của bạn"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {userStats.streak > 0 ? `Chuỗi ${userStats.streak}` : "0 Chuỗi"}
                  </span>
                  <span>•</span>
                  <span className={`${rankColor} font-semibold`}>
                    {rankTitle}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* AI Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
      />
    </header>
  );
}

