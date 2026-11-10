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
    <header className="border-b border-indigo-950/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                EngDuel
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                1v1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Đấu Trường Trắc Nghiệm Realtime & Flashcard AI</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Swords className="w-4 h-4 text-indigo-400" />
            Đấu Trường 1v1
          </Link>
          <Link
            href="/decks"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Flashcard & Sheet
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <span className="text-amber-400">🏆</span>
            Xếp Hạng
          </Link>
        </nav>

        {/* Controls & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Gemini AI Key Button */}
          <button
            onClick={() => setIsApiKeyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/50 text-purple-300 hover:text-white text-xs font-semibold transition shadow-sm"
            title="Cài đặt Gemini AI API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Tag */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow`}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="bg-slate-800 text-xs px-2 py-1 rounded border border-indigo-500 text-white w-28 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 max-w-[110px] truncate">
                  {user.displayName}
                </span>
                <button
                  onClick={() => {
                    setNameInput(user.displayName);
                    setIsEditing(true);
                  }}
                  className="text-slate-500 hover:text-slate-300 transition"
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

