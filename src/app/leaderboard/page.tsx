"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import { Trophy, Swords, Medal, Flame, Zap, ArrowLeft, Crown } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  displayName: string;
  avatarColor: string;
  totalWins: number;
  totalMatches: number;
  winRate: number;
  streak: number;
  score: number;
}

const MOCK_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    displayName: "Cú Mèo Siêu Cấp",
    avatarColor: "from-amber-500 to-yellow-600",
    totalWins: 42,
    totalMatches: 48,
    winRate: 87.5,
    streak: 9,
    score: 52400,
  },
  {
    rank: 2,
    displayName: "Gấu Trúc Sát Thủ",
    avatarColor: "from-slate-600 to-slate-800",
    totalWins: 38,
    totalMatches: 45,
    winRate: 84.4,
    streak: 6,
    score: 46850,
  },
  {
    rank: 3,
    displayName: "Cáo Lanh Lợi",
    avatarColor: "from-orange-500 to-amber-600",
    totalWins: 31,
    totalMatches: 40,
    winRate: 77.5,
    streak: 4,
    score: 38900,
  },
  {
    rank: 4,
    displayName: "Hổ Dũng Mãnh",
    avatarColor: "from-rose-500 to-red-600",
    totalWins: 27,
    totalMatches: 36,
    winRate: 75.0,
    streak: 3,
    score: 33400,
  },
  {
    rank: 5,
    displayName: "Cá Heo Thông Thái",
    avatarColor: "from-cyan-500 to-blue-600",
    totalWins: 22,
    totalMatches: 30,
    winRate: 73.3,
    streak: 2,
    score: 28100,
  },
  {
    rank: 6,
    displayName: "Sói Cô Độc",
    avatarColor: "from-purple-500 to-indigo-600",
    totalWins: 19,
    totalMatches: 28,
    winRate: 67.8,
    streak: 1,
    score: 24600,
  },
];

export default function LeaderboardPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Sảnh Đấu
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-500" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Bảng Xếp Hạng Cao Thủ 1v1
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top người chơi có chuỗi thắng và tổng điểm đối kháng cao nhất
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition active:scale-95 self-start sm:self-auto"
          >
            <Swords className="w-4 h-4" />
            Tạo Phòng Leo Rank
          </button>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {MOCK_LEADERBOARD.slice(0, 3).map((user) => {
            const isFirst = user.rank === 1;
            const isSecond = user.rank === 2;

            return (
              <div
                key={user.rank}
                className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center relative shadow-xs transition ${
                  isFirst
                    ? "bg-white border-amber-400 shadow-md md:-translate-y-2"
                    : isSecond
                      ? "bg-white border-slate-300"
                      : "bg-white border-amber-200"
                }`}
              >
                {/* Crown badge */}
                <div className={`absolute -top-3.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-sm ${
                  isFirst
                    ? "bg-amber-400 text-amber-950 font-black"
                    : isSecond
                      ? "bg-slate-200 text-slate-800 font-bold"
                      : "bg-amber-100 text-amber-900 font-bold border border-amber-300"
                }`}>
                  {isFirst && <Crown className="w-3 h-3 fill-amber-950" />}
                  Top {user.rank}
                </div>

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-2xl font-black text-white shadow-md my-2`}>
                  {user.displayName.charAt(0)}
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-1">{user.displayName}</h3>
                
                <div className="text-2xl font-black text-blue-600 font-mono my-1.5">
                  {user.score.toLocaleString()} <span className="text-xs text-slate-400 font-sans">XP</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 pt-3 border-t border-slate-100 w-full justify-center">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Trophy className="w-3.5 h-3.5" /> {user.totalWins} thắng
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Chuỗi {user.streak}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Ranking Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-500">
            Chi Tiết Bảng Điểm Cao Thủ
          </div>

          <div className="divide-y divide-slate-100">
            {MOCK_LEADERBOARD.map((user) => (
              <div
                key={user.rank}
                className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition gap-4"
              >
                {/* Rank & User */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 text-center font-black font-mono text-sm ${
                    user.rank === 1 ? "text-amber-500 text-base" : user.rank === 2 ? "text-slate-500" : user.rank === 3 ? "text-amber-600" : "text-slate-400"
                  }`}>
                    #{user.rank}
                  </span>

                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs`}>
                    {user.displayName.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 truncate block">
                      {user.displayName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tỉ lệ thắng: <strong className="text-emerald-600">{user.winRate}%</strong> ({user.totalWins}/{user.totalMatches})
                    </span>
                  </div>
                </div>

                {/* Score & Streak */}
                <div className="text-right shrink-0">
                  <div className="font-black text-blue-600 font-mono text-sm sm:text-base">
                    {user.score.toLocaleString()} XP
                  </div>
                  {user.streak > 1 && (
                    <div className="text-[11px] text-amber-600 font-semibold flex items-center justify-end gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Chuỗi x{user.streak}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}

