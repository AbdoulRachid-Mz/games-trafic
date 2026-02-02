import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const reset = () => onChange({ from: null, to: null });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value.from ? (
            value.to ? (
              <>
                {format(value.from, "dd MMM yyyy", { locale: fr })} -{" "}
                {format(value.to, "dd MMM yyyy", { locale: fr })}
              </>
            ) : (
              format(value.from, "dd MMM yyyy", { locale: fr })
            )
          ) : (
            <span>Sélectionner une période</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value.from || undefined}
          selected={value.from ? { from: value.from, to: value.to || undefined } : undefined}
          onSelect={(selected) => {
            if (!selected) return;
            onChange({ from: selected.from || null, to: selected.to || null });
          }}
          numberOfMonths={2}
          locale={fr}
        />
        <div className="p-3 border-t flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            Réinitialiser
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
