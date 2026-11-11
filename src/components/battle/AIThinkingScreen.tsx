"use client";

import { Sparkles, Brain, Swords, Loader2 } from "lucide-react";

interface AIThinkingScreenProps {
  deckTitle: string;
}

export default function AIThinkingScreen({ deckTitle }: AIThinkingScreenProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        {/* Glowing Background Rings */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 rounded-full blur-xl opacity-30 animate-pulse" />
        
        <div className="relative w-28 h-28 rounded-3xl bg-white border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Brain className="w-14 h-14 text-blue-600 animate-bounce" />
          <div className="absolute -top-2 -right-2 p-2 rounded-xl bg-emerald-500 text-white shadow-md">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
        AI Đang Soạn Đề Đấu Trường...
      </h2>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        Google Gemini đang phân tích các từ vựng trong bộ <span className="text-blue-600 font-bold font-mono">"{deckTitle}"</span> để tạo các câu hỏi trắc nghiệm đối kháng công bằng nhất cho 2 bạn.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-blue-700 font-semibold shadow-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
        Sẵn sàng trong 3-5 giây...
      </div>
    </div>
  );
}

