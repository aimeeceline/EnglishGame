"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Swords, 
  KeyRound, 
  BookOpen, 
  Sparkles, 
  FileSpreadsheet, 
  Trophy, 
  Users, 
  Zap, 
  ArrowRight, 
  History, 
  Flame, 
  Plus,
  Gamepad2,
  Target,
  GraduationCap,
  Briefcase,
  Check,
  Table,
  Loader2,
  Volume2,
  X
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import CreateRoomModal from "@/components/battle/CreateRoomModal";
import JoinRoomModal from "@/components/battle/JoinRoomModal";
import { getAllDecks } from "@/lib/firebase/decks";
import { findWaitingRoom, createBattleRoom } from "@/lib/firebase/rooms";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { useActiveBattle } from "@/hooks/useActiveBattle";
import { VocabDeck } from "@/types/vocab";

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
  const router = useRouter();
  const { user } = useUserIdentity();
  const { activeBattle, clearActiveBattle } = useActiveBattle();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedDeckForBattle, setSelectedDeckForBattle] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);
  const [decks, setDecks] = useState<VocabDeck[]>([]);
  const [isQuickMatching, setIsQuickMatching] = useState(false);

  // Thống kê thực tế từ Firebase & LocalStorage
  const [realStats, setRealStats] = useState({
    totalMatches: 0,
    winRate: 0,
    totalCards: 0,
  });

  // Demo Simulation Arena State
  const [simulatedAnswer, setSimulatedAnswer] = useState<string>("A");

  useEffect(() => {
    // 1. Nạp lịch sử thi đấu thực tế
    if (typeof window !== "undefined") {
      try {
        const rawHistory = localStorage.getItem("battle_history");
        if (rawHistory) {
          setHistory(JSON.parse(rawHistory));
        }

        const rawUserStats = localStorage.getItem("user_leaderboard_stats");
        if (rawUserStats && user.uid) {
          const parsed = JSON.parse(rawUserStats);
          if (parsed[user.uid]) {
            setRealStats(prev => ({
              ...prev,
              totalMatches: parsed[user.uid].totalMatches || 0,
              winRate: parsed[user.uid].winRate || 0,
            }));
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // 2. Nạp toàn bộ bộ thẻ thực tế từ Firebase
    (async () => {
      const allDecks = await getAllDecks();
      setDecks(allDecks);

      const totalVocab = allDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
      setRealStats(prev => ({
        ...prev,
        totalCards: totalVocab,
      }));
    })();
  }, [user.uid]);

  // Tìm trận nhanh (Quick Match) thực tế
  const handleQuickMatch = async () => {
    setIsQuickMatching(true);
    try {
      const waitingCode = await findWaitingRoom(user.uid);
      if (waitingCode) {
        router.push(`/battle/${waitingCode}`);
        return;
      }

      // Nếu chưa có ai mở phòng, mở modal tạo phòng hoặc tạo phòng nhanh nếu có sẵn deck
      if (decks.length > 0) {
        const roomCode = await createBattleRoom(
          { uid: user.uid, displayName: user.displayName, photoURL: "" },
          {
            deckId: decks[0].id,
            deckTitle: decks[0].title,
            totalQuestions: 10,
            timePerQuestion: 15,
            difficulty: "medium",
            gameMode: "mixed",
          }
        );
        router.push(`/battle/${roomCode}`);
      } else {
        setIsCreateOpen(true);
      }
    } catch (err) {
      console.warn("Lỗi tìm trận nhanh:", err);
      setIsCreateOpen(true);
    } finally {
      setIsQuickMatching(false);
    }
  };

  const handleOpenBattleForDeck = (deckId: string) => {
    setSelectedDeckForBattle(deckId);
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 hero-bg pb-20">
        
        {/* Top Stats Banner (Thống Kê Thực Tế 100%) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Stat 1: Trận Đã Đấu */}
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                <Gamepad2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trận Đã Đấu</p>
                <p className="text-xl font-extrabold text-slate-800">
                  {realStats.totalMatches}{" "}
                  <span className="text-xs text-emerald-600 font-semibold">
                    {history.length > 0 ? `(${history.length} gần đây)` : ""}
                  </span>
                </p>
              </div>
            </div>

            {/* Stat 2: Tỉ Lệ Thắng */}
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỉ Lệ Thắng</p>
                <p className="text-xl font-extrabold text-slate-800">
                  {realStats.totalMatches > 0 ? `${realStats.winRate}%` : "0%"}
                </p>
              </div>
            </div>

            {/* Stat 3: Tổng Thẻ Từ Vựng */}
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 p-4 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kho Từ Vựng</p>
                <p className="text-xl font-extrabold text-slate-800">
                  {realStats.totalCards} từ
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ACTIVE BATTLE IN-PROGRESS BANNER */}
        {activeBattle && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white p-4 sm:p-5 rounded-3xl shadow-lg shadow-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-400/30 animate-in fade-in duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-inner">
                  <Swords className="w-6 h-6 text-white animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base">Trận Đấu Của Bạn Đang Diễn Ra!</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[10px] font-black uppercase tracking-wider animate-pulse shadow-xs">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Phòng đấu <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">#{activeBattle.roomCode}</span> ({activeBattle.deckTitle || "Đang đấu"}) vẫn đang chờ bạn so tài.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <Link
                  href={`/battle/${activeBattle.roomCode}`}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Quay Lại Trận Đấu</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={clearActiveBattle}
                  className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                  title="Bỏ qua trận này"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* HERO SECTION: MAIN ACTIONS 1V1 (Tạo Phòng / Vào PIN / Quick Matching) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-indigo-900/50">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <Flame className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-bounce" /> Chế độ Đấu Trực Tiếp Realtime
              </span>
              
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
                Thách Thức Bè Bạn <br className="hidden sm:block"/> Sát Thần Từ Vựng{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400">
                  Tiếng Anh 1v1
                </span>
              </h1>
              
              <p className="text-slate-300 text-base sm:text-lg mb-8 font-normal leading-relaxed max-w-2xl mx-auto">
                Cùng trả lời câu hỏi trắc nghiệm siêu tốc, cạnh tranh từng giây trên bảng điểm Realtime và nâng cao trình độ Vocabulary đỉnh cao!
              </p>

              {/* Main CTA Buttons Group */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                
                {/* Button Create Room */}
                <button
                  onClick={() => {
                    setSelectedDeckForBattle(undefined);
                    setIsCreateOpen(true);
                  }}
                  className="w-full sm:w-1/2 group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-glow-emerald hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
                  <Swords className="w-5 h-5" />
                  <span>Tạo Phòng Đấu 1v1</span>
                </button>

                {/* Button Join by PIN */}
                <button
                  onClick={() => setIsJoinOpen(true)}
                  className="w-full sm:w-1/2 group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-extrabold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <KeyRound className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform" />
                  <span>Vào Bằng Mã PIN</span>
                </button>

              </div>

              

            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHTS CARDS (3 Điểm đột phá) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Đồng Bộ 2 Bạn Cùng Lúc
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Cả 2 cùng trả lời chung một câu hỏi realtime. Thanh điểm số và trạng thái của đối thủ nhảy số tức thì sau từng miligiây.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600">
                <span>Thi đấu chuẩn PvP</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                Dán Google Sheet 1-Click
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Dán đường link bảng từ vựng Google Sheet bất kỳ, hệ thống tự động nhận diện cột và chuyển thành đề thi đấu cực mượt!
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600">
                <span>Tạo bộ thẻ tùy biến</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                AI Sinh Đề & Giải Thích Chi Tiết
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Google Gemini tự sinh 4 phương án A/B/C/D kịch tính và phân tích giải thích ngữ cảnh cặn kẽ ngay sau mỗi ván đấu.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600">
                <span>Trí tuệ nhân tạo hỗ trợ</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </section>

        {/* VOCABULARY DECKS LIBRARY (Kho Bộ Thẻ Từ Vựng - Dữ Liệu Thực Tế) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Kho Bộ Thẻ Từ Vựng</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  {decks.length} Bộ Thẻ
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/decks"
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" /> Thêm Bộ Thẻ Mới
              </Link>
              <Link
                href="/decks"
                className="text-sm font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:gap-2 transition-all"
              >
                Quản lý kho thẻ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Grid of Cards (Thực Tế 100%) */}
          {decks.length === 0 ? (
            /* Empty State khi chưa có bộ thẻ nào */
            <div className="p-10 rounded-3xl bg-white border-2 border-dashed border-slate-200 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-3">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Chưa Có Bộ Từ Vựng Nào Trong Kho</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                Hãy dán link Google Sheet để hệ thống tự động nhận diện từ vựng, hoặc tạo bộ thẻ mới để bắt đầu học Flashcard 3D và thi đấu 1v1!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/decks"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:opacity-95 transition"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Nhập Google Sheet / Tạo Bộ Thẻ
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                        deck.sourceType === "google_sheet"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}>
                        {deck.sourceType === "google_sheet" ? (
                          <>
                            <Table className="w-3.5 h-3.5 text-emerald-600" /> Google Sheet
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> {deck.category || "Vocabulary"}
                          </>
                        )}
                      </span>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {deck.cards.length} thẻ từ vựng
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 line-clamp-2">
                      {deck.description || "Bộ từ vựng tiếng Anh phục vụ ôn thi và giao tiếp."}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="space-y-1.5 mb-6">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Số lượng từ vựng</span>
                        <span className="text-emerald-600 font-bold">{deck.cards.length} từ</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(15, deck.cards.length * 3))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleOpenBattleForDeck(deck.id)}
                      className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Swords className="w-3.5 h-3.5" /> Đấu 1v1 Bộ Này
                    </button>
                    <Link
                      href={`/decks/${deck.id}/study`}
                      className="w-full py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Luyện Thẻ
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

       

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center text-white font-bold text-xs">
              <Swords className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-800">EngDuel 1v1</span>
            <span className="text-xs text-slate-400">© 2026 Powered by Google Gemini AI</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-500 font-medium">
            <Link href="/decks" className="hover:text-slate-900 transition">
              Hướng dẫn dán Sheet
            </Link>
            <Link href="/leaderboard" className="hover:text-slate-900 transition">
              Bảng Xếp Hạng
            </Link>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateRoomModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        initialDeckId={selectedDeckForBattle}
      />
      <JoinRoomModal 
        isOpen={isJoinOpen} 
        onClose={() => setIsJoinOpen(false)} 
      />
    </div>
  );
}
