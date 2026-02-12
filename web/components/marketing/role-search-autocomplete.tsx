"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const ALL_ROLES = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Mobile Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "ML Engineer",
  "Product Manager",
  "Technical PM",
  "Product Designer",
  "UX Researcher",
  "Data Scientist",
  "Data Analyst",
  "Security Engineer",
  "QA Engineer",
];

const POPULAR_ROLES = ["Software Engineer", "Product Manager", "Data Scientist", "DevOps Engineer", "UX Designer"];

interface RoleSearchAutocompleteProps {
  defaultValue?: string;
  location: string;
  level: string;
  currency: string;
}

export function RoleSearchAutocomplete({
  defaultValue = "",
  location,
  level,
  currency,
}: RoleSearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter roles based on query
  const getFilteredRoles = useCallback(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { popular: POPULAR_ROLES, others: [] };
    }

    const matchingPopular = POPULAR_ROLES.filter((r) =>
      r.toLowerCase().includes(q)
    );
    const matchingOthers = ALL_ROLES.filter(
      (r) => r.toLowerCase().includes(q) && !POPULAR_ROLES.includes(r)
    );

    return { popular: matchingPopular, others: matchingOthers };
  }, [query]);

  const { popular, others } = getFilteredRoles();
  const allResults = [...popular, ...others];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectRole = (role: string) => {
    setQuery(role);
    setIsOpen(false);
    // Navigate with the selected role
    const params = new URLSearchParams({
      role,
      location,
      level,
      currency,
    });
    router.push(`/preview?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < allResults.length) {
          selectRole(allResults[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const showDropdown = isOpen && (popular.length > 0 || others.length > 0);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <Search className="h-4 w-4 text-brand-400" />
        <input
          ref={inputRef}
          type="text"
          name="role"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search role (e.g. Backend Engineer)"
          className="h-8 w-full border-none bg-transparent px-0 text-sm placeholder:text-brand-500 focus:outline-none"
          autoComplete="off"
          aria-label="Role"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
          {/* Popular section */}
          {popular.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                  Popular
                </span>
              </div>
              {popular.map((role, i) => {
                const globalIndex = i;
                return (
                  <button
                    key={role}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectRole(role)}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      activeIndex === globalIndex
                        ? "bg-brand-50 text-brand-900"
                        : "text-brand-700 hover:bg-brand-50"
                    }`}
                    role="option"
                    aria-selected={activeIndex === globalIndex}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-[10px] font-bold text-brand-600">
                      {role.charAt(0)}
                    </span>
                    <span className="font-medium">{role}</span>
                    <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                      Popular
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Other results section */}
          {others.length > 0 && (
            <div>
              {popular.length > 0 && (
                <div className="mx-4 border-t border-border" />
              )}
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                  Other roles
                </span>
              </div>
              {others.map((role, i) => {
                const globalIndex = popular.length + i;
                return (
                  <button
                    key={role}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectRole(role)}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      activeIndex === globalIndex
                        ? "bg-brand-50 text-brand-900"
                        : "text-brand-700 hover:bg-brand-50"
                    }`}
                    role="option"
                    aria-selected={activeIndex === globalIndex}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-[10px] font-bold text-gray-500">
                      {role.charAt(0)}
                    </span>
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {popular.length === 0 && others.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center text-sm text-brand-500">
              No roles matching &quot;{query}&quot;
            </div>
          )}

          <div className="px-4 py-2 border-t border-border">
            <span className="text-[10px] text-brand-400">
              Type to search or use arrow keys to navigate
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
