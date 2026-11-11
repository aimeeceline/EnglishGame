"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import { getRealLeaderboard, LeaderboardUser } from "@/lib/firebase/leaderboard";
import { Trophy, Swords, Medal, Flame, Zap, ArrowLeft, Crown, Loader2, Sparkles } from "lucide-react";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getRealLeaderboard();
      setUsers(data);
      setLoading(false);
    })();
  }, []);

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
              Thứ hạng thực tế dựa trên điểm đối kháng và chuỗi thắng qua các trận đấu
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

        {/* Loading State */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-500">Đang tải bảng xếp hạng trực tiếp...</p>
          </div>
        ) : users.length === 0 ? (
          /* Empty State khi chưa có trận đấu nào */
          <div className="p-12 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl shadow-xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Chưa Có Người Chơi Nào Trên Bảng Xếp Hạng</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Dữ liệu bảng xếp hạng được cập nhật tự động sau mỗi trận đối kháng 1v1 thực tế. Hãy tạo phòng và so tài ngay để là người đầu tiên ghi danh lên bảng vàng!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:opacity-95 transition"
            >
              <Swords className="w-4 h-4" />
              Tạo Phòng Thi Đấu Đầu Tiên
            </button>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {users.slice(0, 3).map((user) => {
                const isFirst = user.rank === 1;
                const isSecond = user.rank === 2;

                return (
                  <div
                    key={user.uid}
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

                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${user.avatarColor || "from-blue-600 to-sky-500"} flex items-center justify-center text-2xl font-black text-white shadow-md my-2`}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-1 truncate max-w-[200px]">{user.displayName}</h3>
                    
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
                Chi Tiết Bảng Điểm Cao Thủ ({users.length} người chơi)
              </div>

              <div className="divide-y divide-slate-100">
                {users.map((user) => (
                  <div
                    key={user.uid}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition gap-4"
                  >
                    {/* Rank & User */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 text-center font-black font-mono text-sm ${
                        user.rank === 1 ? "text-amber-500 text-base" : user.rank === 2 ? "text-slate-500" : user.rank === 3 ? "text-amber-600" : "text-slate-400"
                      }`}>
                        #{user.rank}
                      </span>

                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${user.avatarColor || "from-blue-600 to-sky-500"} flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs`}>
                        {user.displayName.charAt(0).toUpperCase()}
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
          </>
        )}

      </main>

      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
