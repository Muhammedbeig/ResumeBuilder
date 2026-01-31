"use client";

import * as React from "react";
import { format, addMonths, subMonths, setMonth, setYear, getYear, getMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthYearPickerProps {
  date?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MonthYearPicker({
  date,
  onSelect,
  className,
  placeholder = "Pick a date",
  disabled = false,
}: MonthYearPickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [viewDate, setViewDate] = React.useState<Date>(date || new Date());
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setViewDate(date);
    }
  }, [date]);

  const handleSelect = (newDate: Date) => {
    setSelectedDate(newDate);
    setViewDate(newDate);
    onSelect?.(newDate);
    setIsOpen(false);
  };

  const nextYear = () => setViewDate(addMonths(viewDate, 12));
  const prevYear = () => setViewDate(subMonths(viewDate, 12));

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const currentYear = getYear(viewDate);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" onClick={prevYear} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">{currentYear}</div>
            <Button variant="ghost" size="icon" onClick={nextYear} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                variant={
                  selectedDate &&
                  getMonth(selectedDate) === index &&
                  getYear(selectedDate) === currentYear
                    ? "default"
                    : "ghost"
                }
                className="h-9 text-sm"
                onClick={() => {
                  const newDate = setMonth(setYear(viewDate, currentYear), index);
                  handleSelect(newDate);
                }}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
