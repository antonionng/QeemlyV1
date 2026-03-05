"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import type { Department, PerformanceRating } from "@/lib/employees";

type CreatePayload = {
  firstName: string;
  lastName: string;
  email?: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  bonus?: number;
  equity?: number;
  employmentType: "national" | "expat";
  performanceRating?: PerformanceRating;
  hireDate?: string;
};

type Props = {
  open: boolean;
  mutating?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload) => Promise<void>;
};

const DEPARTMENTS: Department[] = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
];

export function AddEmployeeModal({ open, mutating, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState<Department>("Engineering");
  const [roleId, setRoleId] = useState("swe");
  const [levelId, setLevelId] = useState("ic3");
  const [locationId, setLocationId] = useState("dubai");
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("0");
  const [equity, setEquity] = useState("0");
  const [employmentType, setEmploymentType] = useState<"national" | "expat">("national");
  const [performanceRating, setPerformanceRating] = useState<PerformanceRating>("meets");
  const [hireDate, setHireDate] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close add employee modal"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-brand-900">Add Employee</h3>
            <p className="text-sm text-accent-500">Add a new employee to your workspace directory.</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent-500 hover:bg-accent-50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim() || undefined,
              department,
              roleId,
              levelId,
              locationId,
              baseSalary: Number(baseSalary || 0),
              bonus: Number(bonus || 0),
              equity: Number(equity || 0),
              employmentType,
              performanceRating,
              hireDate: hireDate || undefined,
            });
            onClose();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" fullWidth required />
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" fullWidth required />
          </div>

          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional)" fullWidth />

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              {DEPARTMENTS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              {LOCATIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.city}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              {ROLES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
            <select
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              {LEVELS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="Base salary" fullWidth required />
            <Input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="Bonus" fullWidth />
            <Input type="number" value={equity} onChange={(e) => setEquity(e.target.value)} placeholder="Equity" fullWidth />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as "national" | "expat")}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              <option value="national">National</option>
              <option value="expat">Expat</option>
            </select>
            <select
              value={performanceRating}
              onChange={(e) => setPerformanceRating(e.target.value as PerformanceRating)}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="meets">Meets</option>
              <option value="exceeds">Exceeds</option>
              <option value="exceptional">Exceptional</option>
            </select>
            <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} fullWidth />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={Boolean(mutating)}>
              Save Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

