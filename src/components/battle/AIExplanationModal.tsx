"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Brain, Lightbulb, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import { BattleQuestion } from "@/types/battle";

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: BattleQuestion | null;
  selectedAnswer: string | null;
}

interface AIAnalysisResult {
  analysis: string;
  grammarTip: string;
  examples: string[];
}

export default function AIExplanationModal({
  isOpen,
  onClose,
  question,
  selectedAnswer,
}: AIExplanationModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !question) return;

    (async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const userApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_user_api_key") : "";

        const res = await fetch("/api/ai/explain-mistake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionPrompt: question.prompt,
            targetWord: question.targetWord,
            selectedAnswer,
            correctAnswer: question.correctAnswer,
            options: question.options,
            userApiKey,
          }),
        });

        if (!res.ok) {
          throw new Error("Không thể kết nối với AI lúc này.");
        }

        const result = await res.json();
        setData(result);
      } catch (err: unknown) {
        setError((err as Error).message || "Lỗi phân tích AI");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, question, selectedAnswer]);

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Gemini AI Gia Sư 1-kèm-1
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Phân Tích Chi Tiết Câu Hỏi
            </h2>
          </div>
        </div>

        {/* Question Review Pill */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
            Từ vựng: <strong className="text-slate-900 font-mono">{question.targetWord}</strong>
          </span>
          <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-3">
            "{question.prompt}"
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              ✓ Đáp án đúng: {question.correctAnswer}
            </span>
            {selectedAnswer && selectedAnswer !== question.correctAnswer && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold">
                ✕ Bạn đã chọn: {selectedAnswer}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-600">
              AI đang phân tích ngữ pháp & bẫy câu hỏi...
            </p>
          </div>
        ) : error ? (
          <p className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
            ⚠️ {error}
          </p>
        ) : data ? (
          <div className="space-y-4">
            {/* Analysis */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Giải Thích Ngữ Cảnh & Lý Do Đúng/Sai:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {data.analysis}
              </p>
            </div>

            {/* Grammar Tip */}
            {data.grammarTip && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Mẹo Ghi Nhớ & Cấu Trúc Ngữ Pháp:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {data.grammarTip}
                </p>
              </div>
            )}

            {/* Example Sentences */}
            {data.examples && data.examples.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ví Dụ Sử Dụng Trong Giao Tiếp Thực Tế:
                </span>
                <div className="space-y-2">
                  {data.examples.map((ex, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed italic shadow-xs">
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
          >
            Đã Hiểu
          </button>
        </div>

      </div>
    </div>
  );
}

