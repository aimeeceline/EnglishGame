import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngDuel 1v1 - Đấu Trường Trắc Nghiệm Tiếng Anh & Flashcard AI",
  description: "Web thi đấu đối kháng trắc nghiệm tiếng Anh 2 người trong 1 phòng, học từ vựng Flashcard và AI tạo câu hỏi từ Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}

