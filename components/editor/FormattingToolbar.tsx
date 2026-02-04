"use client";

import { Bold, Italic, Underline, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormattingToolbarProps = {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onList: () => void;
  className?: string;
};

export function FormattingToolbar({
  onBold,
  onItalic,
  onUnderline,
  onList,
  className,
}: FormattingToolbarProps) {
  const keepFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onMouseDown={keepFocus}
        onClick={onBold}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onMouseDown={keepFocus}
        onClick={onItalic}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onMouseDown={keepFocus}
        onClick={onUnderline}
        aria-label="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onMouseDown={keepFocus}
        onClick={onList}
        aria-label="Bulleted list"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
