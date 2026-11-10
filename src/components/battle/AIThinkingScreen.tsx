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
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
        
        <div className="relative w-28 h-28 rounded-3xl bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-2xl">
          <Brain className="w-14 h-14 text-indigo-400 animate-bounce" />
          <div className="absolute -top-2 -right-2 p-2 rounded-xl bg-pink-600 text-white shadow-lg animate-spin">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
        AI Đang Soạn Đề Đấu Trường...
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        Google Gemini đang phân tích các từ vựng trong bộ <span className="text-pink-400 font-semibold font-mono">"{deckTitle}"</span> để tạo các câu hỏi trắc nghiệm đối kháng công bằng nhất cho 2 bạn.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-semibold shadow">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
        Sẵn sàng trong 3-5 giây...
      </div>
    </div>
  );
}

