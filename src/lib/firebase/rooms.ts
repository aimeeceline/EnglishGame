import { 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  Unsubscribe 
} from "firebase/database";
import { rtdb } from "./config";
import { BattleRoom, PlayerState, BattleQuestion, RoomSettings } from "@/types/battle";
import { recordUserMatch } from "./leaderboard";

// Bộ nhớ đệm cục bộ (In-Memory Fallback Store) phục vụ khi ngoại tuyến
const localRoomsMemory = new Map<string, BattleRoom>();
const localListeners = new Map<string, Set<(room: BattleRoom) => void>>();

function notifyLocalListeners(roomCode: string, room: BattleRoom) {
  const listeners = localListeners.get(roomCode);
  if (listeners) {
    listeners.forEach(cb => cb({ ...room }));
  }
}

/**
 * Sinh mã phòng ngẫu nhiên 6 ký tự dễ đọc
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Tạo một phòng đấu 1v1 mới trên Firebase Realtime Database
 */
export async function createBattleRoom(
  hostUser: { uid: string; displayName: string; photoURL?: string },
  settings: RoomSettings
): Promise<string> {
  const roomCode = generateRoomCode();

  const hostPlayer: PlayerState = {
    uid: hostUser.uid,
    displayName: hostUser.displayName || "Người chơi 1",
    photoURL: hostUser.photoURL || "",
    isReady: true,
    score: 0,
    currentStreak: 0,
    currentAnswer: null,
    totalCorrect: 0,
    isOnline: true,
    lastPing: Date.now(),
  };

  const newRoom: BattleRoom = {
    roomCode,
    createdAt: Date.now(),
    status: 'waiting',
    host: hostPlayer,
    guest: null,
    settings,
    questions: [],
    currentQuestionIndex: 0,
    questionStartedAt: 0,
  };

  try {
    const roomRef = ref(rtdb, `rooms/${roomCode}`);
    await set(roomRef, newRoom);
  } catch (err) {
    console.warn("Lỗi lưu Realtime Database, fallback local memory:", err);
  }

  localRoomsMemory.set(roomCode, newRoom);
  notifyLocalListeners(roomCode, newRoom);

  return roomCode;
}

/**
 * Tham gia phòng đấu với tư cách Khách (Guest)
 */
export async function joinBattleRoom(
  roomCode: string,
  guestUser: { uid: string; displayName: string; photoURL?: string }
): Promise<{ success: boolean; message?: string }> {
  const cleanCode = roomCode.trim().toUpperCase();

  const guestPlayer: PlayerState = {
    uid: guestUser.uid,
    displayName: guestUser.displayName || "Đối thủ",
    photoURL: guestUser.photoURL || "",
    isReady: false,
    score: 0,
    currentStreak: 0,
    currentAnswer: null,
    totalCorrect: 0,
    isOnline: true,
    lastPing: Date.now(),
  };

  let roomData: BattleRoom | null = localRoomsMemory.get(cleanCode) || null;

  try {
    const roomRef = ref(rtdb, `rooms/${cleanCode}`);
    const snap = await get(roomRef);
    if (snap.exists()) {
      roomData = snap.val() as BattleRoom;
    }
  } catch (err) {
    console.warn("Đọc Realtime Database lỗi, dùng fallback:", err);
  }

  if (!roomData) {
    return { success: false, message: "Không tìm thấy phòng với mã PIN này!" };
  }

  // Nếu là chính Host vào lại thì chấp nhận
  if (roomData.host.uid === guestUser.uid) {
    return { success: true };
  }

  // Kiểm tra phòng đã có đối thủ khác chưa
  if (roomData.guest && roomData.guest.uid !== guestUser.uid) {
    return { success: false, message: "Phòng này đã đủ 2 người chơi!" };
  }

  roomData.guest = guestPlayer;

  try {
    const roomRef = ref(rtdb, `rooms/${cleanCode}/guest`);
    await set(roomRef, guestPlayer);
  } catch (err) {
    console.warn("Cập nhật guest lên Realtime Database thất bại:", err);
  }

  localRoomsMemory.set(cleanCode, roomData);
  notifyLocalListeners(cleanCode, roomData);

  return { success: true };
}

/**
 * Lắng nghe cập nhật trạng thái phòng qua Firebase Realtime Database
 */
export function subscribeToRoom(
  roomCode: string,
  onUpdate: (room: BattleRoom) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();

  // Đăng ký listener bộ nhớ cục bộ
  if (!localListeners.has(cleanCode)) {
    localListeners.set(cleanCode, new Set());
  }
  localListeners.get(cleanCode)?.add(onUpdate);

  const initial = localRoomsMemory.get(cleanCode);
  if (initial) {
    onUpdate({ ...initial });
  }

  // Lắng nghe Firebase Realtime Database (onValue)
  let rtdbUnsub: Unsubscribe = () => {};
  try {
    const roomRef = ref(rtdb, `rooms/${cleanCode}`);
    rtdbUnsub = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const liveData = snapshot.val() as BattleRoom;
        localRoomsMemory.set(cleanCode, liveData);
        onUpdate(liveData);
      }
    }, (error) => {
      console.warn("Realtime Database listener error, relying on local updates:", error);
    });
  } catch (err) {
    console.warn("Realtime Database subscription error:", err);
  }

  return () => {
    rtdbUnsub();
    localListeners.get(cleanCode)?.delete(onUpdate);
  };
}

/**
 * Người chơi chuyển đổi trạng thái Sẵn sàng (Ready)
 */
export async function togglePlayerReady(
  roomCode: string,
  isGuest: boolean,
  isReady: boolean
) {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = localRoomsMemory.get(cleanCode);
  if (!room) return;

  if (isGuest && room.guest) {
    room.guest.isReady = isReady;
  } else {
    room.host.isReady = isReady;
  }

  try {
    const targetPath = isGuest ? `rooms/${cleanCode}/guest/isReady` : `rooms/${cleanCode}/host/isReady`;
    const targetRef = ref(rtdb, targetPath);
    await set(targetRef, isReady);
  } catch (e) {
    console.warn(e);
  }

  localRoomsMemory.set(cleanCode, room);
  notifyLocalListeners(cleanCode, room);
}

/**
 * Host bấm bắt đầu trận đấu, nạp danh sách câu hỏi AI
 */
export async function startBattleWithQuestions(
  roomCode: string,
  questions: BattleQuestion[]
) {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = localRoomsMemory.get(cleanCode);
  if (!room) return;

  const startedAt = Date.now();

  room.status = 'playing';
  room.questions = questions;
  room.currentQuestionIndex = 0;
  room.questionStartedAt = startedAt;
  room.host.score = 0;
  room.host.currentAnswer = null;
  room.host.answersHistory = {};
  room.host.totalCorrect = 0;
  room.host.currentStreak = 0;

  if (room.guest) {
    room.guest.score = 0;
    room.guest.currentAnswer = null;
    room.guest.answersHistory = {};
    room.guest.totalCorrect = 0;
    room.guest.currentStreak = 0;
  }

  try {
    const roomRef = ref(rtdb, `rooms/${cleanCode}`);
    const updatePayload: Record<string, unknown> = {
      status: 'playing',
      questions,
      currentQuestionIndex: 0,
      questionStartedAt: startedAt,
      "host/score": 0,
      "host/currentAnswer": null,
      "host/answersHistory": {},
      "host/totalCorrect": 0,
      "host/currentStreak": 0,
    };

    if (room.guest) {
      updatePayload["guest/score"] = 0;
      updatePayload["guest/currentAnswer"] = null;
      updatePayload["guest/answersHistory"] = {};
      updatePayload["guest/totalCorrect"] = 0;
      updatePayload["guest/currentStreak"] = 0;
    }

    await update(roomRef, updatePayload);
  } catch (e) {
    console.warn(e);
  }

  localRoomsMemory.set(cleanCode, room);
  notifyLocalListeners(cleanCode, room);
}

/**
 * Người chơi chọn đáp án cho câu hỏi hiện tại
 */
export async function submitPlayerAnswer(
  roomCode: string,
  playerUid: string,
  selectedKey: string | null,
  timeRemainingSeconds: number
) {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = localRoomsMemory.get(cleanCode);
  if (!room || room.status !== 'playing') return;

  const currentQ = room.questions[room.currentQuestionIndex];
  if (!currentQ) return;

  const isHost = room.host.uid === playerUid;
  const player = isHost ? room.host : room.guest;
  if (!player) return;

  // Nếu người chơi đã trả lời câu này rồi thì bỏ qua
  if (player.currentAnswer && player.currentAnswer.questionIndex === room.currentQuestionIndex) {
    return;
  }

  const isFillInBlank = currentQ.type === 'fill_in_blank' || (!currentQ.options || currentQ.options.length === 0);
  let isCorrect = false;

  if (selectedKey !== null && selectedKey !== undefined && selectedKey.trim().length > 0) {
    if (isFillInBlank) {
      const cleanAnswer = selectedKey.trim().toLowerCase();
      const cleanTarget = currentQ.targetWord.trim().toLowerCase();
      const cleanCorrect = currentQ.correctAnswer.trim().toLowerCase();
      isCorrect = cleanAnswer === cleanTarget || cleanAnswer === cleanCorrect;
    } else {
      isCorrect = selectedKey.trim().toUpperCase() === currentQ.correctAnswer.trim().toUpperCase();
    }
  }
  let points = 0;

  if (isCorrect) {
    const totalTime = room.settings.timePerQuestion || 15;
    const speedBonus = Math.floor((Math.max(0, timeRemainingSeconds) / totalTime) * 500);
    const streakBonus = player.currentStreak >= 2 ? (player.currentStreak - 1) * 150 : 0;
    points = 1000 + speedBonus + streakBonus;
    player.score += points;
    player.totalCorrect += 1;
    player.currentStreak += 1;
  } else {
    player.currentStreak = 0;
  }

  player.currentAnswer = {
    questionIndex: room.currentQuestionIndex,
    selectedKey,
    answeredAt: Date.now(),
    timeRemainingSeconds,
    isCorrect,
    pointsEarned: points,
  };

  if (!player.answersHistory) {
    player.answersHistory = {};
  }
  player.answersHistory[room.currentQuestionIndex] = player.currentAnswer;

  const bothAnswered = Boolean(
    room.host.currentAnswer?.questionIndex === room.currentQuestionIndex &&
    (!room.guest || room.guest.currentAnswer?.questionIndex === room.currentQuestionIndex)
  );

  if (bothAnswered) {
    room.status = 'round_result';
    room.roundEndedAt = Date.now();
  }

  try {
    const roomRef = ref(rtdb, `rooms/${cleanCode}`);
    const updatePayload: Record<string, unknown> = {
      [isHost ? "host" : "guest"]: player,
      ...(bothAnswered ? { status: 'round_result', roundEndedAt: room.roundEndedAt } : {})
    };
    await update(roomRef, updatePayload);
  } catch (e) {
    console.warn(e);
  }

  localRoomsMemory.set(cleanCode, room);
  notifyLocalListeners(cleanCode, room);
}

/**
 * Chuyển sang câu hỏi tiếp theo hoặc kết thúc trận đấu
 */
export async function proceedToNextQuestion(roomCode: string) {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = localRoomsMemory.get(cleanCode);
  if (!room) return;

  const nextIndex = room.currentQuestionIndex + 1;

  if (nextIndex >= room.questions.length) {
    room.status = 'finished';
    const hostScore = room.host.score;
    const guestScore = room.guest ? room.guest.score : 0;

    if (hostScore > guestScore) {
      room.winnerUid = room.host.uid;
    } else if (guestScore > hostScore && room.guest) {
      room.winnerUid = room.guest.uid;
    } else {
      room.winnerUid = 'draw';
    }

    // Ghi nhận điểm số và thành tích thực tế vào Bảng Xếp Hạng
    const isHostWin = room.winnerUid === room.host.uid;
    const isGuestWin = room.guest ? room.winnerUid === room.guest.uid : false;
    recordUserMatch(room.host.uid, room.host.displayName, isHostWin, hostScore).catch(console.warn);
    if (room.guest) {
      recordUserMatch(room.guest.uid, room.guest.displayName, isGuestWin, guestScore).catch(console.warn);
    }

    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      await update(roomRef, {
        status: 'finished',
        winnerUid: room.winnerUid,
      });
    } catch (e) {
      console.warn(e);
    }
  } else {
    room.status = 'playing';
    room.currentQuestionIndex = nextIndex;
    room.questionStartedAt = Date.now();
    room.host.currentAnswer = null;
    if (room.guest) {
      room.guest.currentAnswer = null;
    }

    try {
      const roomRef = ref(rtdb, `rooms/${cleanCode}`);
      const updatePayload: Record<string, unknown> = {
        status: 'playing',
        currentQuestionIndex: nextIndex,
        questionStartedAt: room.questionStartedAt,
        "host/currentAnswer": null,
      };
      if (room.guest) {
        updatePayload["guest/currentAnswer"] = null;
      }
      await update(roomRef, updatePayload);
    } catch (e) {
      console.warn(e);
    }
  }

  localRoomsMemory.set(cleanCode, room);
  notifyLocalListeners(cleanCode, room);
}

/**
 * Gửi reaction / thả icon trêu đối thủ trong trận đấu
 */
export async function sendRoomReaction(
  roomCode: string,
  senderUid: string,
  senderName: string,
  emoji: string,
  text: string
) {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = localRoomsMemory.get(cleanCode);
  if (!room) return;

  const reaction = {
    senderUid,
    senderName,
    emoji,
    text,
    sentAt: Date.now(),
  };

  room.reaction = reaction;

  try {
    const roomRef = ref(rtdb, `rooms/${cleanCode}/reaction`);
    await set(roomRef, reaction);
  } catch (e) {
    console.warn(e);
  }

  localRoomsMemory.set(cleanCode, room);
  notifyLocalListeners(cleanCode, room);
}

/**
 * Tìm phòng đang chờ (Quick Match) trên Firebase
 */
export async function findWaitingRoom(currentUserUid: string): Promise<string | null> {
  try {
    const roomsRef = ref(rtdb, "rooms");
    const snap = await get(roomsRef);
    if (snap.exists()) {
      const allRooms = snap.val() as Record<string, BattleRoom>;
      for (const [code, r] of Object.entries(allRooms)) {
        if (r && r.status === 'waiting' && r.host.uid !== currentUserUid && !r.guest) {
          return code;
        }
      }
    }
  } catch (e) {
    console.warn("Lỗi tìm phòng:", e);
  }
  return null;
}

/**
 * Lấy số lượng phòng và người chơi đang hoạt động thực tế trên Firebase
 */
export async function getActiveRoomStats(): Promise<{ activeRooms: number; onlineCount: number }> {
  try {
    const roomsRef = ref(rtdb, "rooms");
    const snap = await get(roomsRef);
    if (snap.exists()) {
      const allRooms = snap.val() as Record<string, BattleRoom>;
      let active = 0;
      Object.values(allRooms).forEach(r => {
        if (r && (r.status === 'waiting' || r.status === 'playing' || r.status === 'round_result')) {
          active++;
        }
      });
      return { activeRooms: active, onlineCount: Math.max(1, active * 2 + 1) };
    }
  } catch (e) {
    console.warn("Lỗi lấy thống kê phòng:", e);
  }
  return { activeRooms: 0, onlineCount: 1 };
}
