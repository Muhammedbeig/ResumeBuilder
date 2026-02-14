"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  getPlanChoiceCookieKey,
  getPlanChoiceStorageKey,
  parsePlanChoice,
  type PlanChoice,
} from "@/lib/plan-choice";

export type { PlanChoice } from "@/lib/plan-choice";

interface PlanChoiceContextType {
  planChoice: PlanChoice | null;
  isLoaded: boolean;
  setPlanChoice: (choice: PlanChoice) => void;
  clearPlanChoice: () => void;
}

const PlanChoiceContext = createContext<PlanChoiceContextType | undefined>(undefined);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const entries = document.cookie.split(";").map((item) => item.trim());
  for (const entry of entries) {
    if (entry.startsWith(`${name}=`)) {
      return entry.slice(name.length + 1);
    }
  }
  return null;
}

function writeCookieValue(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function clearCookieValue(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function PlanChoiceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [planChoice, setPlanChoiceState] = useState<PlanChoice | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const userId = status === "authenticated" ? session?.user?.id ?? null : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPlanChoiceState(null);
    setIsLoaded(false);
    if (status === "loading") return;

    const storageKey = getPlanChoiceStorageKey(userId);
    const cookieKey = getPlanChoiceCookieKey(userId);
    const stored = localStorage.getItem(storageKey);
    let initialChoice: PlanChoice | null = parsePlanChoice(stored);
    if (!initialChoice) {
      const cookieChoice = parsePlanChoice(readCookieValue(cookieKey));
      if (cookieChoice) {
        initialChoice = cookieChoice;
        localStorage.setItem(storageKey, cookieChoice);
      }
    }

    setPlanChoiceState(initialChoice);
    setIsLoaded(true);
  }, [status, userId]);

  const setPlanChoice = useCallback((choice: PlanChoice) => {
    setPlanChoiceState(choice);
    if (typeof window !== "undefined") {
      const storageKey = getPlanChoiceStorageKey(userId);
      const cookieKey = getPlanChoiceCookieKey(userId);
      localStorage.setItem(storageKey, choice);
      writeCookieValue(cookieKey, choice);
    }
  }, [userId]);

  const clearPlanChoice = useCallback(() => {
    setPlanChoiceState(null);
    if (typeof window !== "undefined") {
      const storageKey = getPlanChoiceStorageKey(userId);
      const cookieKey = getPlanChoiceCookieKey(userId);
      localStorage.removeItem(storageKey);
      clearCookieValue(cookieKey);
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      planChoice,
      isLoaded,
      setPlanChoice,
      clearPlanChoice,
    }),
    [planChoice, isLoaded, setPlanChoice, clearPlanChoice]
  );

  return <PlanChoiceContext.Provider value={value}>{children}</PlanChoiceContext.Provider>;
}

export function usePlanChoice() {
  const context = useContext(PlanChoiceContext);
  if (!context) {
    throw new Error("usePlanChoice must be used within a PlanChoiceProvider");
  }
  return context;
}
