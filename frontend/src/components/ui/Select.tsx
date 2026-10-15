'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  color?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  id?: string;
}

export function Select({
  label,
  placeholder = 'Pilih opsi...',
  value,
  onChange,
  options,
  error,
  disabled = false,
  emptyMessage = 'Tidak ada pilihan tersedia',
  className = '',
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cari item yang sedang terpilih
  const selectedOption = options.find((opt) => opt.value === value);

  // Tutup dropdown saat klik di luar komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string, optionDisabled?: boolean) => {
    if (optionDisabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 mb-1"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all bg-white cursor-pointer ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
            : error
            ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}

          <div className="truncate">
            {selectedOption ? (
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white border border-slate-100 shadow-xl max-h-56 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100"
        >
          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value, option.disabled)}
                  className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50 text-blue-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {option.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.icon && (
                      <span className="shrink-0 text-slate-400">{option.icon}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{option.label}</p>
                      {option.sublabel && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {option.sublabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-3 px-2 text-center text-xs text-slate-400">
              {emptyMessage}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
