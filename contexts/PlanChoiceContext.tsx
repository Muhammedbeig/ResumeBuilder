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

export type PlanChoice = "free" | "paid";

interface PlanChoiceContextType {
  planChoice: PlanChoice | null;
  isLoaded: boolean;
  setPlanChoice: (choice: PlanChoice) => void;
  clearPlanChoice: () => void;
}

const PlanChoiceContext = createContext<PlanChoiceContextType | undefined>(undefined);

const STORAGE_KEY = "resupro_plan_choice";
const COOKIE_KEY = "resupro_plan_choice";
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
  const [planChoice, setPlanChoiceState] = useState<PlanChoice | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    let initialChoice: PlanChoice | null =
      stored === "free" || stored === "paid" ? stored : null;

    if (!initialChoice) {
      const cookieChoice = readCookieValue(COOKIE_KEY);
      if (cookieChoice === "free" || cookieChoice === "paid") {
        initialChoice = cookieChoice;
        localStorage.setItem(STORAGE_KEY, cookieChoice);
      }
    }

    setPlanChoiceState(initialChoice);
    setIsLoaded(true);
  }, []);

  const setPlanChoice = useCallback((choice: PlanChoice) => {
    setPlanChoiceState(choice);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, choice);
      writeCookieValue(COOKIE_KEY, choice);
    }
  }, []);

  const clearPlanChoice = useCallback(() => {
    setPlanChoiceState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      clearCookieValue(COOKIE_KEY);
    }
  }, []);

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
