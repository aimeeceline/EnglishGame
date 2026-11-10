# Architecture & Technical Code Plan (CODEPLAN)
## Nền Tảng Đối Kháng Trắc Nghiệm Tiếng Anh 1v1 & Flashcard AI

---

## 1. Công Nghệ Đề Xuất (Tech Stack)

### Frontend
- **Framework:** Next.js 14+ (App Router, TypeScript) hoặc Vite + React (TypeScript)
  *(Khuyến nghị: **Next.js 14** giúp bảo vệ an toàn Gemini API Key trong Server Actions/API Routes)*
- **Styling & UI Components:** Tailwind CSS + Shadcn/UI (Radix UI) + Lucide React Icons
- **Animation & Visual Effects:** Framer Motion (hiệu ứng 3D Flashcard, thanh đối đầu nhảy điểm realtime, countdown tròn, confetti chiến thắng)
- **Realtime State Management:** 
  - Zustand (quản lý state phòng thi đấu, câu hỏi, điểm số cục bộ)
  - Firebase Firestore Realtime Listeners (`onSnapshot`) cho luồng thi đấu 2 người trong 1 phòng
- **Audio & Sound Effects:** Web Audio API / Howler.js (âm thanh đếm ngược, âm thanh chọn đúng/sai, âm thanh combo và chiến thắng)

### Backend & Cloud Services (Firebase Ecosystem)
- **Firebase Authentication:** Hỗ trợ Google Sign-In, Email/Password và **Anonymous Auth (Guest Mode)** để 2 bạn bè có thể vào chơi ngay bằng mã PIN mà không bắt buộc tạo tài khoản.
- **Cloud Firestore (Realtime DB):** Quản lý collection `rooms/{roomId}`, `decks/{deckId}`, `users/{userId}` với độ trễ thấp và khả năng lắng nghe thay đổi thời gian thực.
- **AI Processing Gateway:** Next.js Route Handler (`/api/ai/generate-battle-quiz`) tích hợp Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`).
- **Firebase Storage:** Lưu trữ ảnh minh họa thẻ từ vựng và avatar người dùng.

---

## 2. Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
EnglishGame/
├── plans/
│   ├── PRD.md                       # Product Requirements Document (1v1 Room Battle)
│   ├── CODEPLAN.md                  # Bản thiết kế kỹ thuật & kiến trúc
│   └── PROCESS.md                   # Lộ trình triển khai chi tiết
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── guest/page.tsx
│   │   ├── (main)/
│   │   │   ├── page.tsx             # Sảnh chính (Tạo phòng, Nhập PIN, Chọn chế độ)
│   │   │   ├── decks/               # Quản lý bộ từ vựng & Flashcards
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [deckId]/page.tsx
│   │   │   │   └── [deckId]/study/page.tsx
│   │   │   ├── leaderboard/page.tsx # Bảng xếp hạng cao thủ 1v1
│   │   │   └── profile/page.tsx
│   │   ├── battle/
│   │   │   └── [roomCode]/
│   │   │       ├── page.tsx         # Trang điều phối (Lobby hoặc Arena dựa theo status)
│   │   ├── api/
│   │   │   └── ai/
│   │   │       ├── generate-battle/route.ts # AI sinh bộ câu hỏi cho phòng đấu
│   │   │       └── explain-question/route.ts # AI giải thích chi tiết
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── battle/
│   │   │   ├── RoomLobby.tsx        # Phòng chờ: 2 người chơi, chọn bộ từ, nút Sẵn sàng
│   │   │   ├── BattleArena.tsx      # Sàn đấu 1v1 chính
│   │   │   ├── VersusHeader.tsx     # Thanh đối đầu (Avatar 2 bạn, điểm số, thanh máu)
│   │   │   ├── QuestionTimer.tsx    # Đồng hồ đếm ngược từng câu (10s/15s)
│   │   │   ├── OptionButtons.tsx    # 4 nút đáp án A, B, C, D to, hiệu ứng bấm phản hồi
│   │   │   ├── PlayerStatusBadge.tsx# Trạng thái đối thủ ("Đã chọn", "Đang nghĩ...")
│   │   │   └── MatchResultModal.tsx # Trao cúp Thắng/Thua, xem chi tiết đáp án & AI review
│   │   ├── flashcard/
│   │   │   ├── FlipCard.tsx         # Thẻ lật 3D hai mặt
│   │   │   ├── CardList.tsx         # Danh sách từ vựng trong deck
│   │   │   └── AddCardModal.tsx     # Thêm từ vựng mới
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SoundEffectToggle.tsx
│   │   │   └── PinCodeInput.tsx     # Ô nhập mã phòng 6 số tiện lợi
│   │   └── ui/                      # Base components từ Shadcn/UI
│   ├── hooks/
│   │   ├── useBattleRoom.ts         # Hook realtime kết nối Firestore onSnapshot cho phòng đấu
│   │   ├── useSoundEffects.ts       # Hook phát âm thanh game (correct, wrong, tick, win)
│   │   └── useAuth.ts               # Hook quản lý User / Guest
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts            # Cấu hình Firebase Client SDK
│   │   │   ├── rooms.ts             # Các hàm CRUD & Realtime Room
│   │   │   └── decks.ts             # Các hàm quản lý từ vựng
│   │   ├── ai/
│   │   │   ├── gemini.ts            # Khởi tạo Gemini SDK
│   │   │   └── prompts.ts           # System prompts tạo câu hỏi thi đấu
│   │   └── sound.ts
│   ├── types/
│   │   ├── battle.ts                # Kiểu dữ liệu Phòng đấu, Người chơi, Câu hỏi 1v1
│   │   ├── vocab.ts                 # Kiểu dữ liệu Thẻ từ vựng & Bộ từ
│   │   └── user.ts
│   ├── firestore.rules              # Quy tắc bảo mật Firestore
│   ├── tailwind.config.ts
│   └── package.json
```

---

## 3. Thiết Kế Cơ Sở Dữ Liệu Firestore Cho Phòng Đấu 1v1 (Realtime Schema)

Điểm mấu chốt của ứng dụng là **Phòng đấu thời gian thực (Realtime Battle Room)**. Cấu trúc Firestore được tối ưu hóa để 2 máy người chơi lắng nghe document bằng `onSnapshot`:

### 3.1. Collection: `rooms`
Document ID: `{roomCode}` (ví dụ: `ENG888` - dễ đọc và chia sẻ)

```typescript
export interface PlayerState {
  uid: string;
  displayName: string;
  photoURL?: string;
  isReady: boolean;
  score: number;
  currentStreak: number;       // Chuỗi đúng liên tiếp
  currentAnswer: {
    questionIndex: number;
    selectedKey: 'A' | 'B' | 'C' | 'D' | null;
    answeredAt: number;        // Timestamp (ms) để tính điểm tốc độ
    isCorrect?: boolean;
  } | null;
  totalCorrect: number;
  isOnline: boolean;
  lastPing: number;
}

export interface BattleQuestion {
  id: string;
  questionNumber: number;
  prompt: string;              // Câu hỏi tiếng Anh
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;         // Lời giải thích tiếng Việt từ AI
  targetWord: string;          // Từ vựng được kiểm tra
}

export interface BattleRoom {
  roomCode: string;            // "ENG888"
  createdAt: number;
  status: 'waiting' | 'generating' | 'playing' | 'round_result' | 'finished';
  host: PlayerState;
  guest: PlayerState | null;   // Null khi chưa có người tham gia
  settings: {
    deckId: string;            // Bộ từ vựng được chọn
    deckTitle: string;
    totalQuestions: number;    // 5, 10, 15 câu
    timePerQuestion: number;   // 10 hoặc 15 giây
    difficulty: 'easy' | 'medium' | 'hard';
  };
  questions: BattleQuestion[]; // Danh sách câu hỏi do AI tạo
  currentQuestionIndex: number; // 0..N-1
  questionStartedAt: number;   // Timestamp bắt đầu câu hỏi hiện tại (cho đồng hồ đếm ngược)
  winnerUid?: string | 'draw'; // Kết quả cuối cùng
}
```

### 3.2. Collection: `decks` & `cards` (Từ Vựng, Flashcard & Nguồn Google Sheets)
Document ID: `{deckId}`
```typescript
export interface VocabDeck {
  id: string;
  title: string;              // "300 Từ Vựng Giao Tiếp Công Sở"
  description: string;
  category: string;
  cardCount: number;
  isDefault: boolean;         // true: Bộ từ mặc định của hệ thống
  creatorId: string;
  createdAt: number;
  sourceType?: 'manual' | 'google_sheet' | 'csv';
  googleSheetUrl?: string;    // Link Google Sheet nếu import từ Sheet
  lastSyncedAt?: number;
}

// Subcollection: decks/{deckId}/cards/{cardId}
export interface FlashcardItem {
  id: string;
  word: string;               // "Negotiate"
  phonetic: string;           // "/nəˈɡoʊ.ʃi.eɪt/"
  partOfSpeech: string;       // "verb"
  meaning: string;            // "thương lượng, đàm phán"
  exampleSentence: string;    // "They are trying to negotiate a new contract."
  exampleTranslation: string; // "Họ đang cố gắng thương lượng một hợp đồng mới."
}
```

---

## 3.3. Module Xử Lý Google Sheets (Google Sheets Parser & Sync)

Hỗ trợ 2 phương thức kết nối:
1. **Public CSV Export (Không cần API Key / Zero-config)**:
   - Chuyển URL Google Sheet:
     `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}`
   - Thành endpoint xuất CSV tức thời:
     `https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&gid={GID}`
   - Parser tự động nhận diện tiêu đề cột (dù người dùng đặt tên tiếng Việt hay tiếng Anh):
     - Cột Từ: `word`, `từ`, `từ vựng`, `vocabulary`
     - Cột Nghĩa: `meaning`, `nghĩa`, `định nghĩa`, `tiếng việt`
     - Cột Phiên âm: `phonetic`, `ipa`, `phiên âm`
     - Cột Từ loại: `part of speech`, `type`, `từ loại`, `pos`
     - Cột Ví dụ: `example`, `ví dụ`, `câu ví dụ`
2. **Google Sheets API v4 (Tùy chọn nâng cao qua Google Cloud)**:
   - Dành cho Google Sheet bảo mật riêng tư hoặc tự động ghi log điểm số trận đấu 1v1 vào Sheet.

---

## 4. Cơ Chế Đồng Bộ Realtime & Vòng Lặp Trận Đấu (Battle Game Loop)

### 4.1. Luồng Realtime giữa 2 máy (State Synchronization)
1. **Lắng nghe phòng (`onSnapshot`)**:
   - Cả Host và Guest đều gọi `onSnapshot(doc(db, 'rooms', roomCode), (snapshot) => { ... })`.
   - Bất kỳ thay đổi nào từ một bên (Guest bấm Sẵn Sàng, Host bấm Bắt Đầu, một bên chọn đáp án) sẽ phản ánh ngay trên màn hình bên kia trong vòng chưa đầy 150ms.
2. **AI Sinh Bộ Đề Cho Trận Đấu**:
   - Khi Host bấm "Bắt đầu trận đấu", client chuyển trạng thái phòng sang `'generating'`.
   - Host gọi API Server `/api/ai/generate-battle` kèm `deckId` và `totalQuestions`.
   - Gemini sinh đề JSON chuẩn $\to$ Lưu mảng `questions` vào document phòng $\to$ Cập nhật `status = 'playing'`, `currentQuestionIndex = 0`, `questionStartedAt = Date.now()`.
3. **Vòng lặp mỗi câu hỏi (Question Round Loop)**:
   - Cả 2 máy hiển thị đồng hồ đếm ngược dựa trên `questionStartedAt + timePerQuestion * 1000`.
   - Khi một người chơi bấm chọn đáp án:
     - Client đó tính điểm và cập nhật lên Firestore:
       $$Điểm = 1000 + \max\left(0, \left\lfloor\frac{Thời\_gian\_còn\_lại}{Tổng\_thời\_gian} \times 500\right\rfloor\right)$$
     - Người còn lại lập tức thấy badge của đối thủ đổi sang icon `Đã trả lời` (tạo áp lực thời gian).
   - Khi **cả 2 đã trả lời** hoặc **hết thời gian**:
     - Hệ thống tạm dừng 3 giây (`status = 'round_result'`) để hiện đáp án đúng của câu và hiệu ứng cộng điểm.
     - Sau đó tự động tăng `currentQuestionIndex += 1` và reset vòng mới.
4. **Kết thúc trận đấu (`finished`)**:
   - Sau khi hoàn thành câu hỏi cuối cùng, hệ thống so sánh điểm của `host.score` và `guest.score`.
   - Cập nhật `winnerUid` và mở modal vinh danh chiến thắng kèm chi tiết phân tích từng câu.

---

## 5. Tích Hợp AI: Gemini Structured Battle Quiz Generator

### 5.1. Prompt Engineering & Zod Schema

```typescript
import { z } from 'zod';

export const BattleQuestionsResponseSchema = z.object({
  questions: z.array(z.object({
    prompt: z.string().describe("Câu hỏi trắc nghiệm tiếng Anh rõ ràng, có ngữ cảnh thực tế"),
    targetWord: z.string().describe("Từ vựng chính được đem ra kiểm tra"),
    options: z.array(z.object({
      key: z.enum(['A', 'B', 'C', 'D']),
      text: z.string().describe("Nội dung lựa chọn")
    })).length(4),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().describe("Giải thích ngắn gọn bằng tiếng Việt vì sao đáp án này đúng và ngữ cảnh sử dụng")
  }))
});
```

**System Prompt gửi cho Gemini:**
```text
Bạn là một đạo diễn cuộc thi đấu trí tiếng Anh 1v1 đối kháng trực tiếp.
Nhiệm vụ của bạn là nhận danh sách từ vựng và tạo ra bộ câu hỏi trắc nghiệm kịch tính, chuẩn học thuật hoặc giao tiếp thực tế.
Yêu cầu:
1. Đa dạng hóa loại câu hỏi: điền từ còn thiếu vào ngữ cảnh, tìm từ đồng nghĩa/trái nghĩa, hoặc chọn nghĩa phù hợp nhất.
2. 3 phương án gây nhiễu (distractors) phải hợp lý, tạo độ thử thách cho 2 đối thủ.
3. Phần giải thích (explanation) viết bằng Tiếng Việt súc tích, dễ hiểu.
4. Tuân thủ 100% định dạng JSON Schema.
```

---

## 6. Quy Tắc Bảo Mật Firestore (Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    // Phòng đấu 1v1
    match /rooms/{roomCode} {
      // Cho phép mọi người đọc phòng để tham gia
      allow read: if true;
      
      // Tạo phòng mới
      allow create: if isAuthenticated();

      // Cập nhật: Người chơi chỉ được cập nhật trạng thái của chính mình
      allow update: if isAuthenticated();
      
      // Xóa phòng
      allow delete: if isAuthenticated() && resource.data.host.uid == request.auth.uid;
    }

    // Bộ từ vựng & Thẻ
    match /decks/{deckId} {
      allow read: if true;
      allow write: if isAuthenticated();

      match /cards/{cardId} {
        allow read: if true;
        allow write: if isAuthenticated();
      }
    }
  }
}
```
