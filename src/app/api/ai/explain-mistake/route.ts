import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { questionPrompt, targetWord, selectedAnswer, correctAnswer, options, userApiKey } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      // Phân tích dự phòng thông minh khi chưa có API Key
      return NextResponse.json({
        analysis: `Từ vựng "${targetWord}" là đáp án chính xác (${correctAnswer}). Phương án ${selectedAnswer || "bạn chọn"} chưa phù hợp với ngữ cảnh ngữ pháp hoặc cấu trúc cụm từ (collocation) trong câu.`,
        grammarTip: `Hãy chú ý đến từ loại (Danh từ / Động từ / Tính từ) đứng trước và sau chỗ trống để xác định dạng từ phù hợp nhất.`,
        examples: [
          `Ví dụ 1: Please pay attention to how "${targetWord}" is naturally used by native speakers.`,
          `Ví dụ 2: Practice makes perfect when memorizing "${targetWord}".`
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const prompt = `
Bạn là giáo viên bản ngữ chuyên luyện thi TOEIC/IELTS cho học sinh Việt Nam.
Một học sinh vừa làm sai câu hỏi trắc nghiệm tiếng Anh sau:

Câu hỏi: "${questionPrompt}"
Từ vựng trọng tâm: "${targetWord}"
Các phương án: ${JSON.stringify(options)}
Đáp án đúng: Phương án ${correctAnswer}
Phương án học sinh đã chọn: ${selectedAnswer ? `Phương án ${selectedAnswer}` : "Hết giờ (chưa chọn)"}

Hãy phân tích chi tiết bằng Tiếng Việt thân thiện, dễ hiểu, giúp học sinh ghi nhớ sâu sắc:
Trả về duy nhất JSON theo mẫu:
{
  "analysis": "Phân tích vì sao đáp án đúng là chính xác, giải nghĩa câu và chỉ ra vì sao phương án học sinh chọn lại sai (bẫy từ loại, bẫy đồng âm, hoặc sai ngữ cảnh)",
  "grammarTip": "Mẹo ngữ pháp hoặc cấu trúc collocation cần nhớ",
  "examples": [
    "Câu ví dụ thực tế 1 kèm dịch nghĩa tiếng Việt",
    "Câu ví dụ thực tế 2 kèm dịch nghĩa tiếng Việt"
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Lỗi AI explain-mistake:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Lỗi phân tích từ AI" },
      { status: 500 }
    );
  }
}

