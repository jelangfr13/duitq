'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  color?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
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
  variant?: 'default' | 'pill';
  leadingIcon?: React.ReactNode;
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
  variant = 'default',
  leadingIcon,
}: SelectProps) {
  const autoId = useId();
  const selectId = id || autoId;
  const popoverId = `select-popover-${selectId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popoverCoords, setPopoverCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cari item yang sedang terpilih
  const selectedOption = options.find((opt) => opt.value === value);

  // Hitung posisi popover agar presisi tepat di bawah/atas tombol dan lebarnya identik
  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;

    const maxHeight = Math.max(120, Math.min(260, openUpward ? spaceAbove - 16 : spaceBelow - 16));
    const width = rect.width;
    // Pastikan tidak melenceng keluar layar horizontal
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

    if (openUpward) {
      setPopoverCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        width,
        maxHeight,
      });
    } else {
      setPopoverCoords({
        top: rect.bottom + 6,
        left,
        width,
        maxHeight,
      });
    }
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Tutup dropdown saat klik di luar komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !document.getElementById(popoverId)?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize(e: Event) {
      // Jangan tutup jika scroll dilakukan di dalam menu popover itu sendiri
      if (e.target && (e.target as HTMLElement).closest?.(`[id="${popoverId}"]`)) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, popoverId]);

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
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={
          variant === 'pill'
            ? `w-full h-9 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                disabled
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                  : isOpen
                  ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs bg-white dark:bg-slate-900'
                  : value && value !== 'ALL' && value !== 'THIS_MONTH'
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`
            : `w-full px-3.5 py-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all bg-white dark:bg-slate-900 cursor-pointer ${
                disabled
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : error
                  ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : isOpen
                  ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`
        }
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leadingIcon && <span className="shrink-0">{leadingIcon}</span>}
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && !leadingIcon && (
            <span className="shrink-0 text-slate-500 dark:text-slate-400">{selectedOption.icon}</span>
          )}

          <div className="truncate text-left">
            {selectedOption ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 block">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover di-render via Portal agar lebarnya persis sama & tidak terpotong panel gulir */}
      {isOpen && mounted && popoverCoords && typeof document !== 'undefined' && createPortal(
        <div
          id={popoverId}
          role="listbox"
          style={{
            position: 'fixed',
            top: popoverCoords.top !== undefined ? `${popoverCoords.top}px` : undefined,
            bottom: popoverCoords.bottom !== undefined ? `${popoverCoords.bottom}px` : undefined,
            left: `${popoverCoords.left}px`,
            width: `${popoverCoords.width}px`,
            maxHeight: `${popoverCoords.maxHeight}px`,
          }}
          className="z-[9999] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-100"
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
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
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
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {option.sublabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-3 px-2 text-center text-xs text-slate-400">
              {emptyMessage}
            </div>
          )}
        </div>,
        document.body
      )}

      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
