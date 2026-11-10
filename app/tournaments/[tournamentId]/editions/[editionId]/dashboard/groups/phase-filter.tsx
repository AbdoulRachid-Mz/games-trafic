"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhaseFilterProps {
  phases: Array<{ id: string; name: string }>;
  currentPhaseId?: string;
  placeholder?: string;
  paramName?: string;
}

export function PhaseFilter({ 
  phases, 
  currentPhaseId, 
  placeholder = "Toutes les phases",
  paramName = "phaseId"
}: PhaseFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    // Préserver les autres params URL (viewMode, page, ...) au lieu de
    // tout écraser — mais repartir à la page 1.
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "ALL") {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select defaultValue={currentPhaseId || "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-[200px] text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{placeholder}</SelectItem>
        {phases.map((phase) => (
          <SelectItem key={phase.id} value={phase.id}>
            {phase.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}