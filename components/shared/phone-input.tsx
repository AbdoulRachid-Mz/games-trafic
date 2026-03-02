"use client";

import { countries, Country, getDefaultCountry } from "@/lib/countries";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneInputProps {
  value?: string; // Format complet avec code pays (+22712345678)
  onChange: (value: string) => void;
  defaultCountryCode?: string; // Optionnel: code pays par défaut (ex: "NE" pour Niger)
  disabled?: boolean;
}

export const PhoneInput = ({ 
  value = "", 
  onChange,
  defaultCountryCode = "NE", // Niger par défaut
  disabled = false
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    // Détection initiale basée sur la valeur ou le pays par défaut
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      return country || getDefaultCountry(defaultCountryCode);
    }
    return getDefaultCountry(defaultCountryCode);
  });

  const [phoneNumber, setPhoneNumber] = useState(() => {
    return value ? value.replace(selectedCountry.dialCode, "") : "";
  });

  const handleCountryChange = (countryCode: string) => {
    const newCountry = countries.find(c => c.code === countryCode) || getDefaultCountry(defaultCountryCode);
    setSelectedCountry(newCountry);
    onChange(newCountry.dialCode + phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/\D/g, "");
    setPhoneNumber(num);
    onChange(selectedCountry.dialCode + num);
  };

  return (
    <div className="flex gap-2">
      <Select 
        value={selectedCountry.code} 
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.dialCode}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder="Numéro de téléphone"
        disabled={disabled}
      />
    </div>
  );
};