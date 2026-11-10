# Implementation Process & Roadmap (PROCESS)
## Lộ Trình Triển Khai: Nền Tảng Đối Kháng Trắc Nghiệm Tiếng Anh 1v1 & Flashcard AI

---

## 1. Tổng Quan Lộ Trình 1v1 PvP (Battle Roadmap)

```
[Phase 0: Khởi tạo Project & Firebase Setup]
                    │
                    ▼
[Phase 1: Sảnh Đấu, Auth & Quản lý Phòng 1v1 (Room Lobby)]
                    │
                    ▼
[Phase 2: Quản lý Bộ Từ Vựng & Flashcard Lật Thẻ 3D]
                    │
                    ▼
[Phase 3: Tích hợp Google Gemini AI Sinh Đề Đấu Trường]
                    │
                    ▼
[Phase 4: Sàn Đấu 1v1 Realtime (Battle Arena & Sync Loop)]
                    │
                    ▼
[Phase 5: Âm Thanh, Hiệu Ứng Thắng Thua & Xem Lời Giải AI]
                    │
                    ▼
[Phase 6: Kiểm Thử Multi-player Đối Kháng & Deploy Firebase]
```

---

## 2. Chi Tiết Các Giai Đoạn Triển Khai (Phased Breakdown)

### Phase 0: Khởi Tạo Môi Trường & Kết Nối Firebase
- [ ] **Môi trường cục bộ**:
  - Khởi tạo dự án Next.js (TypeScript, Tailwind CSS, App Router).
  - Cài đặt các gói hỗ trợ: `firebase`, `@google/genai`, `lucide-react`, `framer-motion`, `zustand`, `zod`, `canvas-confetti`.
- [ ] **Cấu hình Firebase**:
  - Bật **Authentication** với Google Sign-In và **Anonymous Sign-In** (Guest mode để người chơi có thể vào phòng bằng mã PIN ngay lập tức mà không gặp rào cản đăng ký).
  - Bật **Cloud Firestore** cho tính năng Realtime Room.
  - Cấu hình file `.env.local` với Firebase Web Config và Gemini API Key.

---

### Phase 1: Sảnh Đấu (Lobby), Xác Thực & Quản Lý Phòng 1v1
- [ ] **Sảnh chính (Main Lobby)**:
  - Nút bấm lớn "Tạo Phòng Mới" $\to$ Tạo document trên Firestore với mã PIN 6 ký tự (VD: `ENG789`).
  - Ô nhập mã PIN ("Vào Phòng Bạn Bè") $\to$ Chuyển hướng trực tiếp tới `/battle/[roomCode]`.
  - Tự động sinh tên ngẫu nhiên cho khách (VD: "Panda Sát Thủ", "Cáo Thông Thái") nếu chưa đăng nhập.
- [ ] **Phòng chờ 1v1 (`/battle/[roomCode]`)**:
  - Sử dụng Firestore `onSnapshot` để lắng nghe người thứ 2 vào phòng.
  - Hiển thị 2 khung người chơi: Host (Bên trái) vs Challenger (Bên phải).
  - Khách có nút bấm "Sẵn Sàng" (Ready).
  - Host chọn bộ từ vựng, số câu (5 / 10 / 15), thời gian mỗi câu (10s / 15s).
  - Host chỉ được bấm "Bắt Đầu Trận Đấu" khi Khách đã ở trạng thái Ready.

---

### Phase 2: Quản Lý Từ Vựng & Trình Học Flashcard Solo
- [ ] **Kho Từ Vựng (Decks)**:
  - Cung cấp sẵn các bộ từ vựng mặc định (Pre-built decks):
    - *TOEIC 500 Từ Thường Gặp*
    - *Từ Vựng Giao Tiếp Hằng Ngày*
    - *Từ Vựng Phỏng Vấn & Công Sở*
  - Cho phép người dùng tự tạo thêm bộ từ cá nhân (Thêm từ, phiên âm, nghĩa tiếng Việt, ví dụ).
- [ ] **Trình học Flashcard (Solo Mode)**:
  - Giao diện lật thẻ 3D hai mặt mượt mà.
  - Nút phát âm Web Speech API để luyện nghe/nói trước khi bước vào phòng đối kháng.

---

### Phase 3: AI Battle Quiz Generator (Google Gemini Flash)
- [x] **API Endpoint (`/api/ai/generate-battle`)**:
  - Nhận `deckId` và `totalQuestions` từ client.
  - Lấy danh sách từ vựng của deck $\to$ Gửi Prompt đến Gemini Flash với Zod Schema chuẩn (`BattleQuestionsResponseSchema`).
  - Sinh 4 lựa chọn A, B, C, D, chỉ định đáp án đúng và lời giải thích tiếng Việt.
  - Cập nhật trực tiếp mảng `questions` vào Firestore/RTDB `rooms/{roomCode}`.
  - Hiển thị màn hình chờ "AI Đang Soạn Đề Đấu Trường..." trên cả 2 máy trong khoảng 3 giây.
  - Tích hợp cửa sổ nhập Google Gemini API Key trực tiếp trong UI ([ApiKeyModal.tsx](file:///d:/EnglishGame/src/components/common/ApiKeyModal.tsx)) với Smart Fallback.

---

### Phase 4: Sàn Đấu 1v1 Realtime (Battle Arena)
- [x] **Đồng bộ thời gian & câu hỏi (Synchronization Loop)**:
  - Cả 2 máy cùng nhận câu hỏi từ `rooms/{roomCode}.questions[currentQuestionIndex]`.
  - Đồng hồ đếm ngược chạy đều trên cả 2 máy dựa trên `questionStartedAt`.
  - Hỗ trợ xử lý Timeout (hết giờ tự nộp câu trả lời rỗng).
- [x] **Cơ chế trả lời & Hiển thị đối đầu**:
  - Khi một bên chọn đáp án:
    - Điểm được tính ngay: $1000 + (Thời\_gian\_còn\_lại \times Hệ\_số) + Thưởng\_chuỗi$.
    - Trạng thái người đó lập tức chuyển thành "⚡ ĐÃ CHỌN ĐÁP ÁN!" trên màn hình đối thủ.
  - Khi cả 2 người đã chọn xong hoặc hết giờ:
    - Chuyển trạng thái sang `round_result` trong 2.5 giây: Đổi màu xanh/đỏ cho đáp án đúng/sai, hiển thị điểm số nhảy lên và kết quả đối thủ.
    - Tự động chuyển tiếp sang câu hỏi tiếp theo.
  - Thanh cảm xúc tương tác nhanh (Floating Quick Reactions & Emojis).

---

### Phase 5: Tổng Kết Trận Đấu, Vinh Danh & Lời Giải AI
- [x] **Màn hình Vinh Quang (Victory / Defeat / Draw)**:
  - Trao cúp vàng cho người thắng, hiệu ứng pháo hoa Confetti.
  - Thống kê so sánh: Tổng điểm, số câu đúng.
- [x] **Xem lại & Học từ câu sai**:
  - Bảng tổng hợp toàn bộ câu hỏi của trận đấu kèm lời giải AI.
  - Nút "Gia sư AI phân tích sâu 1-kèm-1" ([AIExplanationModal.tsx](file:///d:/EnglishGame/src/components/battle/AIExplanationModal.tsx)).
  - Nút "Lưu toàn bộ từ vào Flashcard Cần Ôn Lại" vào bộ thẻ cá nhân.
  - Nút "Tái Đấu" (Rematch) để 2 bạn bắt đầu lại ván mới ngay lập tức.
- [x] **Âm thanh & Hiệu ứng Game**:
  - Âm thanh tick-tock khi đếm ngược 5 giây cuối.
  - Âm thanh "Ding!" khi chọn đúng, âm thanh "Buzz!" khi chọn sai.
  - Âm thanh fanfare chiến thắng lúc tổng kết.

---

### Phase 6: Kiểm Thử Multi-player & Triển Khai Firebase
- [x] **Kịch bản kiểm thử 2 người chơi (Multi-window Testing)**:
  - Mở 2 cửa sổ trình duyệt (1 cửa sổ thường và 1 cửa sổ ẩn danh Incognito).
  - Tạo phòng ở cửa sổ 1, lấy mã PIN nhập vào cửa sổ 2.
  - Kiểm tra độ trễ hiển thị khi 2 bên bấm Ready, bấm Bắt đầu, và bấm chọn đáp án.
  - Kiểm tra trường hợp 1 người bị mất mạng hoặc đóng trình duyệt giữa chừng (tự động fallback bộ nhớ cục bộ an toàn).
  - Đã chạy kiểm thử tự động 8 bước ([test-pvp-flow.mjs](file:///d:/EnglishGame/scripts/test-pvp-flow.mjs)) đạt **100% PASS**.
- [x] **Cấu hình Triển khai Production**:
  - Thiết lập Firebase Realtime Database Rules ([database.rules.json](file:///d:/EnglishGame/database.rules.json)).
  - Thiết lập Firestore Security Rules ([firestore.rules](file:///d:/EnglishGame/firestore.rules)).
  - Hỗ trợ triển khai 1-click lên Vercel / Firebase Hosting cho trải nghiệm thi đấu trực tiếp trên điện thoại di động qua mã PIN.

---

## 3. Tiêu Chí Kiểm Thử Nhanh (Quick Verification Checklist)

| Tính Năng | Thao Tác Kiểm Thử | Kết Quả Mong Đợi |
|---|---|---|
| **Mã PIN & Vào phòng** | Máy A tạo phòng $\to$ Máy B gõ mã PIN | Máy B vào ngay đúng phòng của A trong < 500ms |
| **Realtime Ready** | Máy B bấm "Sẵn Sàng" | Máy A lập tức thấy nút của B chuyển sang màu xanh và nút "Bắt Đầu" sáng lên |
| **AI Sinh Đề** | Máy A bấm "Bắt Đầu" | Cả 2 máy hiện animation AI đang soạn đề trong 3s, sau đó cùng nhảy vào câu 1 |
| **Đối kháng câu hỏi** | Máy A chọn đáp án trước B | Máy B thấy ngay badge của Máy A đổi sang "Đã chọn đáp án" kèm icon tia chớp |
| **Tính điểm & Kết quả** | Cả 2 hoàn thành câu cuối | Màn hình trao cúp hiển thị chính xác ai Thắng/Thua, điểm số khớp 100% |
| **Flashcard Review** | Bấm "Lưu từ sai vào Flashcard" | Các từ trả lời sai được lưu vào kho từ vựng cá nhân |
