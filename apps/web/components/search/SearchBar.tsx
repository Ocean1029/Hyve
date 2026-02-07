'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  /**
   * Current search value
   */
  value: string;
  /**
   * Callback when search value changes
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;
  /**
   * Whether to show the clear button (X icon) when there's text
   */
  showClearButton?: boolean;
  /**
   * Whether to show the gradient glow effect on focus
   */
  showGradient?: boolean;
  /**
   * Custom CSS classes for the container
   */
  containerClassName?: string;
  /**
   * Custom CSS classes for the input
   */
  inputClassName?: string;
}

/**
 * Reusable search bar component with support for different styling variants
 * Used across Search and Messages pages
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  showClearButton = false,
  showGradient = false,
  containerClassName = '',
  inputClassName = '',
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative group ${containerClassName}`}>
      {/* Gradient glow effect (optional, for Messages page style) */}
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-amber-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity z-0"></div>
      )}

      {/* Input field */}
      {/* Note: rounded-2xl is default, but can be overridden with inputClassName (e.g., rounded-3xl) */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`relative z-10 w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-stone-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all text-sm font-medium ${
          showClearButton && value ? 'pr-11' : ''
        } ${inputClassName}`}
      />

      {/* Search icon - placed after input to ensure proper z-index stacking */}
      <Search
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-20 pointer-events-none ${
          showGradient
            ? 'text-zinc-500 group-focus-within:text-rose-400 transition-colors'
            : 'text-zinc-500'
        }`}
      />

      {/* Clear button (optional, for Search page style) */}
      {showClearButton && value && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

