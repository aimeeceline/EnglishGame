# ⚔️ EngDuel 1v1 - Đấu Trường Trắc Nghiệm Tiếng Anh & Flashcard AI

> Nền tảng học và thi đấu đối kháng trắc nghiệm tiếng Anh 2 người trong 1 phòng thời gian thực (Realtime PvP Room), kết hợp thẻ ghi nhớ Flashcard 3D, đọc từ vựng từ Google Sheets và AI tự động sinh đề thi.

---

## 🌟 Tính Năng Nổi Bật

1. **Phòng Đấu Đối Kháng 1v1 Realtime (Mã PIN 6 Ký Tự)**:
   - **Tạo phòng**: Host tạo phòng và nhận mã PIN ngẫu nhiên (VD: `ENG888`).
   - **Vào phòng**: Đối thủ nhập mã PIN từ bất kỳ thiết bị nào (máy tính, điện thoại) để vào phòng đấu.
   - **Sàn đấu trực tiếp**: Cả 2 cùng trả lời chung một câu hỏi tại cùng thời điểm. Đồng hồ đếm ngược từng câu (10s/15s).
   - **Tính điểm tốc độ**: $1000$ điểm gốc + điểm thưởng số giây còn lại khi chọn đáp án đúng.
   - **Cập nhật realtime**: Hiển thị điểm số, chuỗi combo và icon *"⚡ Đối thủ ĐÃ CHỌN ĐÁP ÁN!"* để tạo áp lực thời gian.
   - **Vinh danh & Xem lại**: Trao cúp vàng chiến thắng, hiệu ứng pháo hoa, xem bảng so sánh đáp án của 2 người và đọc lời giải thích chi tiết của AI cho từng câu.

2. **Tích Hợp Google Sheet 1-Click (Zero-Config)**:
   - Dán trực tiếp đường link bảng tính Google Sheet (ở chế độ xem công khai).
   - Tự động nhận diện các cột: `Word`, `Meaning`, `Phonetic`, `Example` (cả tiếng Việt và tiếng Anh).
   - Biến bảng từ vựng trong Google Sheet thành bộ Flashcard và đề thi đấu AI ngay lập tức!

3. **Google Gemini AI Question Generator**:
   - Tự động phân tích danh sách từ vựng được chọn để sinh ra bộ câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) kịch tính, ngữ cảnh thực tế và giải thích chi tiết bằng tiếng Việt.
   - Bộ sinh dự phòng thông minh (Fallback generator) đảm bảo trận đấu luôn diễn ra mượt mà kể cả khi chưa có API Key.

4. **Trình Học Flashcard 3D Có Giọng Đọc**:
   - Thẻ lật 3D hai mặt mượt mà (Bấm chuột hoặc phím Space để lật thẻ).
   - Tích hợp giọng phát âm chuẩn bản ngữ (Web Speech API).
   - Phím tắt tiện lợi ($\leftarrow$ / $\rightarrow$ để chuyển thẻ).

5. **Bảng Xếp Hạng Cao Thủ (Leaderboard)**:
   - Bảng vàng vinh danh Top người chơi có điểm số cao nhất, tỷ lệ thắng (%) và chuỗi trận thắng liên tiếp.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js 14 (App Router, TypeScript), Tailwind CSS, Framer Motion, Lucide React Icons, Canvas Confetti.
- **Backend & Realtime**: Firebase Cloud Firestore (`onSnapshot`), Firebase Authentication (Hỗ trợ Guest Mode chơi ngay).
- **Trí Tuệ Nhân Tạo**: Google Gemini Flash (`@google/generative-ai`) với cấu trúc JSON Schema.
- **Âm thanh Game**: Web Audio API (Ding chọn đúng, Buzz chọn sai, Tick-tock đếm ngược, Fanfare chiến thắng).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Cài đặt dependencies (đã hoàn thành):
```bash
npm install
```

### 2. Cấu hình Firebase (`.env.local`):
File `.env.local` đã được điền sẵn thông số kết nối của dự án Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC_Kg21D8tdXks61F_RhQ2t-P_T8GybGxU"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="englishbattle-cd62d.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://englishbattle-cd62d-default-rtdb.asia-southeast1.firebasedatabase.app"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="englishbattle-cd62d"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="englishbattle-cd62d.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1034181947718"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1034181947718:web:e005a0fe16fe17f7393547"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-5NSFJSGJM5"

# (Tùy chọn) Thêm Gemini API Key tại https://aistudio.google.com/
GEMINI_API_KEY=""
```

### 3. Khởi chạy ứng dụng:
```bash
npm run dev
```
Mở trình duyệt tại: **`http://localhost:3000`**

---

## 🎮 Cách Thi Đấu Thử Nghiệm 2 Người (Multi-window Test)

1. Mở trình duyệt thường vào `http://localhost:3000` $\to$ Bấm **"Tạo Phòng Đấu 1v1"** $\to$ Nhận mã PIN (VD: `ENG123`).
2. Mở một cửa sổ trình duyệt ẩn danh (Incognito) hoặc thiết bị khác vào `http://localhost:3000` $\to$ Bấm **"Vào Bằng Mã PIN"** $\to$ Gõ `ENG123`.
3. Ở cửa sổ 2, bấm **"Tôi Đã Sẵn Sàng"**.
4. Ở cửa sổ 1, bấm **"Bắt Đầu Trận Đấu"** và cùng so tài trực tiếp!

