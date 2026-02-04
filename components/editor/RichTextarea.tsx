"use client";

import { useRef } from "react";
import { Bold, Italic, Underline, List } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  enableFormatting?: boolean;
  toolbarClassName?: string;
};

export function RichTextarea({
  value,
  onValueChange,
  enableFormatting = false,
  className,
  toolbarClassName,
  ...props
}: RichTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const safeValue = Array.isArray(value) ? value.join("\n") : value;

  const applySelection = (nextValue: string, cursorStart?: number, cursorEnd?: number) => {
    onValueChange(nextValue);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      if (typeof cursorStart === "number" && typeof cursorEnd === "number") {
        ref.current.setSelectionRange(cursorStart, cursorEnd);
      }
      ref.current.focus();
    });
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const before = safeValue.slice(0, start);
    const selection = safeValue.slice(start, end);
    const after = safeValue.slice(end);
    const nextValue = `${before}${prefix}${selection}${suffix}${after}`;
    const nextStart = start + prefix.length;
    const nextEnd = end + prefix.length;
    applySelection(nextValue, nextStart, nextEnd);
  };

  const insertBullets = () => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const before = safeValue.slice(0, start);
    const selection = safeValue.slice(start, end);
    const after = safeValue.slice(end);
    const lines = selection ? selection.split(/\r?\n/) : [""];
    const updatedLines = lines.map((line) => {
      if (!line.trim()) return line;
      return line.startsWith("- ") || line.startsWith("* ") ? line : `- ${line}`;
    });
    const updated = updatedLines.join("\n");
    const nextValue = `${before}${updated}${after}`;
    const nextStart = start;
    const nextEnd = start + updated.length;
    applySelection(nextValue, nextStart, nextEnd);
  };

  return (
    <div className="space-y-2">
      {enableFormatting && (
        <div className={cn("flex items-center gap-2", toolbarClassName)}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => wrapSelection("**", "**")}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => wrapSelection("*", "*")}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => wrapSelection("__", "__")}
            aria-label="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={insertBullets}
            aria-label="Bulleted list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Textarea
        ref={ref}
        value={safeValue}
        onChange={(event) => onValueChange(event.target.value)}
        className={className}
        {...props}
      />
    </div>
  );
}
