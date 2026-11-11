import { NextRequest, NextResponse } from "next/server";
import { generateBattleQuestions } from "@/lib/ai/gemini";
import { FlashcardItem } from "@/types/vocab";
import { BattleGameMode } from "@/types/battle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cards, totalQuestions, difficulty, gameMode } = body as {
      cards: FlashcardItem[];
      totalQuestions?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      gameMode?: BattleGameMode;
    };

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "Danh sách từ vựng không được để trống" },
        { status: 400 }
      );
    }

    const questions = await generateBattleQuestions(
      cards,
      totalQuestions || 5,
      difficulty || 'medium',
      gameMode || 'mixed'
    );

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: unknown) {
    console.error("Lỗi API generate-battle:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Lỗi khi sinh câu hỏi từ AI" },
      { status: 500 }
    );
  }
}

