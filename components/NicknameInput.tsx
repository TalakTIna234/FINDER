import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check } from 'lucide-react';
import { profileService } from '../services/profileService';

interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const NicknameInput: React.FC<NicknameInputProps> = ({ value, onChange, placeholder, className }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Pulisci timeout precedente
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Reset stato se il campo è vuoto
    if (!value || value.length < 2) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    // Aspetta 500ms dopo che l'utente smette di digitare
    setIsChecking(true);
    setIsAvailable(null);

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const available = await profileService.isNicknameAvailable(value);
        setIsAvailable(available);
      } catch (error) {
        console.error('Error checking nickname:', error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Il tuo nickname"}
        className={className}
      />
      {value && value.length >= 2 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking ? (
            <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
          ) : isAvailable === true ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : isAvailable === false ? (
            <span className="text-red-500 text-xs font-bold">✗</span>
          ) : null}
        </div>
      )}
    </div>
  );
};

