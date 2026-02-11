import type { CSSProperties } from "react";
import type { WatermarkSettings } from "@/lib/site-settings-shared";

type WatermarkOverlayProps = {
  text: string;
  settings: WatermarkSettings;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const positionClasses: Record<string, string> = {
  "top-left": "items-start justify-start text-left",
  "top-right": "items-start justify-end text-right",
  "bottom-left": "items-end justify-start text-left",
  "bottom-right": "items-end justify-end text-right",
  center: "items-center justify-center text-center",
};

export function WatermarkOverlay({ text, settings }: WatermarkOverlayProps) {
  const safeText = text.trim();
  if (!safeText) return null;

  const opacity = clamp(settings.opacity ?? 0.12, 0, 1);
  const size = clamp(settings.size ?? 48, 12, 160);
  const rotation = Number.isFinite(settings.rotation) ? settings.rotation : -25;
  const style = settings.style || "single";
  const position = settings.position || "center";
  const tileItems = Array.from({ length: 12 }, (_, idx) => idx);

  const textStyle: CSSProperties = {
    fontSize: `${size}px`,
    transform: `rotate(${rotation}deg)`,
    opacity,
  };

  if (style === "tile") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 place-items-center gap-10">
          {tileItems.map((idx) => (
            <span
              key={idx}
              className="select-none font-bold uppercase tracking-[0.35em] text-black"
              style={textStyle}
            >
              {safeText}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const positionClass = positionClasses[position] ?? positionClasses.center;

  return (
    <div className={`pointer-events-none absolute inset-0 flex ${positionClass} p-10`}>
      <span
        className="select-none font-bold uppercase tracking-[0.35em] text-black"
        style={textStyle}
      >
        {safeText}
      </span>
    </div>
  );
}
