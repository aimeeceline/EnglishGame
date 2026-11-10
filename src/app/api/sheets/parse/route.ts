import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetCsvUrl, parseVocabCsv } from "@/lib/sheets/parser";

export async function POST(req: NextRequest) {
  try {
    const { sheetUrl } = await req.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đường liên kết Google Sheet" },
        { status: 400 }
      );
    }

    const csvUrl = getGoogleSheetCsvUrl(sheetUrl);
    if (!csvUrl) {
      return NextResponse.json(
        { error: "Định dạng liên kết Google Sheet không hợp lệ" },
        { status: 400 }
      );
    }

    // Server-side fetch (Không bị giới hạn bởi CORS trình duyệt)
    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "EngDuel-1v1/1.0",
      },
      next: { revalidate: 60 }, // Cache 60 giây
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Không thể đọc bảng tính. Hãy kiểm tra bạn đã bật quyền 'Bất kỳ ai có đường liên kết đều có thể xem' trên Google Drive!",
        },
        { status: 403 }
      );
    }

    const csvText = await response.text();
    const cards = parseVocabCsv(csvText);

    if (cards.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy từ vựng nào trong bảng tính. Hãy đảm bảo bảng có các cột như Word, Meaning!",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      cardCount: cards.length,
      cards,
    });
  } catch (error: unknown) {
    console.error("Lỗi parse Google Sheet:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Lỗi xử lý bảng tính Google Sheet" },
      { status: 500 }
    );
  }
}

