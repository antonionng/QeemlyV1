"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

type Props = {
  id: string;
  size?: number;
  className?: string;
};

// Brand colors per provider
const BRAND_COLORS: Record<string, string> = {
  slack: "#611f69",
  teams: "#6264A7",
  email_digest: "#6366F1",
  bamboohr: "#73C41D",
  workday: "#F68D2E",
  sap_successfactors: "#0070F2",
  hibob: "#FF6F61",
  personio: "#00B3A4",
  gusto: "#F45D48",
  rippling: "#6C2DC7",
  deel: "#0038FF",
  zenhr: "#2E86DE",
  bayzat: "#15ABAB",
  gulfhr: "#009688",
  remotepass: "#7B61FF",
  sapience: "#1A73E8",
  csv_upload: "#22C55E",
  sftp: "#64748B",
  greenhouse: "#3B8427",
  lever: "#0B5CFF",
  ashby: "#1A1A2E",
  workable: "#1DA1F2",
};

// Each logo is a 40x40 viewBox SVG
const LOGOS: Record<string, ReactNode> = {
  // ── Notifications ──────────────────────────────────────────────────────
  slack: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Slack hash mark in 4 brand colors */}
      <rect x="8" y="16" width="4" height="12" rx="2" fill="#E01E5A" />
      <rect x="16" y="16" width="4" height="12" rx="2" fill="#36C5F0" />
      <rect x="16" y="8" width="12" height="4" rx="2" fill="#2EB67D" />
      <rect x="16" y="16" width="12" height="4" rx="2" fill="#ECB22E" />
      <rect x="8" y="16" width="12" height="4" rx="2" fill="#E01E5A" opacity="0.8" />
      <rect x="16" y="24" width="12" height="4" rx="2" fill="#36C5F0" opacity="0.8" />
      <rect x="24" y="16" width="4" height="12" rx="2" fill="#2EB67D" />
      <rect x="28" y="8" width="4" height="4" rx="2" fill="#2EB67D" />
      <rect x="8" y="28" width="4" height="4" rx="2" fill="#E01E5A" />
      <rect x="28" y="24" width="4" height="4" rx="2" fill="#36C5F0" />
      <rect x="8" y="8" width="4" height="4" rx="2" fill="#ECB22E" />
    </svg>
  ),

  teams: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="28" height="28" rx="6" fill="#6264A7" />
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="sans-serif">T</text>
      <circle cx="30" cy="12" r="4" fill="#7B83EB" />
      <rect x="26" y="18" width="10" height="12" rx="2" fill="#7B83EB" opacity="0.6" />
    </svg>
  ),

  email_digest: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10" width="30" height="20" rx="4" fill="#6366F1" />
      <path d="M5 14L20 23L35 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 26L14 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M35 26L26 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),

  // ── Global HRIS ────────────────────────────────────────────────────────
  bamboohr: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#73C41D" />
      <path d="M14 32V16C14 12 16 10 20 10C24 10 26 12 26 16V32" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M20 10V8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 14C14 12 12 13 11 15" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 14C26 12 28 13 29 15" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),

  workday: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#F68D2E" />
      <circle cx="20" cy="18" r="6" fill="white" />
      <path d="M12 30C12 25.5817 15.5817 22 20 22C24.4183 22 28 25.5817 28 30" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  ),

  sap_successfactors: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#0070F2" />
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="sans-serif">SAP</text>
    </svg>
  ),

  hibob: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#FF6F61" />
      <circle cx="15" cy="17" r="3" fill="white" />
      <circle cx="25" cy="17" r="3" fill="white" />
      <path d="M13 25C13 25 16 29 20 29C24 29 27 25 27 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  ),

  personio: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#00B3A4" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="sans-serif">P</text>
    </svg>
  ),

  gusto: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#F45D48" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="sans-serif">G</text>
    </svg>
  ),

  rippling: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#6C2DC7" />
      <path d="M10 20C14 14 18 26 22 20C26 14 30 26 34 20" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M6 20C10 14 14 26 18 20C22 14 26 26 30 20" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  ),

  deel: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#0038FF" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="sans-serif">d.</text>
    </svg>
  ),

  // ── GCC HRIS ───────────────────────────────────────────────────────────
  zenhr: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#2E86DE" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="sans-serif">Z</text>
    </svg>
  ),

  bayzat: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#15ABAB" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">B</text>
    </svg>
  ),

  gulfhr: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#009688" />
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="sans-serif">gHR</text>
    </svg>
  ),

  remotepass: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#7B61FF" />
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="sans-serif">RP</text>
    </svg>
  ),

  sapience: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#1A73E8" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">S</text>
    </svg>
  ),

  // ── Manual / Fallback ──────────────────────────────────────────────────
  csv_upload: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#22C55E" />
      {/* Spreadsheet grid */}
      <rect x="10" y="10" width="20" height="20" rx="2" fill="white" opacity="0.3" />
      <line x1="10" y1="16" x2="30" y2="16" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="22" x2="30" y2="22" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="28" x2="30" y2="28" stroke="white" strokeWidth="1.5" />
      <line x1="18" y1="10" x2="18" y2="30" stroke="white" strokeWidth="1.5" />
      <line x1="26" y1="10" x2="26" y2="30" stroke="white" strokeWidth="1.5" />
    </svg>
  ),

  sftp: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#64748B" />
      {/* Server icon */}
      <rect x="10" y="10" width="20" height="8" rx="2" fill="white" opacity="0.3" />
      <rect x="10" y="22" width="20" height="8" rx="2" fill="white" opacity="0.3" />
      <circle cx="14" cy="14" r="1.5" fill="white" />
      <circle cx="14" cy="26" r="1.5" fill="white" />
      <line x1="18" y1="14" x2="26" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="26" x2="26" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // ── ATS ────────────────────────────────────────────────────────────────
  greenhouse: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#3B8427" />
      {/* Leaf / plant */}
      <path d="M20 32V18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 22C16 22 12 18 12 14C16 14 20 18 20 22Z" fill="white" opacity="0.7" />
      <path d="M20 18C24 18 28 14 28 10C24 10 20 14 20 18Z" fill="white" />
    </svg>
  ),

  lever: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#0B5CFF" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">L</text>
    </svg>
  ),

  ashby: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#1A1A2E" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">A</text>
    </svg>
  ),

  workable: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#1DA1F2" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="sans-serif">W</text>
    </svg>
  ),
};

// Fallback: colored initials in a rounded square
function FallbackLogo({ name, size }: { name: string; size: number }) {
  const color = BRAND_COLORS[name] || "#94a3b8";
  const initials = name
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="32" height="32" rx="8" fill={color} />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}

export function ProviderLogo({ id, size = 40, className }: Props) {
  const logo = LOGOS[id];

  return (
    <div
      className={clsx("shrink-0 overflow-hidden rounded-xl", className)}
      style={{ width: size, height: size }}
    >
      {logo ? (
        <div className="h-full w-full">{logo}</div>
      ) : (
        <FallbackLogo name={id} size={size} />
      )}
    </div>
  );
}
