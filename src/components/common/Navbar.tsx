"use client";

import Link from "next/link";
import { useState } from "react";
import { Swords, BookOpen, Volume2, VolumeX, Edit3, Check, Sparkles } from "lucide-react";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import ApiKeyModal from "./ApiKeyModal";

export default function Navbar() {
  const { user, updateName } = useUserIdentity();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateName(nameInput);
      setIsEditing(false);
    }
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                EngDuel
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300/80">
                1v1
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Đấu Trường Trắc Nghiệm Realtime & Flashcard AI</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all"
          >
            <Swords className="w-4 h-4 text-blue-600" />
            Đấu Trường 1v1
          </Link>
          <Link
            href="/decks"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:bg-white hover:shadow-xs transition-all"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Flashcard & Sheet
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-amber-600 hover:bg-white hover:shadow-xs transition-all"
          >
            <span className="text-amber-500">🏆</span>
            Xếp Hạng
          </Link>
        </nav>

        {/* Controls & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Gemini AI Key Button */}
          <button
            onClick={() => setIsApiKeyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 text-emerald-700 text-xs font-semibold transition shadow-xs"
            title="Cài đặt Gemini AI API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-xs transition"
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* User Tag */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-xs`}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="bg-slate-50 text-xs px-2 py-1 rounded border border-blue-500 text-slate-800 w-28 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700 max-w-[110px] truncate">
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

