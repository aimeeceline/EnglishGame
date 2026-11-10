import { GoogleGenerativeAI } from "@google/generative-ai";
import { BattleQuestion } from "@/types/battle";
import { FlashcardItem } from "@/types/vocab";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Sinh bộ câu hỏi thi đấu đối kháng 1v1 từ danh sách từ vựng bằng Gemini
 */
export async function generateBattleQuestions(
  cards: FlashcardItem[],
  totalQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<BattleQuestion[]> {
  const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
  const selectedCards = shuffledCards.slice(0, Math.min(totalQuestions, cards.length));

  if (!genAI || !apiKey) {
    console.warn("Chưa cấu hình GEMINI_API_KEY. Sử dụng bộ câu hỏi thông minh có ngữ cảnh thực tế.");
    return generateFallbackQuestions(selectedCards);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const prompt = `
Bạn là chuyên gia thiết kế đề thi trắc nghiệm tiếng Anh đối kháng 1v1 nhanh và kịch tính.
Nhiệm vụ: Dựa vào danh sách từ vựng sau đây, hãy tạo chính xác ${selectedCards.length} câu hỏi trắc nghiệm tiếng Anh 4 lựa chọn (A, B, C, D) với độ khó ${difficulty}.

Danh sách từ vựng:
${JSON.stringify(selectedCards.map(c => ({
  word: c.word,
  meaning: c.meaning,
  pos: c.partOfSpeech || "",
  example: c.exampleSentence || ""
})), null, 2)}

Yêu cầu định dạng đầu ra:
Đa dạng các dạng câu hỏi:
- Dạng 1: Điền từ vào chỗ trống trong câu ngữ cảnh (Sentence completion: "... ______ ...")
- Dạng 2: Chọn từ đồng nghĩa hoặc định nghĩa phù hợp nhất
- Dạng 3: Chọn nghĩa tiếng Việt chính xác trong ngữ cảnh câu

Trả về duy nhất một mảng JSON với cấu trúc:
[
  {
    "id": "q_1",
    "questionNumber": 1,
    "prompt": "Nội dung câu hỏi tiếng Anh",
    "targetWord": "từ vựng được kiểm tra",
    "options": [
      { "key": "A", "text": "Lựa chọn A" },
      { "key": "B", "text": "Lựa chọn B" },
      { "key": "C", "text": "Lựa chọn C" },
      { "key": "D", "text": "Lựa chọn D" }
    ],
    "correctAnswer": "A",
    "explanation": "Giải thích chi tiết bằng tiếng Việt vì sao đáp án này đúng và dịch nghĩa câu"
  }
]
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as BattleQuestion[];

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return generateFallbackQuestions(selectedCards);
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    return generateFallbackQuestions(selectedCards);
  }
}

/**
 * Bộ sinh câu hỏi dự phòng thông minh (Contextual Fallback Generator)
 * Hỗ trợ tạo cả câu hỏi Điền từ vào chỗ trống (Fill-in-the-blank) và Chọn nghĩa ngữ cảnh
 */
export function generateFallbackQuestions(cards: FlashcardItem[]): BattleQuestion[] {
  return cards.map((card, idx) => {
    const isFillInTheBlank = Boolean(card.exampleSentence && card.exampleSentence.toLowerCase().includes(card.word.toLowerCase()));

    // Dạng câu hỏi 1: Điền từ vào câu ví dụ (Fill-in-the-blank)
    if (isFillInTheBlank && card.exampleSentence) {
      const regex = new RegExp(`\\b${card.word}\\b`, "i");
      const blankedSentence = card.exampleSentence.replace(regex, "________");

      const otherEnglishWords = cards
        .filter(c => c.id !== card.id)
        .map(c => c.word);

      const defaultEnglishDistractors = ["implement", "persuade", "accommodate", "savor", "empathy", "preserve"];
      while (otherEnglishWords.length < 3) {
        const extra = defaultEnglishDistractors[Math.floor(Math.random() * defaultEnglishDistractors.length)];
        if (!otherEnglishWords.includes(extra) && extra.toLowerCase() !== card.word.toLowerCase()) {
          otherEnglishWords.push(extra);
        }
      }

      const optionsPool = [card.word, ...otherEnglishWords.slice(0, 3)].sort(() => 0.5 - Math.random());
      const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const correctIdx = optionsPool.indexOf(card.word);

      return {
        id: `q_fallback_${idx + 1}`,
        questionNumber: idx + 1,
        prompt: `Complete the sentence: "${blankedSentence}"`,
        targetWord: card.word,
        options: optionsPool.map((text, i) => ({
          key: keys[i],
          text,
        })),
        correctAnswer: keys[correctIdx],
        explanation: `"${card.word}" (${card.meaning}) là từ chính xác nhất để hoàn thành câu. Câu hoàn chỉnh: "${card.exampleSentence}".`,
      };
    }

    // Dạng câu hỏi 2: Chọn nghĩa tiếng Việt trong ngữ cảnh
    const otherMeanings = cards
      .filter(c => c.id !== card.id)
      .map(c => c.meaning);

    const defaultMeanings = ["kiên trì", "bảo tồn", "thương lượng", "lên men", "nghi ngờ", "phát triển"];
    while (otherMeanings.length < 3) {
      const extra = defaultMeanings[Math.floor(Math.random() * defaultMeanings.length)];
      if (!otherMeanings.includes(extra) && extra !== card.meaning) {
        otherMeanings.push(extra);
      }
    }

    const optionsPool = [card.meaning, ...otherMeanings.slice(0, 3)].sort(() => 0.5 - Math.random());
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const correctIdx = optionsPool.indexOf(card.meaning);

    const prompt = card.exampleSentence
      ? `What does the word "${card.word}" mean in: "${card.exampleSentence}"?`
      : `What is the correct Vietnamese meaning of the word "${card.word}"?`;

    return {
      id: `q_fallback_${idx + 1}`,
      questionNumber: idx + 1,
      prompt,
      targetWord: card.word,
      options: optionsPool.map((text, i) => ({
        key: keys[i],
        text,
      })),
      correctAnswer: keys[correctIdx],
      explanation: `"${card.word}" có nghĩa là "${card.meaning}". ${card.exampleSentence ? `Ví dụ: "${card.exampleSentence}"` : ''}`,
    };
  });
}
