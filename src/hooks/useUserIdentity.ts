"use client";

import { useState, useEffect } from "react";

const FUN_NAMES = [
  "Cú Mèo Siêu Cấp",
  "Gấu Trúc Sát Thủ",
  "Cáo Lanh Lợi",
  "Hổ Dũng Mãnh",
  "Đại Bàng Săn Từ",
  "Sói Cô Độc",
  "Sư Tử Bất Bại",
  "Cá Heo Thông Thái",
  "Chim Ưng Tốc Độ",
  "Chiến Binh Rồng"
];

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-blue-600"
];

export interface UserIdentity {
  uid: string;
  displayName: string;
  avatarColor: string;
}

export function useUserIdentity() {
  const [user, setUser] = useState<UserIdentity>({
    uid: "guest_init",
    displayName: "Người chơi",
    avatarColor: AVATAR_COLORS[0],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedUid = localStorage.getItem("engduel_uid");
    const savedName = localStorage.getItem("engduel_name");
    const savedColor = localStorage.getItem("engduel_color");

    const uid = savedUid || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const displayName = savedName || FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    const avatarColor = savedColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    if (!savedUid) localStorage.setItem("engduel_uid", uid);
    if (!savedName) localStorage.setItem("engduel_name", displayName);
    if (!savedColor) localStorage.setItem("engduel_color", avatarColor);

    setUser({ uid, displayName, avatarColor });
    setIsLoaded(true);
  }, []);

  const updateName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    localStorage.setItem("engduel_name", trimmed);
    setUser(prev => ({ ...prev, displayName: trimmed }));
  };

  return { user, isLoaded, updateName };
}

