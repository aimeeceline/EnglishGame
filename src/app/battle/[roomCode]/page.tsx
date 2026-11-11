"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import RoomLobby from "@/components/battle/RoomLobby";
import AIThinkingScreen from "@/components/battle/AIThinkingScreen";
import BattleArena from "@/components/battle/BattleArena";
import MatchResultModal from "@/components/battle/MatchResultModal";
import { BattleRoom, BattleQuestion } from "@/types/battle";
import { subscribeToRoom, startBattleWithQuestions } from "@/lib/firebase/rooms";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { generateBattleQuestions } from "@/lib/ai/gemini";
import { getDeckById, syncGoogleSheetDeck } from "@/lib/firebase/decks";
import { FlashcardItem, VocabDeck } from "@/types/vocab";
import { Loader2, LogOut } from "lucide-react";
import { useActiveBattle } from "@/hooks/useActiveBattle";

export default function BattleRoomPage({
  params,
}: {
  params: { roomCode: string };
}) {
  const roomCode = params.roomCode.toUpperCase();

  const router = useRouter();
  const { user, isLoaded } = useUserIdentity();
  const { saveActiveBattle, clearActiveBattle } = useActiveBattle();

  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Lắng nghe trạng thái phòng qua Firebase Realtime Database
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToRoom(roomCode, (updatedRoom) => {
      setRoom(updatedRoom);
    });
    return () => unsub();
  }, [roomCode]);

  // Tự động lưu hoặc dọn dẹp active session khi phòng thay đổi trạng thái
  useEffect(() => {
    if (!room) return;
    if (room.status === 'finished') {
      clearActiveBattle();
    } else {
      saveActiveBattle({
        roomCode: room.roomCode,
        deckTitle: room.settings.deckTitle,
        status: room.status,
        timestamp: Date.now(),
      });
    }
  }, [room, saveActiveBattle, clearActiveBattle]);

  if (!isLoaded || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-600">
            Đang kết nối vào phòng {roomCode}...
          </p>
        </div>
      </div>
    );
  }

  // Host bấm bắt đầu trận đấu -> Tự động kéo từ mới nhất từ Sheet rồi gọi Gemini AI sinh đề
  const handleStartGame = async () => {
    setIsStarting(true);

    let cardsPool: FlashcardItem[] = [];

    // Tìm deck từ Firebase hoặc LocalStorage
    const liveDeck = await getDeckById(room.settings.deckId);
    if (liveDeck) {
      if (liveDeck.sourceType === "google_sheet" && liveDeck.googleSheetUrl) {
        // Tự động kéo từ vựng mới nhất từ Google Sheet trước khi bắt đầu trận đấu
        const freshDeck = await syncGoogleSheetDeck(room.settings.deckId);
        cardsPool = freshDeck && freshDeck.cards.length > 0 ? freshDeck.cards : liveDeck.cards;
      } else {
        cardsPool = liveDeck.cards;
      }
    }

    if (cardsPool.length === 0) {
      alert("Không tìm thấy từ vựng trong bộ thẻ này để tạo câu hỏi! Vui lòng kiểm tra lại bộ thẻ hoặc cập nhật từ Google Sheet.");
      setIsStarting(false);
      return;
    }

    try {
      let questions: BattleQuestion[] = [];

      // Ưu tiên gọi API route server (để bảo vệ an toàn GEMINI_API_KEY)
      try {
        const res = await fetch("/api/ai/generate-battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cards: cardsPool,
            totalQuestions: room.settings.totalQuestions,
            difficulty: room.settings.difficulty,
            gameMode: room.settings.gameMode || 'mixed',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            questions = data.questions;
          }
        }
      } catch (apiErr) {
        console.warn("Gọi API server thất bại, chuyển sang client fallback:", apiErr);
      }

      // Dự phòng client nếu server không phản hồi
      if (questions.length === 0) {
        questions = await generateBattleQuestions(
          cardsPool,
          room.settings.totalQuestions,
          room.settings.difficulty,
          room.settings.gameMode || 'mixed'
        );
      }

      // Nạp đề vào phòng và chuyển status = 'playing' đồng bộ cho cả 2 máy
      await startBattleWithQuestions(room.roomCode, questions);
    } catch (err) {
      console.error("Lỗi khởi tạo trận đấu:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRematch = async () => {
    await handleStartGame();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center">
        {room.status === 'waiting' && (
          <RoomLobby
            room={room}
            currentUserUid={user.uid}
            onStartGame={handleStartGame}
            isStarting={isStarting}
          />
        )}

        {room.status === 'generating' && (
          <AIThinkingScreen deckTitle={room.settings.deckTitle} />
        )}

        {(room.status === 'playing' || room.status === 'round_result') && (
          <BattleArena
            room={room}
            currentUserUid={user.uid}
          />
        )}

        {room.status === 'finished' && (
          <MatchResultModal
            room={room}
            currentUserUid={user.uid}
            onRematch={handleRematch}
          />
        )}
      </main>
    </div>
  );
}
