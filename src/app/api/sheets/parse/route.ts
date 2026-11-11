import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetCsvUrl, getGoogleSheetGvizCsvUrl, parseVocabCsv } from "@/lib/sheets/parser";

export async function POST(req: NextRequest) {
  try {
    const { sheetUrl } = await req.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đường liên kết Google Sheet" },
        { status: 400 }
      );
    }

    const primaryCsvUrl = getGoogleSheetCsvUrl(sheetUrl);
    if (!primaryCsvUrl) {
      return NextResponse.json(
        { error: "Định dạng liên kết Google Sheet không hợp lệ. Hãy copy liên kết có dạng: https://docs.google.com/spreadsheets/d/..." },
        { status: 400 }
      );
    }

    let csvText = "";

    // Thử phương thức 1: Google Export CSV chuẩn
    try {
      const response = await fetch(primaryCsvUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const text = await response.text();
        if (!text.includes("<!DOCTYPE html") && !text.includes("<html")) {
          csvText = text;
        }
      }
    } catch {
      // Fallback
    }

    // Nếu phương thức 1 chưa lấy được CSV (do trang yêu cầu gviz), thử phương thức 2: gviz/tq
    if (!csvText) {
      const gvizUrl = getGoogleSheetGvizCsvUrl(sheetUrl);
      if (gvizUrl) {
        try {
          const gvizRes = await fetch(gvizUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            cache: "no-store",
          });

          if (gvizRes.ok) {
            const text = await gvizRes.text();
            if (!text.includes("<!DOCTYPE html") && !text.includes("<html")) {
              csvText = text;
            }
          }
        } catch {
          // Fallback
        }
      }
    }

    if (!csvText) {
      return NextResponse.json(
        {
          error:
            "Không thể đọc nội dung bảng tính. Hãy đảm bảo bạn đã mở Google Sheet, bấm nút 'Chia sẻ' (Share) và đổi quyền truy cập thành 'Bất kỳ ai có đường liên kết đều có thể xem' (Anyone with the link - Viewer)!",
        },
        { status: 403 }
      );
    }

    const cards = parseVocabCsv(csvText);

    if (cards.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy từ vựng nào trong bảng tính. Hãy đảm bảo bảng có các cột như Word, Meaning hoặc chứa dữ liệu từ vựng hợp lệ!",
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
