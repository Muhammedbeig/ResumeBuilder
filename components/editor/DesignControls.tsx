"use client";

import { useEffect } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { FONT_FAMILIES, FONT_SIZE_OPTIONS } from "@/lib/editor-options";
import { normalizeFontSizeValue } from "@/lib/typography";

type Metadata = {
  themeColor?: string;
  fontFamily?: string;
  fontSize?: string;
};

type DesignControlsProps = {
  metadata?: Metadata;
  onUpdate: (metadata: Partial<Metadata>) => void;
  defaultFontLabel?: string;
  advancedFormattingEnabled?: boolean;
  onAdvancedFormattingChange?: (value: boolean) => void;
  watermarkEnabled?: boolean;
  onWatermarkToggle?: (value: boolean) => void;
  watermarkLocked?: boolean;
};

const COLOR_OPTIONS = [
  "#000000",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#6366f1",
  "#14b8a6",
];

export function DesignControls({
  metadata,
  onUpdate,
  defaultFontLabel,
  advancedFormattingEnabled,
  onAdvancedFormattingChange,
  watermarkEnabled,
  onWatermarkToggle,
  watermarkLocked,
}: DesignControlsProps) {
  const selectedFont = metadata?.fontFamily || "";
  const selectedFontSize = normalizeFontSizeValue(metadata?.fontSize);
  const fontPlaceholder = defaultFontLabel ? `Default (${defaultFontLabel})` : "Default (Template)";

  useEffect(() => {
    if (!selectedFont) return;
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [selectedFont]);

  const handleFontSizeChange = (value: string) => {
    const normalized = value.replace(/[^\d.]/g, "");
    if (!normalized) {
      onUpdate({ fontSize: undefined });
      return;
    }
    onUpdate({ fontSize: normalized });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-purple-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Accent Color</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => onUpdate({ themeColor: color })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  metadata?.themeColor === color
                    ? "border-gray-900 dark:border-white scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={metadata?.themeColor || "#000000"}
                onChange={(e) => onUpdate({ themeColor: e.target.value })}
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0"
              />
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center pointer-events-none">
                <span className="text-xs">+</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Font Family</Label>
            <Combobox
              options={FONT_FAMILIES.map((font) => ({ value: font, label: font }))}
              value={selectedFont}
              onChange={(value) => onUpdate({ fontFamily: value })}
              placeholder={fontPlaceholder}
              searchPlaceholder="Search fonts"
              allowCustom
              className="mt-2"
            />
          </div>

          <div>
            <Label>Font Size (px)</Label>
            <Combobox
              options={FONT_SIZE_OPTIONS.map((size) => ({
                value: String(size),
                label: `${size}px`,
              }))}
              value={selectedFontSize}
              onChange={handleFontSizeChange}
              placeholder="Default (16px)"
              searchPlaceholder="Search size"
              allowCustom
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {typeof advancedFormattingEnabled === "boolean" && onAdvancedFormattingChange && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Advanced Formatting
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable bold/italic/bullets on all text fields.
                </p>
              </div>
              <Switch
                checked={advancedFormattingEnabled}
                onCheckedChange={onAdvancedFormattingChange}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {typeof watermarkEnabled === "boolean" && onWatermarkToggle && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Preview Watermark
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {watermarkLocked
                    ? "Free plan keeps the watermark on. Upgrade to remove it."
                    : "Toggle the watermark in your preview."}
                </p>
              </div>
              <Switch
                checked={watermarkEnabled}
                onCheckedChange={onWatermarkToggle}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => onUpdate({ themeColor: undefined, fontFamily: undefined, fontSize: undefined })}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset to Template Defaults
      </Button>
    </div>
  );
}
