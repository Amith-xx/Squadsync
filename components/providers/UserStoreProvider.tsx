"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import type { Position, PlayerAttributes, BanType } from "@/types";

interface Props {
  children: React.ReactNode;
  userId: string;
  name: string;
  email: string;
  image: string;
  position?: Position;
  attributes?: PlayerAttributes;
  karmaScore: number;
  isBanned: boolean;
  banType: BanType;
  onboardingComplete: boolean;
  matchesPlayed: number;
  region?: string;
}

export function UserStoreProvider({
  children,
  userId,
  name,
  email,
  image,
  position,
  attributes,
  karmaScore,
  isBanned,
  banType,
  onboardingComplete,
  matchesPlayed,
  region,
}: Props) {
  const setUser = useUserStore((s) => s.setUser);
  const setLoading = useUserStore((s) => s.setLoading);

  useEffect(() => {
    setUser({
      id: userId,
      name,
      email,
      image,
      position: position ?? null,
      attributes: attributes ?? null,
      karmaScore,
      isBanned,
      banType,
      onboardingComplete,
      matchesPlayed,
      region: region ?? null,
    });
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return <>{children}</>;
}
