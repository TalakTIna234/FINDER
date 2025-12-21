import React, { useState, useEffect, useRef } from 'react';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Domini email comuni con varianti
// Nota: gmail.it, yahoo.it, hotmail.it, outlook.it, live.it, aol.it, msn.it NON ESISTONO
const COMMON_DOMAINS = [
  { pattern: /^g(m|mai|mail)?$/i, domains: ['gmail.com'] },
  { pattern: /^y(ahoo)?$/i, domains: ['yahoo.com'] },
  { pattern: /^h(otmail)?$/i, domains: ['hotmail.com'] },
  { pattern: /^o(utlook)?$/i, domains: ['outlook.com'] },
  { pattern: /^l(ive)?$/i, domains: ['live.com'] },
  { pattern: /^i(cloud)?$/i, domains: ['icloud.com'] },
  { pattern: /^a(ol)?$/i, domains: ['aol.com'] },
  { pattern: /^m(sn)?$/i, domains: ['msn.com'] },
  { pattern: /^p(rovider)?$/i, domains: ['provider.it'] },
  { pattern: /^t(iscali)?$/i, domains: ['tiscali.it'] },
  { pattern: /^v(irgilio)?$/i, domains: ['virgilio.it'] },
  { pattern: /^l(ibero)?$/i, domains: ['libero.it'] },
];

export const EmailInput: React.FC<EmailInputProps> = ({ value, onChange, placeholder, className }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Trova la posizione della @
    const atIndex = newValue.lastIndexOf('@');
    
    if (atIndex >= 0) {
      const afterAt = newValue.substring(atIndex + 1);
      const beforeAt = newValue.substring(0, atIndex);
      
      // Se c'è un punto dopo la @, non suggerire (l'utente sta già completando)
      if (afterAt.includes('.')) {
        setShowSuggestions(false);
        return;
      }

      // Cerca domini corrispondenti
      const matched = COMMON_DOMAINS.find(d => d.pattern.test(afterAt));
      
      if (matched && afterAt.length > 0) {
        const domainSuggestions = matched.domains.map(domain => `${beforeAt}@${domain}`);
        setSuggestions(domainSuggestions);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        onChange(suggestions[selectedIndex]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="email"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Mostra suggerimenti se c'è già una @
          if (value.includes('@') && !value.substring(value.indexOf('@') + 1).includes('.')) {
            const atIndex = value.lastIndexOf('@');
            const afterAt = value.substring(atIndex + 1);
            const beforeAt = value.substring(0, atIndex);
            const matched = COMMON_DOMAINS.find(d => d.pattern.test(afterAt));
            if (matched && afterAt.length > 0) {
              const domainSuggestions = matched.domains.map(domain => `${beforeAt}@${domain}`);
              setSuggestions(domainSuggestions);
              setShowSuggestions(true);
            }
          }
        }}
        placeholder={placeholder || "tua@email.com"}
        className={className}
        autoComplete="email"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-[#1C1C1E] border border-white/20 rounded-xl shadow-2xl overflow-hidden"
        >
          {suggestions.map((suggestion, index) => {
            const [local, domain] = suggestion.split('@');
            const [domainName, ext] = domain.split('.');
            
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${
                  index === selectedIndex ? 'bg-white/10' : ''
                }`}
              >
                <span className="text-white font-bold">{local}@</span>
                <span className="text-blue-400 font-bold">{domainName}</span>
                <span className="text-white/60">.{ext}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

