import { FlashcardItem } from "@/types/vocab";

/**
 * Hàm chuẩn hóa và loại bỏ dấu tiếng Việt để so khớp header linh hoạt
 * VD: "Từ Vựng (Mới)" -> "tuvungmoi", "Nghĩa Tiếng Việt" -> "nghiatiengviet"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export interface GoogleSheetInfo {
  sheetId: string;
  gid: string;
  isPublished?: boolean;
}

/**
 * Trích xuất ID và GID từ bất kỳ dạng link Google Sheet nào:
 * - Link chỉnh sửa: https://docs.google.com/spreadsheets/d/<ID>/edit...
 * - Link xuất bản web: https://docs.google.com/spreadsheets/d/e/<ID>/pub...
 * - Link chia sẻ: https://docs.google.com/spreadsheets/d/<ID>/view...
 */
export function extractGoogleSheetInfo(url: string): GoogleSheetInfo | null {
  if (!url || typeof url !== "string") return null;

  try {
    const trimmed = url.trim();

    // 1. Dạng link xuất bản web: /d/e/2PACX-...
    const publishedMatch = trimmed.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (publishedMatch && publishedMatch[1]) {
      let gid = "0";
      const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
      if (gidMatch && gidMatch[1]) gid = gidMatch[1];
      return { sheetId: publishedMatch[1], gid, isPublished: true };
    }

    // 2. Dạng link thông thường: /d/<SHEET_ID>
    const sheetIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch || !sheetIdMatch[1]) {
      return null;
    }

    let gid = "0";
    const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    return { sheetId: sheetIdMatch[1], gid, isPublished: false };
  } catch (error) {
    console.error("Lỗi trích xuất thông tin Google Sheet:", error);
    return null;
  }
}

/**
 * Tạo URL tải CSV trực tiếp từ Google Sheet
 */
export function getGoogleSheetCsvUrl(url: string): string | null {
  const info = extractGoogleSheetInfo(url);
  if (!info) return null;

  if (info.isPublished) {
    return `https://docs.google.com/spreadsheets/d/e/${info.sheetId}/pub?output=csv&gid=${info.gid}`;
  }

  // Phương thức /export?format=csv là chuẩn nhất của Google Drive
  return `https://docs.google.com/spreadsheets/d/${info.sheetId}/export?format=csv&gid=${info.gid}`;
}

/**
 * Phương thức URL dự phòng qua gviz
 */
export function getGoogleSheetGvizCsvUrl(url: string): string | null {
  const info = extractGoogleSheetInfo(url);
  if (!info) return null;
  if (info.isPublished) return null;
  return `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
}

/**
 * Bộ phân tích cú pháp CSV/TSV chuẩn RFC-4180
 * Hỗ trợ dấu ngoặc kép, nội dung nhiều dòng, tự động nhận diện dấu phẩy `,`, chấm phẩy `;` hoặc tab `\t`
 */
export function parseCsvRows(text: string): string[][] {
  if (!text || text.trim().length === 0) return [];

  // Tự động nhận diện dấu phân cách phổ biến
  const firstLine = text.slice(0, 1000).split(/\r?\n/)[0] || "";
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Bỏ qua ký tự thoát quote kế tiếp
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Bỏ qua \n nếu là \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Dòng cuối cùng nếu còn dữ liệu
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Từ điển các từ khóa nhận dạng tiêu đề cột (Dynamic Header Mapping)
 */
const HEADER_KEYWORDS = {
  word: [
    'word', 'words', 'tu', 'tuvung', 'tumoi', 'thuatngu', 'term', 'terms',
    'vocabulary', 'vocab', 'tienganh', 'english', 'englishword', 'front',
    'keyword', 'phrase', 'cumtu', 'question', 'cauhoi'
  ],
  meaning: [
    'meaning', 'meanings', 'nghia', 'dinhnghia', 'dich', 'dichnghia', 'giainghia',
    'tiengviet', 'vietnamese', 'nghiatiengviet', 'dichviet', 'back', 'definition',
    'definitions', 'translation', 'translations', 'ynghia', 'bandich', 'vn', 'answer', 'dapan'
  ],
  phonetic: [
    'phonetic', 'phonetics', 'ipa', 'phienam', 'phienamipa', 'phatam',
    'pronunciation', 'sound', 'transcription'
  ],
  pos: [
    'pos', 'partofspeech', 'tuloai', 'loaitu', 'type', 'wordtype', 'category'
  ],
  example: [
    'example', 'examples', 'vidu', 'cauvidu', 'sentence', 'sentences',
    'context', 'sample', 'usage'
  ],
  translation: [
    'translation', 'dichcau', 'dichvidu', 'vietnamesesentence', 'nghiacau', 'cautiengviet'
  ],
};

/**
 * Kiểm tra xem một cell có khớp với danh sách từ khóa tiêu đề hay không
 */
function matchesKeyword(normalizedCell: string, keywords: string[]): boolean {
  if (!normalizedCell) return false;
  return keywords.some(k => normalizedCell === k || normalizedCell.includes(k) || k.includes(normalizedCell));
}

/**
 * Phân tích và trích xuất từ vựng từ nội dung CSV
 * Hoàn toàn động: không cố định chỉ số cột, tự động nhận diện thông minh mọi cấu trúc bảng tính
 */
export function parseVocabCsv(csvText: string): FlashcardItem[] {
  // Kiểm tra nếu nội dung là trang HTML (đăng nhập hoặc lỗi quyền truy cập)
  if (csvText.includes("<!DOCTYPE html") || csvText.includes("<html") || csvText.includes("google-site-verification")) {
    throw new Error(
      "Không thể đọc bảng tính do bị giới hạn quyền riêng tư. Hãy mở file Google Sheet, bấm nút 'Chia sẻ' (Share) và chọn 'Bất kỳ ai có đường liên kết đều có thể xem' (Anyone with the link - Viewer)!"
    );
  }

  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];

  let headerRowIndex = -1;
  let wordIdx = -1;
  let meaningIdx = -1;
  let phoneticIdx = -1;
  let posIdx = -1;
  let exampleIdx = -1;
  let transIdx = -1;

  // 1. Quét tìm dòng tiêu đề (Header Row) trong 5 dòng đầu tiên
  const maxHeaderSearch = Math.min(5, rows.length);
  for (let r = 0; r < maxHeaderSearch; r++) {
    const row = rows[r];
    const normalized = row.map(c => removeVietnameseTones(c));

    const foundWordIdx = normalized.findIndex(h => matchesKeyword(h, HEADER_KEYWORDS.word));
    const foundMeaningIdx = normalized.findIndex((h, idx) => idx !== foundWordIdx && matchesKeyword(h, HEADER_KEYWORDS.meaning));

    if (foundWordIdx !== -1 && foundMeaningIdx !== -1) {
      headerRowIndex = r;
      wordIdx = foundWordIdx;
      meaningIdx = foundMeaningIdx;

      phoneticIdx = normalized.findIndex((h, idx) => idx !== wordIdx && idx !== meaningIdx && matchesKeyword(h, HEADER_KEYWORDS.phonetic));
      posIdx = normalized.findIndex((h, idx) => idx !== wordIdx && idx !== meaningIdx && matchesKeyword(h, HEADER_KEYWORDS.pos));
      exampleIdx = normalized.findIndex((h, idx) => idx !== wordIdx && idx !== meaningIdx && matchesKeyword(h, HEADER_KEYWORDS.example));
      transIdx = normalized.findIndex((h, idx) => idx !== wordIdx && idx !== meaningIdx && matchesKeyword(h, HEADER_KEYWORDS.translation));
      break;
    }
  }

  // 2. Nếu không tìm thấy Header bằng từ khóa, dùng AI-style Heuristic phân tích nội dung dữ liệu
  if (wordIdx === -1 || meaningIdx === -1) {
    headerRowIndex = 0;
    const sampleRows = rows.slice(1, Math.min(10, rows.length));
    const maxCols = Math.max(...rows.map(r => r.length), 0);

    const scores = Array.from({ length: maxCols }, () => ({
      englishScore: 0,
      vietnameseScore: 0,
      numberScore: 0,
      shortScore: 0,
    }));

    sampleRows.forEach(row => {
      row.forEach((val, colIdx) => {
        if (!scores[colIdx]) return;
        const trimmed = val.trim();
        if (!trimmed) return;

        // Cột số thứ tự (1, 2, 3...)
        if (/^\d+$/.test(trimmed)) {
          scores[colIdx].numberScore += 2;
        }

        // Cột chứa chữ tiếng Việt có dấu
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
          scores[colIdx].vietnameseScore += 3;
        }

        // Cột tiếng Anh (chỉ gồm a-z, khoảng trắng, gạch nối, không có dấu tiếng Việt)
        if (/^[a-zA-Z\s\-']+$/.test(trimmed) && trimmed.length >= 2) {
          scores[colIdx].englishScore += 2;
          if (trimmed.split(/\s+/).length <= 3) {
            scores[colIdx].shortScore += 1; // Từ hoặc cụm từ ngắn
          }
        }
      });
    });

    // Chọn cột tiếng Anh tốt nhất (bỏ qua cột số thứ tự)
    let bestWordCol = -1;
    let maxWordScore = -1;
    scores.forEach((s, idx) => {
      const score = s.englishScore + s.shortScore - s.numberScore;
      if (score > maxWordScore && s.englishScore > 0) {
        maxWordScore = score;
        bestWordCol = idx;
      }
    });

    // Chọn cột tiếng Việt tốt nhất (khác cột tiếng Anh)
    let bestMeaningCol = -1;
    let maxMeaningScore = -1;
    scores.forEach((s, idx) => {
      if (idx === bestWordCol) return;
      const score = s.vietnameseScore - s.numberScore;
      if (score > maxMeaningScore) {
        maxMeaningScore = score;
        bestMeaningCol = idx;
      }
    });

    // Gán kết quả nếu tìm thấy
    if (bestWordCol !== -1) wordIdx = bestWordCol;
    if (bestMeaningCol !== -1) meaningIdx = bestMeaningCol;

    // Dự phòng an toàn tuyệt đối: nếu bảng chỉ có 2 cột bất kỳ
    if (wordIdx === -1 || meaningIdx === -1) {
      if (maxCols >= 2) {
        wordIdx = 0;
        meaningIdx = 1;
      }
    }
  }

  if (wordIdx === -1 || meaningIdx === -1 || wordIdx === meaningIdx) {
    throw new Error(
      "Không thể xác định được cột Từ Vựng và Nghĩa trong bảng tính. Hãy kiểm tra các tiêu đề cột (VD: 'Word', 'Meaning') hoặc thứ tự các cột!"
    );
  }

  const items: FlashcardItem[] = [];

  // Trích xuất dữ liệu từng dòng
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawWord = row[wordIdx]?.trim() || "";
    const rawMeaning = row[meaningIdx]?.trim() || "";

    // Bỏ qua dòng trống hoặc dòng tiêu đề bị lặp lại
    if (!rawWord || !rawMeaning) continue;
    const lowerWord = rawWord.toLowerCase();
    if (lowerWord === "word" || lowerWord === "từ vựng" || lowerWord === "vocabulary" || lowerWord === "term") {
      continue;
    }

    items.push({
      id: `card_${Date.now()}_${i}`,
      word: rawWord,
      meaning: rawMeaning,
      partOfSpeech: posIdx !== -1 && row[posIdx] ? row[posIdx].trim() : undefined,
      phonetic: phoneticIdx !== -1 && row[phoneticIdx] ? row[phoneticIdx].trim() : undefined,
      exampleSentence: exampleIdx !== -1 && row[exampleIdx] ? row[exampleIdx].trim() : undefined,
      exampleTranslation: transIdx !== -1 && row[transIdx] ? row[transIdx].trim() : undefined,
    });
  }

  return items;
}
