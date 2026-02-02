"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Atom, AtomIcon } from "lucide-react";

interface MultiSelectProps {
  options: {
    value: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  disabled = false,
}: MultiSelectProps) {
  const toggleOption = (value: string) => {
    if (disabled) return;
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={disabled}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {options.find((o) => o.value === value)?.icon && (
                    <Atom
                      name={options.find((o) => o.value === value)?.icon}
                      className="h-3 w-3"
                    />
                  )}
                  {options.find((o) => o.value === value)?.label || value}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <ScrollArea className="h-60">
          <div className="space-y-2 p-2">
            {options.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-2 p-2 rounded ${
                  option.disabled || disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted/50 cursor-pointer"
                }`}
                onClick={() => !option.disabled && toggleOption(option.value)}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                  disabled={option.disabled || disabled}
                />
                {option.icon && (
                  <AtomIcon name={option.icon} className="h-4 w-4" />
                )}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
