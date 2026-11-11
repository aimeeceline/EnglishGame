import { ref, get, set, update } from "firebase/database";
import { rtdb } from "./config";

export interface LeaderboardUser {
  rank?: number;
  uid: string;
  displayName: string;
  avatarColor?: string;
  totalWins: number;
  totalMatches: number;
  winRate: number;
  streak: number;
  score: number;
  lastPlayedAt?: number;
}

const AVATAR_COLORS = [
  "from-amber-500 to-yellow-600",
  "from-blue-600 to-sky-500",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-orange-500 to-amber-600"
];

function getRandomAvatarColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Ghi nhận kết quả trận đấu thực tế vào Bảng Xếp Hạng
 */
export async function recordUserMatch(
  uid: string,
  displayName: string,
  isWinner: boolean,
  matchScore: number
): Promise<void> {
  if (!uid) return;

  try {
    const userRef = ref(rtdb, `leaderboard/${uid}`);
    const snap = await get(userRef);

    let currentData: LeaderboardUser;
    if (snap.exists()) {
      currentData = snap.val() as LeaderboardUser;
      currentData.displayName = displayName || currentData.displayName;
      currentData.score = (currentData.score || 0) + matchScore;
      currentData.totalMatches = (currentData.totalMatches || 0) + 1;
      if (isWinner) {
        currentData.totalWins = (currentData.totalWins || 0) + 1;
        currentData.streak = (currentData.streak || 0) + 1;
      } else {
        currentData.streak = 0;
      }
      currentData.winRate = Math.round((currentData.totalWins / currentData.totalMatches) * 100);
      currentData.lastPlayedAt = Date.now();
    } else {
      currentData = {
        uid,
        displayName: displayName || "Người chơi",
        avatarColor: getRandomAvatarColor(uid),
        score: matchScore,
        totalMatches: 1,
        totalWins: isWinner ? 1 : 0,
        streak: isWinner ? 1 : 0,
        winRate: isWinner ? 100 : 0,
        lastPlayedAt: Date.now(),
      };
    }

    await set(userRef, currentData);

    // Lưu backup vào localStorage
    if (typeof window !== "undefined") {
      try {
        const localStats = JSON.parse(localStorage.getItem("user_leaderboard_stats") || "{}");
        localStats[uid] = currentData;
        localStorage.setItem("user_leaderboard_stats", JSON.stringify(localStats));
      } catch (e) {
        console.warn(e);
      }
    }
  } catch (err) {
    console.warn("Lỗi cập nhật leaderboard lên Firebase:", err);
    // Lưu local
    if (typeof window !== "undefined") {
      try {
        const localStats = JSON.parse(localStorage.getItem("user_leaderboard_stats") || "{}");
        const existing = localStats[uid] || {
          uid,
          displayName: displayName || "Người chơi",
          avatarColor: getRandomAvatarColor(uid),
          score: 0,
          totalMatches: 0,
          totalWins: 0,
          streak: 0,
          winRate: 0,
        };
        existing.displayName = displayName || existing.displayName;
        existing.score += matchScore;
        existing.totalMatches += 1;
        if (isWinner) {
          existing.totalWins += 1;
          existing.streak += 1;
        } else {
          existing.streak = 0;
        }
        existing.winRate = Math.round((existing.totalWins / existing.totalMatches) * 100);
        existing.lastPlayedAt = Date.now();
        localStats[uid] = existing;
        localStorage.setItem("user_leaderboard_stats", JSON.stringify(localStats));
      } catch (e) {
        console.warn(e);
      }
    }
  }
}

/**
 * Lấy danh sách bảng xếp hạng thực tế từ Firebase Realtime Database
 */
export async function getRealLeaderboard(): Promise<LeaderboardUser[]> {
  const usersMap = new Map<string, LeaderboardUser>();

  // 1. Thử lấy từ Firebase Realtime Database
  try {
    const lbRef = ref(rtdb, "leaderboard");
    const snap = await get(lbRef);
    if (snap.exists()) {
      const data = snap.val() as Record<string, LeaderboardUser>;
      Object.values(data).forEach(u => {
        if (u && u.uid) {
          if (!u.avatarColor) {
            u.avatarColor = getRandomAvatarColor(u.uid);
          }
          usersMap.set(u.uid, u);
        }
      });
    }
  } catch (err) {
    console.warn("Không thể kết nối Firebase Realtime Database leaderboard:", err);
  }

  // 2. Nạp thêm từ localStorage nếu có
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("user_leaderboard_stats");
      if (raw) {
        const localUsers = JSON.parse(raw) as Record<string, LeaderboardUser>;
        Object.values(localUsers).forEach(u => {
          if (u && u.uid && !usersMap.has(u.uid)) {
            if (!u.avatarColor) {
              u.avatarColor = getRandomAvatarColor(u.uid);
            }
            usersMap.set(u.uid, u);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Chuyển thành danh sách và sắp xếp theo điểm số (score) giảm dần, tiếp đến là số trận thắng
  const list = Array.from(usersMap.values());
  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.totalWins - a.totalWins;
  });

  // Gán thứ hạng
  return list.map((user, idx) => ({
    ...user,
    rank: idx + 1,
  }));
}
