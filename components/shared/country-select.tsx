"use client";

import { countries, Country, getDefaultCountry } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface CountrySelectProps {
  value?: string; // Le nom du pays
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CountrySelect = ({ value, onChange, className, disabled }: CountrySelectProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry());

  useEffect(() => {
    if (value) {
      const country = countries.find(c => c.name === value) || getDefaultCountry();
      setSelectedCountry(country);
    }
  }, [value]);

  const handleChange = (countryName: string) => {
    const country = countries.find(c => c.name === countryName) || getDefaultCountry();
    setSelectedCountry(country);
    onChange(country.name);
  };

  return (
    <Select 
      value={selectedCountry.name} 
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Sélectionnez un pays" />
      </SelectTrigger>
      <SelectContent>
        {countries.map((country) => (
          <SelectItem key={country.code} value={country.name}>
            <div className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};