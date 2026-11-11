"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Swords, KeyRound, BookOpen, Sparkles, FileSpreadsheet, Trophy, Users, Zap, ArrowRight, History, Flame } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import JoinRoomModal from "@/components/battle/JoinRoomModal";
import { DEFAULT_DECKS } from "@/lib/mockData";

interface BattleHistoryItem {
  roomCode: string;
  deckTitle: string;
  myScore: number;
  opponentName: string;
  opponentScore: number;
  isWinner: boolean;
  isDraw: boolean;
  date: number;
}

export default function HomePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("battle_history");
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 w-full flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Phiên Bản Đấu Trường Realtime 1v1 Tốc Độ Cao</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl text-slate-900 leading-tight">
          Thách Đấu Tiếng Anh{" "}
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
            1v1 Trong 1 Phòng
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
          Tạo phòng đấu tức thì qua <strong className="text-blue-600 font-semibold">mã PIN</strong>, chọn bộ từ vựng cá nhân hoặc <strong className="text-emerald-600 font-semibold">dán Google Sheet</strong>. AI của Google sẽ tự động sinh đề trắc nghiệm tốc độ cho 2 bạn so tài!
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Swords className="w-5 h-5" />
            Tạo Phòng Đấu 1v1
          </button>

          <button
            onClick={() => setIsJoinOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 font-bold text-base shadow-xs hover:shadow-md flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Vào Bằng Mã PIN
          </button>
        </div>

        {/* Quick Features Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 w-full text-left">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition group">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3.5 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Đồng Bộ 2 Bạn Cùng Lúc</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Cả 2 cùng trả lời chung một câu hỏi realtime. Thanh điểm và trạng thái của đối thủ nhảy số ngay lập tức.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 transition group">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3.5 group-hover:scale-110 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Dán Google Sheet 1-Click</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Dán đường link bảng từ vựng Google Sheet bất kỳ, hệ thống tự động nhận diện cột và chuyển thành đề thi đấu!
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-400 transition group">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-3.5 group-hover:scale-110 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">AI Sinh Đề & Giải Thích Chi Tiết</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Google Gemini tự sinh 4 phương án A/B/C/D kịch tính và phân tích giải thích ngữ cảnh cặn kẽ sau mỗi ván.
            </p>
          </div>

        </div>

        {/* Pre-built Decks Showcase */}
        <div className="mt-16 w-full text-left">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Kho Từ Vựng Sẵn Có</h2>
              <p className="text-xs text-slate-500">Chọn nhanh bộ từ để học Flashcard hoặc thách đấu ngay</p>
            </div>
            <Link
              href="/decks"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEFAULT_DECKS.map((deck) => (
              <div
                key={deck.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {deck.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {deck.cards.length} thẻ từ vựng
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{deck.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deck.description}</p>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Đấu 1v1 Bộ Này
                  </button>
                  <Link
                    href={`/decks/${deck.id}/study`}
                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Luyện Thẻ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Battle History Section (If any) */}
        {history.length > 0 && (
          <div className="mt-16 w-full text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Lịch Sử Thi Đấu Gần Đây</h2>
              </div>
              <Link
                href="/leaderboard"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Xem Bảng Xếp Hạng 🏆
              </Link>
            </div>

            <div className="space-y-2.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      item.isWinner
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : item.isDraw
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}>
                      {item.isWinner ? "THẮNG" : item.isDraw ? "HÒA" : "THUA"}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{item.deckTitle}</h4>
                      <p className="text-xs text-slate-500">
                        Đối thủ: <strong className="text-blue-600">{item.opponentName}</strong> • Phòng <span className="font-mono font-bold text-slate-700">{item.roomCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-sm sm:text-base text-blue-600">
                      {item.myScore} <span className="text-slate-400 font-sans text-xs">vs</span> {item.opponentScore}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}

