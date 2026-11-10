import Link from "next/link";
import { Swords, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
        <Swords className="w-8 h-8" />
      </div>

      <h1 className="text-4xl sm:text-6xl font-black text-white mb-2">404</h1>
      <h2 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">
        Không Tìm Thấy Trang Hoặc Mã Phòng Này
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        Phòng đấu có thể đã kết thúc hoặc đường link không chính xác. Hãy quay về sảnh chính để tạo hoặc nhập mã phòng mới.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition hover:scale-105"
      >
        <Home className="w-4 h-4" />
        Về Sảnh Đấu Chính
      </Link>
    </div>
  );
}

