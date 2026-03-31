"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ROLES, type Role } from "@/lib/dashboard/dummy-data";

type RolePickerModalProps = {
  open: boolean;
  selectedRoleId: string | null | undefined;
  onClose: () => void;
  onSelect: (roleId: string) => void;
};

function getRoleFamilies() {
  return Array.from(new Set(ROLES.map((role) => role.family)));
}

export function RolePickerModal({
  open,
  selectedRoleId,
  onClose,
  onSelect,
}: RolePickerModalProps) {
  const [query, setQuery] = useState("");
  const [activeFamily, setActiveFamily] = useState<string>("All");

  const selectedRole =
    ROLES.find((role) => role.id === selectedRoleId) ?? null;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveFamily("All");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  const families = useMemo(() => ["All", ...getRoleFamilies()], []);

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return ROLES.filter((role) => {
      const matchesFamily = activeFamily === "All" || role.family === activeFamily;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        role.title.toLowerCase().includes(normalizedQuery) ||
        role.family.toLowerCase().includes(normalizedQuery) ||
        role.icon.toLowerCase().includes(normalizedQuery);

      return matchesFamily && matchesQuery;
    });
  }, [activeFamily, query]);

  const groupedRoles = useMemo(() => {
    const groups = new Map<string, Role[]>();

    for (const role of filteredRoles) {
      const roles = groups.get(role.family) ?? [];
      roles.push(role);
      groups.set(role.family, roles);
    }

    return Array.from(groups.entries());
  }, [filteredRoles]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="bench-role-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a role"
        className="bench-role-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bench-role-modal-header">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-semibold text-brand-900">Choose a role</h4>
              <Badge variant="ghost" className="px-2.5 py-1 text-[11px]">
                {filteredRoles.length} roles
              </Badge>
            </div>
            <p className="text-sm text-brand-500">
              Search by title or family, then pick the closest role benchmark.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close role picker"
            onClick={onClose}
            className="bench-role-modal-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bench-role-modal-toolbar">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <Input
              autoFocus
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roles or families"
              className="bench-role-modal-search pl-11"
            />
          </div>
          {selectedRole ? (
            <div className="bench-role-selection-pill">
              Selected: {selectedRole.title}
            </div>
          ) : null}
        </div>

        <div className="bench-role-modal-filters" aria-label="Role family filters">
          {families.map((family) => {
            const isActive = family === activeFamily;

            return (
              <button
                key={family}
                type="button"
                onClick={() => setActiveFamily(family)}
                className="bench-role-filter-pill"
                data-active={isActive}
              >
                {family}
              </button>
            );
          })}
        </div>

        <div className="bench-role-modal-results">
          {groupedRoles.length === 0 ? (
            <div className="bench-role-empty-state">
              <Search className="h-8 w-8 text-brand-300" />
              <p className="text-sm font-medium text-brand-800">No roles found</p>
              <p className="text-xs text-brand-500">
                Try another title, family, or clear the active filter.
              </p>
            </div>
          ) : (
            groupedRoles.map(([family, roles]) => (
              <section key={family} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold text-brand-900">{family}</h5>
                  <span className="text-xs text-brand-400">
                    {roles.length} {roles.length === 1 ? "role" : "roles"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    const isSelected = role.id === selectedRoleId;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          onSelect(role.id);
                          onClose();
                        }}
                        className={clsx(
                          "bench-role-card",
                          isSelected && "bench-role-card-selected",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="text-sm font-semibold text-brand-900">
                              {role.title}
                            </div>
                            <div className="text-xs text-brand-500">{role.family}</div>
                          </div>
                          {isSelected ? <Badge variant="brand">Selected</Badge> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
