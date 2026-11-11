import Link from "next/link";
import { Swords, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
        <Swords className="w-8 h-8" />
      </div>

      <h1 className="text-4xl sm:text-6xl font-black text-slate-900 mb-2">404</h1>
      <h2 className="text-lg sm:text-xl font-bold text-slate-700 mb-2">
        Không Tìm Thấy Trang Hoặc Mã Phòng Này
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        Phòng đấu có thể đã kết thúc hoặc đường link không chính xác. Hãy quay về sảnh chính để tạo hoặc nhập mã phòng mới.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-95"
      >
        <Home className="w-4 h-4" />
        Về Sảnh Đấu Chính
      </Link>
    </div>
  );
}

