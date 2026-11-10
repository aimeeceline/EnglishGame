import { FlashcardItem } from "@/types/vocab";

/**
 * Hàm bỏ dấu tiếng Việt chuẩn xác (VD: "Từ vựng" -> "tuvung", "Nghĩa tiếng Việt" -> "nghiatiengviet")
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Trích xuất Sheet ID và GID từ liên kết Google Sheet
 */
export function extractGoogleSheetInfo(url: string): { sheetId: string; gid: string } | null {
  try {
    const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch || !sheetIdMatch[1]) {
      return null;
    }
    const sheetId = sheetIdMatch[1];

    let gid = "0";
    const gidMatch = url.match(/[#?&]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    return { sheetId, gid };
  } catch (error) {
    console.error("Lỗi trích xuất thông tin Google Sheet:", error);
    return null;
  }
}

/**
 * Tạo URL xuất CSV từ Google Sheet
 */
export function getGoogleSheetCsvUrl(url: string): string | null {
  const info = extractGoogleSheetInfo(url);
  if (!info) return null;
  return `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
}

/**
 * Tách dòng CSV có xử lý dấu ngoặc kép an toàn
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse nội dung CSV thành danh sách FlashcardItem với khả năng tự nhận diện tiếng Việt không dấu & có dấu
 */
export function parseVocabCsv(csvText: string): FlashcardItem[] {
  // Kiểm tra nếu nội dung trả về là trang HTML đăng nhập Google
  if (csvText.includes("<!DOCTYPE html") || csvText.includes("<html")) {
    throw new Error(
      "Bảng tính Google Sheet này đang bị KHÓA RIÊNG TƯ. Hãy mở file Sheet, bấm nút 'Chia sẻ' (Share) góc trên bên phải và chọn 'Bất kỳ ai có đường liên kết đều có thể xem' (Anyone with the link - Viewer)!"
    );
  }

  const rawLines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (rawLines.length === 0) return [];

  const parsedRows = rawLines.map(line => parseCsvLine(line));

  // 1. Tìm dòng chứa Header (Có thể là dòng 0 hoặc dòng 1 nếu có dòng trống)
  let headerRowIndex = -1;
  let wordIdx = -1;
  let meaningIdx = -1;
  let phoneticIdx = -1;
  let posIdx = -1;
  let exampleIdx = -1;
  let transIdx = -1;

  for (let r = 0; r < Math.min(5, parsedRows.length); r++) {
    const rowNormalized = parsedRows[r].map(cell => removeVietnameseTones(cell));

    const wIdx = rowNormalized.findIndex(h => 
      ['word', 'tu', 'tuvung', 'term', 'vocabulary', 'tienganh', 'english'].some(k => h.includes(k))
    );
    const mIdx = rowNormalized.findIndex(h => 
      ['meaning', 'nghia', 'dinhnghia', 'tiengviet', 'vietnamese', 'dich', 'nghiatiengviet'].some(k => h.includes(k))
    );

    if (wIdx !== -1 || mIdx !== -1) {
      headerRowIndex = r;
      wordIdx = wIdx;
      meaningIdx = mIdx;

      phoneticIdx = rowNormalized.findIndex(h => 
        ['phonetic', 'ipa', 'phienam', 'phienamipa', 'pronunciation'].some(k => h.includes(k))
      );
      posIdx = rowNormalized.findIndex(h => 
        ['pos', 'partofspeech', 'tuloai', 'type', 'loaitu'].some(k => h.includes(k))
      );
      exampleIdx = rowNormalized.findIndex(h => 
        ['example', 'vidu', 'cauvidu', 'sentence'].some(k => h.includes(k))
      );
      transIdx = rowNormalized.findIndex(h => 
        ['translation', 'dichcau', 'dichvidu'].some(k => h.includes(k))
      );
      break;
    }
  }

  // 2. Nếu không tìm thấy qua Header, dùng phân tích tự động cột (Heuristic Column Detection)
  if (wordIdx === -1 || meaningIdx === -1) {
    headerRowIndex = 0;
    // Tìm cột chứa chữ tiếng Anh và cột chứa tiếng Việt trong các dòng dữ liệu
    const sampleRows = parsedRows.slice(1, Math.min(6, parsedRows.length));
    
    // Mặc định: bỏ qua cột số thứ tự (nếu cột chứa số 1, 2, 3)
    const colScores = new Map<number, { isEnglish: number; hasVietnamese: number; isNumber: number }>();
    
    sampleRows.forEach(row => {
      row.forEach((val, idx) => {
        if (!colScores.has(idx)) {
          colScores.set(idx, { isEnglish: 0, hasVietnamese: 0, isNumber: 0 });
        }
        const score = colScores.get(idx)!;
        const trimmed = val.trim();
        if (/^\d+$/.test(trimmed)) {
          score.isNumber += 1;
        } else if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
          score.hasVietnamese += 1;
        } else if (/^[a-zA-Z\s-]+$/.test(trimmed) && trimmed.length > 2) {
          score.isEnglish += 1;
        }
      });
    });

    let bestEnglishCol = -1;
    let maxEnglishScore = 0;
    let bestVietnameseCol = -1;
    let maxVietnameseScore = 0;

    colScores.forEach((score, colIdx) => {
      if (score.isEnglish > maxEnglishScore) {
        maxEnglishScore = score.isEnglish;
        bestEnglishCol = colIdx;
      }
      if (score.hasVietnamese > maxVietnameseScore) {
        maxVietnameseScore = score.hasVietnamese;
        bestVietnameseCol = colIdx;
      }
    });

    if (bestEnglishCol !== -1) wordIdx = bestEnglishCol;
    if (bestVietnameseCol !== -1) meaningIdx = bestVietnameseCol;
  }

  // Nếu vẫn chưa tìm ra, mặc định cột 1 và 2 (bỏ qua cột 0 nếu trống)
  if (wordIdx === -1) wordIdx = parsedRows[0].length > 2 ? 1 : 0;
  if (meaningIdx === -1) meaningIdx = parsedRows[0].length > 3 ? 3 : 1;

  const items: FlashcardItem[] = [];

  for (let i = headerRowIndex + 1; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (!row || row.length === 0) continue;

    const rawWord = row[wordIdx]?.trim() || "";
    const rawMeaning = row[meaningIdx]?.trim() || "";

    // Bỏ qua dòng trống hoặc dòng header lặp lại
    if (!rawWord || !rawMeaning || rawWord.toLowerCase() === "word" || rawWord.toLowerCase() === "từ vựng") {
      continue;
    }

    items.push({
      id: `card_${Date.now()}_${i}`,
      word: rawWord,
      meaning: rawMeaning,
      partOfSpeech: posIdx !== -1 ? row[posIdx]?.trim() : undefined,
      phonetic: phoneticIdx !== -1 ? row[phoneticIdx]?.trim() : undefined,
      exampleSentence: exampleIdx !== -1 ? row[exampleIdx]?.trim() : undefined,
      exampleTranslation: transIdx !== -1 ? row[transIdx]?.trim() : undefined,
    });
  }

  return items;
}
