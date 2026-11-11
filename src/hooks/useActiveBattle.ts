"use client";

import { useState, useEffect, useCallback } from "react";
import { ref, get } from "firebase/database";
import { rtdb } from "@/lib/firebase/config";

export interface ActiveBattleSession {
  roomCode: string;
  deckTitle: string;
  status: string;
  timestamp: number;
}

const STORAGE_KEY = "active_battle_session";

export function useActiveBattle() {
  const [activeBattle, setActiveBattle] = useState<ActiveBattleSession | null>(null);

  const checkActiveBattle = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setActiveBattle(null);
        return;
      }

      const session = JSON.parse(raw) as ActiveBattleSession;
      // Quá 30 phút thì tự hủy session
      if (!session.roomCode || Date.now() - session.timestamp > 30 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        setActiveBattle(null);
        return;
      }

      // Kiểm tra thực tế trên Firebase nếu phòng đã finished thì xóa bỏ
      try {
        const roomRef = ref(rtdb, `rooms/${session.roomCode}`);
        const snap = await get(roomRef);
        if (snap.exists()) {
          const roomData = snap.val();
          if (roomData.status === 'finished') {
            localStorage.removeItem(STORAGE_KEY);
            setActiveBattle(null);
            return;
          }
        }
      } catch (err) {
        // Nếu offline, tạm thời vẫn giữ session
      }

      setActiveBattle(session);
    } catch {
      setActiveBattle(null);
    }
  }, []);

  const saveActiveBattle = useCallback((session: ActiveBattleSession) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setActiveBattle(session);
    window.dispatchEvent(new Event("active_battle_changed"));
  }, []);

  const clearActiveBattle = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setActiveBattle(null);
    window.dispatchEvent(new Event("active_battle_changed"));
  }, []);

  useEffect(() => {
    checkActiveBattle();

    const handleStorageChange = () => {
      checkActiveBattle();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("active_battle_changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("active_battle_changed", handleStorageChange);
    };
  }, [checkActiveBattle]);

  return {
    activeBattle,
    saveActiveBattle,
    clearActiveBattle,
  };
}

