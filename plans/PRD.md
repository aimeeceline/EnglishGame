# Product Requirements Document (PRD)
## Nền Tảng Đối Kháng Trắc Nghiệm Tiếng Anh 1v1 & Flashcard AI (EngDuel 1v1)

- **Tên dự án:** EngDuel 1v1 (Realtime English Battle Arena & Flashcard AI)
- **Phiên bản:** 2.0.0 (Cập nhật kiến trúc Phòng Thi Đấu 1v1)
- **Nền tảng:** Web Responsive (Desktop, Mobile, Tablet)
- **Hạ tầng chính:** Firebase (Auth, Firestore Realtime, Storage, Hosting) + Google Gemini AI

---

## 1. Tầm Nhìn Sản Phẩm & Trải Nghiệm Cốt Lõi (Core Concept)

EngDuel 1v1 là nền tảng học tiếng Anh qua hình thức **Gamification Đối Kháng Trực Tiếp (1v1 PvP Realtime)**:
1. **Thi Đấu Đối Kháng Trong Phòng (1v1 Room Battle)**:
   - Một người chơi tạo phòng (Host) sinh mã PIN (Room Code 6 ký tự).
   - Bạn bè nhập mã PIN để vào phòng (Guest).
   - Cả 2 cùng thi đấu trả lời trắc nghiệm trực tiếp theo thời gian thực (Realtime).
   - Điểm số được tính dựa trên **Độ chính xác** + **Tốc độ trả lời** (trả lời đúng càng nhanh điểm càng cao).
   - Màn hình hiển thị song song thanh tiến trình, trạng thái và điểm số của cả 2 bạn để tạo cảm giác gay cấn, hồi hộp.
2. **AI Question Generator từ Kho Từ Vựng (Vocab Decks)**:
   - Trước trận đấu, Host chọn bộ từ vựng (ví dụ: TOEIC 600 từ, Từ vựng IELTS chủ đề Environment, hoặc bộ từ cá nhân).
   - AI (Google Gemini) tự động phân tích và tạo ngay một bộ câu hỏi trắc nghiệm ngữ cảnh độc nhất cho trận đấu.
3. **Phân Hệ Flashcard Thông Minh**:
   - Kho lưu trữ và học từ vựng cá nhân/cộng đồng.
   - Lật thẻ 3D, âm thanh chuẩn, ghi nhớ nghĩa và ví dụ.
   - Sau trận đấu 1v1, hệ thống tự động lọc ra các câu/từ vựng mà người chơi trả lời sai để đưa vào bộ thẻ Flashcard "Cần Ôn Lại".
4. **Hạ Tầng Firebase Realtime**:
   - Sử dụng Firestore Realtime Listeners (`onSnapshot`) để đồng bộ trạng thái phòng, lượt trả lời, điểm số giữa 2 máy tức thì mà không cần duy trì Socket server phức tạp.

---

## 2. Luồng Người Dùng & Các Màn Hình Chính (User Journey)

```
[Đăng nhập / Khách]
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
[Tủ Thẻ Flashcard]          [Sảnh Đấu - Match Lobby]
- Quản lý từ vựng            ├─ Tạo phòng (Nhận mã PIN 6 số)
- Tự luyện từ vựng           └─ Nhập mã PIN vào phòng bạn bè
                                   │
                                   ▼
                            [Phòng Chờ 1v1 - Room Lobby]
                            - Host chọn Bộ Từ Vựng & Cấu hình (5, 10, 15 câu)
                            - Khách bấm "Sẵn Sàng" (Ready)
                            - Host bấm "Bắt Đầu" ──> AI sinh đề thi (3-5s)
                                   │
                                   ▼
                            [Đấu Trường Realtime - Battle Arena]
                            - Cả 2 cùng trả lời cùng lúc
                            - Đồng hồ đếm ngược từng câu (10s - 15s)
                            - Thanh máu/điểm của đối thủ nhảy realtime
                                   │
                                   ▼
                            [Tổng Kết Trận Đấu - Victory / Defeat]
                            - Vinh danh Người Thắng / Thua / Hòa
                            - Xem lại giải thích chi tiết của AI cho từng câu
                            - Nút "Tái Đấu" hoặc "Thêm câu sai vào Flashcard"
```

---

## 3. Đặc Tả Tính Năng Chi Tiết (Feature Specifications)

### 3.1. Phân Hệ Phòng Đấu 1v1 Realtime (Core PvP Engine)
- **Tạo & Tham gia phòng (Room Creation & Joining)**:
  - Tạo phòng tức thì: sinh mã phòng ngẫu nhiên 6 ký tự (VD: `ENG888`) và liên kết URL chia sẻ nhanh (`/battle/[roomCode]`).
  - Hỗ trợ tham gia nhanh bằng cách nhập mã hoặc quét mã QR.
- **Phòng chờ (Room Waiting Lobby)**:
  - Hiển thị thông tin 2 đối thủ: Avatar, tên hiển thị, level/chuỗi thắng.
  - Cấu hình trận đấu (Chỉ Host có quyền chỉnh):
    - Chọn bộ từ vựng (Deck).
    - Số lượng câu hỏi (5, 10, hoặc 15 câu).
    - Thời gian mỗi câu (10 giây, 15 giây hoặc 20 giây).
    - Độ khó: Cơ bản (A2-B1) hoặc Nâng cao (B2-C1).
  - Trạng thái `Ready`: Khách phải bấm sẵn sàng thì Host mới có thể ấn "Bắt đầu".
- **Đấu trường trực tiếp (Battle Arena)**:
  - **Đồng bộ câu hỏi**: Cả 2 người chơi cùng giải quyết chung 1 câu hỏi tại cùng thời điểm.
  - **Cơ chế tính điểm linh hoạt (Speed-Bonus Scoring)**:
    - Trả lời đúng: Điểm gốc = $1000$ điểm.
    - Điểm tốc độ: $+ (Thời\_gian\_còn\_lại / Tổng\_thời\_gian) \times 500$ điểm.
    - Trả lời sai hoặc hết giờ: $0$ điểm.
  - **Thanh đối đầu trực quan (Versus Bar)**:
    - Hiển thị điểm số 2 bên nhảy số realtime.
    - Trạng thái trực quan: icon "Đã chọn đáp án" để tạo áp lực tâm lý cho đối thủ.
    - Hiệu ứng Streak: Trả lời đúng liên tiếp nhận combo x1.2, x1.5 điểm.
  - Tự động chuyển câu tiếp theo khi cả 2 đã chọn đáp án hoặc khi hết giờ đếm ngược.
- **Màn hình Tổng kết & Giải thích (Match Summary)**:
  - Hoạt cảnh Victory / Defeat / Draw ấn tượng.
  - Biểu đồ đối đầu so sánh tốc độ trả lời và độ chính xác của 2 người.
  - Bảng xem lại đáp án từng câu:
    - Lựa chọn của Bạn vs Lựa chọn của Đối thủ vs Đáp án Đúng.
    - Lời giải thích chi tiết của AI bằng tiếng Việt (nghĩa câu, dịch ngữ cảnh, vì sao các phương án khác sai).
  - Nút "Tái Đấu" (Rematch) giữ nguyên phòng thi đấu.
  - Nút "Thêm các từ vựng đã làm sai vào Flashcard để ôn tập".

---

### 3.2. Phân Hệ AI Question Generator (Google Gemini Flash)
- **Nguyên liệu đầu vào**:
  - Lấy danh sách từ vựng từ bộ thẻ Flashcard được Host chỉ định.
- **Khả năng sinh câu hỏi tự động**:
  - Dạng 1: Trắc nghiệm điền từ còn thiếu vào câu ngữ cảnh (Sentence Completion).
  - Dạng 2: Chọn nghĩa tiếng Việt đúng của từ trong ngữ cảnh.
  - Dạng 3: Tìm từ đồng nghĩa (Synonym) hoặc trái nghĩa (Antonym).
  - Dạng 4: Chọn dạng đúng của từ (Word Form: noun, verb, adj, adv).
- **Yêu cầu kỹ thuật**:
  - Thời gian sinh trọn vẹn bộ đề 10 câu dưới 5 giây.
  - Đáp án chuẩn 4 lựa chọn A, B, C, D kèm giải thích chi tiết bằng tiếng Việt.
  - Schema JSON chuẩn xác 100% nhờ cấu trúc `responseSchema` của Gemini.

---

### 3.3. Phân Hệ Quản Lý Từ Vựng, Flashcard & Tích Hợp Google Sheets (Vocab & Sheets)
- **Tích Hợp Google Sheets (Google Sheets Integration)**:
  - **Nhập từ vựng 1-Click qua Link Google Sheet**:
    - Người dùng chỉ cần dán đường link Google Sheet (chế độ xem công khai hoặc link chia sẻ).
    - Hệ thống tự động phân tích (auto-detect) các cột: `Word`, `Phonetic`, `Part of Speech`, `Meaning`, `Example Sentence`.
    - Tự động lưu thành một Bộ từ vựng (Deck) trên Firestore để sẵn sàng học Flashcard hoặc đưa vào Đấu trường 1v1.
  - **Đồng bộ hóa 2 chiều (Sync & Auto-refresh)**:
    - Khi giáo viên hoặc người học thêm từ mới vào Google Sheet, chỉ cần nhấn nút "Cập nhật từ Sheet" trên web là dữ liệu tự động làm mới.
    - Tùy chọn: Xuất lịch sử điểm số của các trận đấu 1v1 ra file Google Sheet để giáo viên/phụ huynh theo dõi.
- **Quản lý bộ thẻ (Decks)**:
  - Tạo bộ từ thủ công, tải lên từ file CSV/Excel, hoặc nhập từ Google Sheets.
  - Bộ thẻ hệ thống mẫu (Pre-built decks) sẵn có (TOEIC, IELTS, Giao tiếp công sở).
- **Quản lý từ vựng trong thẻ (Flashcards)**:
  - Từ (Word), phiên âm IPA, từ loại, nghĩa tiếng Việt, câu ví dụ, âm thanh phát âm.
  - Hỗ trợ công cụ nghe phát âm chuẩn bằng giọng đọc bản ngữ (Web Speech API).
- **Chế độ Luyện Thẻ Solo (Flashcard Study)**:
  - Lật thẻ 3D hai mặt mượt mà.
  - Tự ôn luyện cá nhân trước khi bước vào phòng đấu đối kháng.

---

### 3.4. Phân Hệ Xác Thực & Tài Khoản (Authentication & Ranking)
- Đăng nhập linh hoạt: Đăng nhập Google, Email hoặc **Chơi ngay với tư cách Khách (Guest Mode)** để dễ dàng rủ bạn bè vào phòng mà không bị rào cản đăng ký tài khoản.
- Hồ sơ người dùng:
  - Tỉ lệ thắng (Win Rate), Tổng số trận đấu 1v1 đã tham gia, Chuỗi thắng dài nhất (Win Streak).
  - Bảng xếp hạng cao thủ (Leaderboard) theo số trận thắng hoặc tổng điểm đấu trường.

---

## 4. Yêu Cầu Kỹ Thuật Phi Chức Năng (Non-Functional Requirements)

1. **Độ trễ Realtime cực thấp (< 300ms)**: Sử dụng Firestore Snapshot Listeners hoặc Realtime Database để đồng bộ hành động giữa 2 máy gần như tức thời.
2. **Xử lý ngắt kết nối (Disconnection Handling)**:
   - Nếu 1 trong 2 người chơi bị mất mạng hoặc thoát trình duyệt, đối thủ sẽ thấy thông báo tạm dừng trong 30 giây hoặc tự động xử thắng (Forfeit).
3. **Responsive Mobile-first**:
   - Giao diện phòng thi đấu và bấm chọn đáp án được tối ưu tuyệt đối cho màn hình cảm ứng điện thoại (nút bấm to, phản hồi rung/âm thanh nhẹ).
4. **Bảo mật**:
   - Không để lộ đáp án đúng ở client trước khi người chơi chọn xong câu hỏi (Client chỉ nhận đáp án sau khi đã chốt câu trả lời hoặc qua Server Function).

---

## 5. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] Người chơi A bấm "Tạo phòng 1v1", hệ thống cấp mã 6 chữ số (VD: `ABC123`).
- [ ] Người chơi B ở một thiết bị/trình duyệt khác nhập mã `ABC123` và vào đúng phòng của A.
- [ ] Cả 2 thấy avatar và trạng thái của nhau theo thời gian thực (Realtime).
- [ ] Khi bấm Bắt đầu, AI sinh bộ câu hỏi trắc nghiệm từ bộ từ vựng đã chọn.
- [ ] Cả 2 cùng thấy đồng hồ đếm ngược chạy song song, người A chọn đáp án thì người B thấy thanh trạng thái của A đổi màu ngay lập tức.
- [ ] Kết thúc trận đấu, màn hình hiển thị chính xác ai Thắng / Thua kèm điểm số và bảng lời giải chi tiết của từng câu hỏi.
