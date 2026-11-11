import { GoogleGenerativeAI } from "@google/generative-ai";
import { BattleQuestion, BattleGameMode } from "@/types/battle";
import { FlashcardItem } from "@/types/vocab";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Sinh bộ câu hỏi thi đấu đối kháng 1v1 từ danh sách từ vựng bằng Gemini
 * Hỗ trợ các chế độ:
 * - 'mixed': Hỗn hợp trắc nghiệm 4 lựa chọn và gõ từ vào chỗ trống
 * - 'multiple_choice': Chỉ trắc nghiệm 4 lựa chọn
 * - 'fill_in_blank': Chỉ gõ từ vào chỗ trống
 */
export async function generateBattleQuestions(
  cards: FlashcardItem[],
  totalQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  gameMode: BattleGameMode = 'mixed'
): Promise<BattleQuestion[]> {
  const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
  const selectedCards = shuffledCards.slice(0, Math.min(totalQuestions, cards.length));

  if (!genAI || !apiKey) {
    console.warn("Chưa cấu hình GEMINI_API_KEY. Sử dụng bộ câu hỏi thông minh có ngữ cảnh thực tế.");
    return generateFallbackQuestions(selectedCards, gameMode);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const modeRequirement = gameMode === 'fill_in_blank'
      ? `TẤT CẢ các câu hỏi BẮT BUỘC có type: "fill_in_blank". Prompt là câu tiếng Anh chứa '________' khuyết từ vựng targetWord. options là mảng rỗng []. correctAnswer BẮT BUỘC là từ targetWord cần điền (dạng text, ví dụ "resilience"). hint là gợi ý tiếng Việt và chữ cái đầu.`
      : gameMode === 'multiple_choice'
      ? `TẤT CẢ các câu hỏi BẮT BUỘC có type: "multiple_choice". options gồm 4 lựa chọn A, B, C, D. correctAnswer là một trong các chữ cái "A", "B", "C", hoặc "D".`
      : `Hãy kết hợp xen kẽ cả 2 hình thức:
         - Khoảng 50% câu hỏi có type: "fill_in_blank" (Người chơi gõ từ vào chỗ trống '________', options: [], correctAnswer là targetWord).
         - Khoảng 50% câu hỏi có type: "multiple_choice" (Trắc nghiệm 4 lựa chọn A, B, C, D, correctAnswer là "A"|"B"|"C"|"D").`;

    const prompt = `
Bạn là chuyên gia thiết kế đề thi tiếng Anh đối kháng 1v1 nhanh và kịch tính.
Nhiệm vụ: Dựa vào danh sách từ vựng sau đây, hãy tạo chính xác ${selectedCards.length} câu hỏi tiếng Anh với độ khó ${difficulty}.

YÊU CẦU VỀ HÌNH THỨC CÂU HỎI:
${modeRequirement}

Danh sách từ vựng:
${JSON.stringify(selectedCards.map(c => ({
  word: c.word,
  meaning: c.meaning,
  pos: c.partOfSpeech || "",
  example: c.exampleSentence || ""
})), null, 2)}

Yêu cầu định dạng đầu ra:
Trả về DUY NHẤT một mảng JSON với cấu trúc chuẩn:
[
  {
    "id": "q_1",
    "questionNumber": 1,
    "type": "fill_in_blank",
    "prompt": "She showed great ________ in overcoming all the difficulties.",
    "targetWord": "resilience",
    "hint": "Bắt đầu bằng chữ 'r', nghĩa là sự kiên cường",
    "options": [],
    "correctAnswer": "resilience",
    "explanation": "Từ cần điền là 'resilience' (sự kiên cường). Dịch câu: Cô ấy đã thể hiện sự kiên cường vượt bậc khi vượt qua mọi khó khăn."
  },
  {
    "id": "q_2",
    "questionNumber": 2,
    "type": "multiple_choice",
    "prompt": "What does the word 'abandon' mean in: 'They had to abandon the plan'?",
    "targetWord": "abandon",
    "hint": "",
    "options": [
      { "key": "A", "text": "từ bỏ, hủy bỏ" },
      { "key": "B", "text": "tiếp tục thực hiện" },
      { "key": "C", "text": "tài trợ thêm tiền" },
      { "key": "D", "text": "thay đổi địa điểm" }
    ],
    "correctAnswer": "A",
    "explanation": "'abandon' có nghĩa là từ bỏ hoặc ngừng làm gì đó."
  }
]
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as BattleQuestion[];

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q, idx) => ({
        ...q,
        id: q.id || `q_gemini_${idx + 1}`,
        questionNumber: idx + 1,
        type: q.type || (q.options && q.options.length > 0 ? 'multiple_choice' : 'fill_in_blank'),
      }));
    }
    return generateFallbackQuestions(selectedCards, gameMode);
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    return generateFallbackQuestions(selectedCards, gameMode);
  }
}

/**
 * Bộ sinh câu hỏi dự phòng thông minh (Contextual Fallback Generator)
 * Tự động tạo câu hỏi Điền từ vào chỗ trống (Fill-in-the-blank) và Trắc nghiệm (Multiple Choice)
 */
export function generateFallbackQuestions(
  cards: FlashcardItem[],
  gameMode: BattleGameMode = 'mixed'
): BattleQuestion[] {
  return cards.map((card, idx) => {
    // Xác định loại câu hỏi theo gameMode
    const shouldBeFillInBlank = 
      gameMode === 'fill_in_blank' 
        ? true 
        : gameMode === 'multiple_choice' 
        ? false 
        : idx % 2 === 0; // 'mixed': xen kẽ chẵn là điền từ, lẻ là trắc nghiệm

    if (shouldBeFillInBlank) {
      // Dạng câu hỏi: GÕ TỪ VÀO CHỖ TRỐNG (fill_in_blank)
      const hasSentence = Boolean(card.exampleSentence && card.exampleSentence.toLowerCase().includes(card.word.toLowerCase()));
      
      let sentenceWithBlank = `Complete the sentence with the correct word meaning "${card.meaning}": [ ________ ]`;
      if (hasSentence && card.exampleSentence) {
        const regex = new RegExp(`\\b${card.word}\\b`, "i");
        sentenceWithBlank = card.exampleSentence.replace(regex, "________");
      }

      const firstChar = card.word.charAt(0).toUpperCase();
      const wordLength = card.word.length;
      const hint = `Bắt đầu bằng '${firstChar}', gồm ${wordLength} ký tự (${card.meaning})`;

      return {
        id: `q_fallback_${idx + 1}`,
        questionNumber: idx + 1,
        type: 'fill_in_blank',
        prompt: `Điền từ vựng thích hợp vào chỗ trống:\n"${sentenceWithBlank}"`,
        targetWord: card.word,
        options: [],
        correctAnswer: card.word,
        hint,
        explanation: `"${card.word}" (${card.meaning}) là đáp án chính xác. ${card.exampleSentence ? `Câu hoàn chỉnh: "${card.exampleSentence}".` : ''}`,
      };
    }

    // Dạng câu hỏi: TRẮC NGHIỆM 4 LỰA CHỌN (multiple_choice)
    const isContextualSentence = Boolean(card.exampleSentence && card.exampleSentence.toLowerCase().includes(card.word.toLowerCase()));

    if (isContextualSentence && card.exampleSentence) {
      const regex = new RegExp(`\\b${card.word}\\b`, "i");
      const blankedSentence = card.exampleSentence.replace(regex, "________");

      const otherEnglishWords = cards
        .filter(c => c.id !== card.id)
        .map(c => c.word);

      const defaultEnglishDistractors = ["implement", "persuade", "accommodate", "savor", "empathy", "preserve", "innovate"];
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
        type: 'multiple_choice',
        prompt: `Complete the sentence: "${blankedSentence}"`,
        targetWord: card.word,
        options: optionsPool.map((text, i) => ({
          key: keys[i],
          text,
        })),
        correctAnswer: keys[correctIdx],
        hint: `Nghĩa tiếng Việt: ${card.meaning}`,
        explanation: `"${card.word}" (${card.meaning}) là từ chính xác nhất để hoàn thành câu. Câu hoàn chỉnh: "${card.exampleSentence}".`,
      };
    }

    // Trắc nghiệm chọn nghĩa tiếng Việt
    const otherMeanings = cards
      .filter(c => c.id !== card.id)
      .map(c => c.meaning);

    const defaultMeanings = ["kiên trì", "bảo tồn", "thương lượng", "lên men", "nghi ngờ", "phát triển", "thách thức"];
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
      type: 'multiple_choice',
      prompt,
      targetWord: card.word,
      options: optionsPool.map((text, i) => ({
        key: keys[i],
        text,
      })),
      correctAnswer: keys[correctIdx],
      hint: `Từ loại: ${card.partOfSpeech || 'từ vựng'}`,
      explanation: `"${card.word}" có nghĩa là "${card.meaning}". ${card.exampleSentence ? `Ví dụ: "${card.exampleSentence}"` : ''}`,
    };
  });
}
