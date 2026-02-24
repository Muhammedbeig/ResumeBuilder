"use client";

import { useEffect, useState } from "react";
import { resolveApiUrl } from "@/lib/client-api";
import type { PricingCard } from "@/lib/panel-pricing";
import { fallbackPricingCards } from "@/lib/pricing-fallback-client";

type PricingCardsEnvelope = {
  cards?: PricingCard[];
};

function normalizeCards(payload: PricingCardsEnvelope | null): PricingCard[] {
  const rows = Array.isArray(payload?.cards) ? payload.cards : [];
  return rows.filter(
    (card): card is PricingCard =>
      Boolean(card) &&
      typeof card.packageId === "string" &&
      card.packageId.trim().length > 0,
  );
}

export function usePricingCards() {
  const [cards, setCards] = useState<PricingCard[]>(() => fallbackPricingCards());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch(resolveApiUrl("/api/subscription-packages"), {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Pricing cards request failed (${response.status})`);
        }

        const payload = (await response.json().catch(() => null)) as
          | PricingCardsEnvelope
          | null;
        const nextCards = normalizeCards(payload);
        if (!active) return;
        if (nextCards.length > 0) {
          setCards(nextCards);
        }
      } catch {
        if (!active) return;
        setCards((prev) => (prev.length > 0 ? prev : fallbackPricingCards()));
      } finally {
        if (active) setLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { cards, loaded };
}

