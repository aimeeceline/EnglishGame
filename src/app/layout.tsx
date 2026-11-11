import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngDuel 1v1 - Đấu Trường Từ Vựng Tiếng Anh Realtime",
  description: "Web thi đấu đối kháng trắc nghiệm tiếng Anh 2 người trong 1 phòng, học từ vựng Flashcard và AI tạo câu hỏi từ Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-800 selection:bg-teal-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}

