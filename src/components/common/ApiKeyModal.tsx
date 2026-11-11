"use client";

import { useState, useEffect } from "react";
import { Key, Sparkles, X, Check, ExternalLink, ShieldCheck } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gemini_user_api_key") || "";
      setApiKey(stored);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_user_api_key", apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gemini_user_api_key");
      setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Cấu hình Trí Tuệ Nhân Tạo
            </div>
            <h2 className="text-lg font-black text-slate-900">Google Gemini API Key</h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Nhập API Key miễn phí từ Google AI Studio để kích hoạt tính năng <strong className="text-blue-600">sinh câu hỏi ngữ cảnh thông minh</strong> và <strong className="text-emerald-600">gia sư phân tích lỗi sai 1-kèm-1</strong>.
        </p>

        {/* Input */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-slate-600 block">
            API Key cá nhân (Lưu an toàn trong trình duyệt của bạn)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono"
          />
        </div>

        {/* Security badge & Link to get key */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 underline underline-offset-2"
            >
              Lấy key miễn phí tại Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Nếu để trống, hệ thống sẽ tự động dùng bộ câu hỏi ngữ cảnh dự phòng thông minh không giới hạn!</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          {apiKey && (
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
            >
              Xóa Key
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition flex items-center gap-1.5"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Đã Lưu!
              </>
            ) : (
              "Lưu Cấu Hình"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

