"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label?: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
  showOtherOption?: boolean;
  otherLabel?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  inputClassName?: string;
  listClassName?: string;
  itemClassName?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  allowCustom = true,
  showOtherOption = false,
  otherLabel = "Other (type your own)",
  disabled,
  className,
  contentClassName,
  inputClassName,
  listClassName,
  itemClassName,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || value || "";

  const customValue = search.trim();
  const hasCustomValue =
    allowCustom &&
    customValue.length > 0 &&
    !options.some(
      (option) => option.value.toLowerCase() === customValue.toLowerCase()
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full items-center justify-between gap-2 rounded-xl border-gray-200 bg-white/90 px-3 text-left text-gray-900 shadow-sm transition hover:border-purple-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-purple-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-purple-500/60",
            className
          )}
          disabled={disabled}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              !selectedLabel && "text-muted-foreground"
            )}
          >
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        style={{
          width: "var(--radix-popover-trigger-width)",
        }}
        className={cn(
          "w-[--radix-popover-trigger-width] min-w-[--radix-popover-trigger-width] !w-[var(--radix-popover-trigger-width)] box-border overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-700 dark:bg-gray-900",
          contentClassName
        )}
      >
        <Command className="w-full overflow-hidden">
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            ref={inputRef}
            className={cn("h-10 w-full min-w-0 px-3 text-sm", inputClassName)}
          />
          <CommandList className={cn("w-full max-h-64", listClassName)}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {showOtherOption && (
                <CommandItem
                  className={cn("w-full text-left", itemClassName)}
                  value="__other__"
                  onSelect={() => {
                    onChange("");
                    setSearch("");
                    setOpen(true);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span className="min-w-0 flex-1 truncate">{otherLabel}</span>
                </CommandItem>
              )}
              {hasCustomValue && (
                <CommandItem
                  className={cn("w-full text-left", itemClassName)}
                  value={customValue}
                  onSelect={() => {
                    onChange(customValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === customValue.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{`Use "${customValue}"`}</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  className={cn("w-full text-left", itemClassName)}
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {option.label ?? option.value}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

