export type RoomStatus = 'waiting' | 'generating' | 'playing' | 'round_result' | 'finished';
export type QuestionType = 'multiple_choice' | 'fill_in_blank';
export type BattleGameMode = 'mixed' | 'multiple_choice' | 'fill_in_blank';

export interface PlayerAnswer {
  questionIndex: number;
  selectedKey: string | null;  // 'A' | 'B' | 'C' | 'D' hoặc từ gõ vào cho fill_in_blank
  answeredAt: number;        // Timestamp ms lúc bấm chọn
  timeRemainingSeconds: number;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface PlayerState {
  uid: string;
  displayName: string;
  photoURL?: string;
  isReady: boolean;
  score: number;
  currentStreak: number;
  currentAnswer: PlayerAnswer | null;
  answersHistory?: Record<number, PlayerAnswer>; // Lịch sử chọn đáp án của từng câu (index -> PlayerAnswer)
  totalCorrect: number;
  isOnline: boolean;
  lastPing: number;
}

export interface BattleOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface BattleQuestion {
  id: string;
  questionNumber: number;
  type?: QuestionType;         // 'multiple_choice' | 'fill_in_blank'
  prompt: string;              // Câu hỏi tiếng Anh hoặc câu khuyết từ
  targetWord: string;          // Từ vựng chính
  options?: BattleOption[];    // Lựa chọn (đối với trắc nghiệm)
  correctAnswer: string;       // 'A' | 'B' | 'C' | 'D' hoặc targetWord (đối với điền từ)
  hint?: string;               // Gợi ý cho câu điền từ
  explanation: string;         // Lời giải thích tiếng Việt từ AI
}

export interface RoomSettings {
  deckId: string;
  deckTitle: string;
  totalQuestions: number;      // 10, 20, 30
  timePerQuestion: number;     // 10, 15, 20 giây
  difficulty: 'easy' | 'medium' | 'hard';
  gameMode?: BattleGameMode;   // 'mixed' | 'multiple_choice' | 'fill_in_blank'
}

export interface BattleRoom {
  roomCode: string;            // Ví dụ "ENG888"
  createdAt: number;
  status: RoomStatus;
  host: PlayerState;
  guest: PlayerState | null;
  settings: RoomSettings;
  questions: BattleQuestion[];
  currentQuestionIndex: number;
  questionStartedAt: number;   // Timestamp bắt đầu câu hiện tại (để tính countdown đồng bộ)
  roundEndedAt?: number;
  winnerUid?: string | 'draw';
  reaction?: {
    senderUid: string;
    senderName: string;
    emoji: string;
    text: string;
    sentAt: number;
  } | null;
}

