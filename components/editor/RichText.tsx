"use client";

import { toBlockHtml, toInlineHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type RichTextProps = {
  text?: string;
  inline?: boolean;
  className?: string;
};

export function RichText({ text, inline = false, className }: RichTextProps) {
  if (!text) return null;
  const html = inline ? toInlineHtml(text) : toBlockHtml(text);

  if (inline) {
    return (
      <span
        className={cn("whitespace-pre-wrap", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
