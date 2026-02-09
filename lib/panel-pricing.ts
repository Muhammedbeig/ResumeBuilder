import { panelGet } from "@/lib/panel-api";

export type PanelPackage = {
  id: number;
  name: string;
  translated_name?: string;
  description: string;
  translated_description?: string;
  final_price: number;
  formatted_final_price?: string;
  duration: string;
  key_points?: string[]; // decoded by the Panel API
};

export type PricingCardIcon = "sparkles" | "zap" | "crown";

export type PricingCard = {
  packageId: string;
  isPaid: boolean;
  isPopular: boolean;
  duration: string;
  finalPrice: number;
  name: string;
  subtitle: string;
  description: string;
  priceLabel: string;
  features: string[];
  cta: string;
  gradient: string;
  icon: PricingCardIcon;
};

function durationToIntervalSuffix(durationRaw: string): string {
  const duration = String(durationRaw ?? "").trim().toLowerCase();
  if (!duration) return "";
  if (duration === "unlimited") return "";

  const days = Number.parseInt(duration, 10);
  if (!Number.isFinite(days)) return "";

  if (days === 7) return "/week";
  if (days >= 28 && days <= 31) return "/mo";
  if (days >= 360) return "/yr";
  return "";
}

function packageTitle(p: PanelPackage): string {
  return p.translated_name?.trim() || p.name?.trim() || "Package";
}

function packageDescription(p: PanelPackage): string {
  return p.translated_description?.trim() || p.description?.trim() || "";
}

function packageFeatures(p: PanelPackage): string[] {
  const features = Array.isArray(p.key_points) ? p.key_points : [];
  return features.filter((f) => typeof f === "string" && f.trim().length > 0);
}

function packagePriceLabel(p: PanelPackage): string {
  const rawBase =
    typeof p.formatted_final_price === "string" && p.formatted_final_price.trim()
      ? p.formatted_final_price.trim()
      : `$ ${Number(p.final_price ?? 0).toFixed(2)}`;

  // Panel often formats like "$ 7.00". Normalize for our marketing-style pricing labels.
  let base = rawBase.replace(/\s+/g, "");
  if (base.endsWith(".00")) base = base.slice(0, -3);

  if (Number(p.final_price ?? 0) === 0) return "$0/mo";

  const suffix = durationToIntervalSuffix(p.duration);
  return suffix ? `${base}${suffix}` : base;
}

function classifySubtitle(p: PanelPackage): string {
  const price = Number(p.final_price ?? 0);
  if (price === 0) return 'The "Hook"';

  const duration = String(p.duration ?? "").trim().toLowerCase();
  if (duration === "7") return "Trial/Weekly";
  if (duration === "30") return 'The "Active Seeker"';
  if (duration === "365") return 'The "Career Management"';
  return "Subscription";
}

function classifyGradient(index: number, isPopular: boolean, isFree: boolean): string {
  if (isFree) return "from-gray-500 to-gray-600";
  if (isPopular) return "from-purple-500 to-cyan-500";
  // Keep the rest distinct but stable.
  return index % 2 === 0 ? "from-amber-500 to-orange-600" : "from-slate-600 to-slate-800";
}

function classifyIcon(index: number, isPopular: boolean, isFree: boolean): PricingCardIcon {
  if (isFree) return "sparkles";
  if (isPopular) return "zap";
  return index % 2 === 0 ? "crown" : "crown";
}

export async function fetchPanelSubscriptionPackages(): Promise<PanelPackage[]> {
  const res = await panelGet<PanelPackage[]>("get-package", { type: "item_listing" });
  return Array.isArray(res.data) ? res.data : [];
}

export function panelPackagesToPricingCards(packages: PanelPackage[]): PricingCard[] {
  const cleaned = (Array.isArray(packages) ? packages : [])
    .filter((p) => p && typeof p.id === "number")
    .slice();

  // Sort by final price asc so the UI remains stable and predictable.
  cleaned.sort((a, b) => (Number(a.final_price ?? 0) - Number(b.final_price ?? 0)));

  const paid = cleaned.filter((p) => Number(p.final_price ?? 0) > 0);
  const cheapestPaid = paid.reduce<PanelPackage | null>((best, cur) => {
    if (!best) return cur;
    return Number(cur.final_price ?? 0) < Number(best.final_price ?? 0) ? cur : best;
  }, null);
  const popularId = cheapestPaid?.id ?? null;

  return cleaned.map((p, index) => {
    const isPaid = Number(p.final_price ?? 0) > 0;
    const isPopular = isPaid && popularId === p.id;
    const isFree = !isPaid;
    const name = packageTitle(p);
    const subtitle = classifySubtitle(p);
    const description = packageDescription(p);
    const features = packageFeatures(p);

    return {
      packageId: String(p.id),
      isPaid,
      isPopular,
      duration: p.duration,
      finalPrice: Number(p.final_price ?? 0),
      name,
      subtitle,
      description,
      priceLabel: packagePriceLabel(p),
      features,
      cta: isPaid ? `Choose ${name}` : "Get Started Free",
      gradient: classifyGradient(index, isPopular, isFree),
      icon: classifyIcon(index, isPopular, isFree),
    };
  });
}

export async function fetchPricingCards(): Promise<PricingCard[]> {
  const packages = await fetchPanelSubscriptionPackages();
  return panelPackagesToPricingCards(packages);
}
