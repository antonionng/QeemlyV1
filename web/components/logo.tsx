import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

// Set to false to use the inline placeholder, true to use /public/logo.svg
const HAS_CUSTOM_LOGO = true;

export function Logo({ href = "/home", compact = false, className }: LogoProps) {
  const content = (
    <div className={clsx("flex items-center gap-2.5", className)}>
      {HAS_CUSTOM_LOGO ? (
        // Your logo - replace /public/logo.png with your own
        <Image
          src="/logo.png"
          alt="Qeemly"
          width={120}
          height={36}
          className={compact ? "h-7 w-auto" : "h-8 w-auto"}
          priority
          unoptimized
        />
      ) : (
        // Placeholder logo - override by setting HAS_CUSTOM_LOGO = true and adding /public/logo.svg
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Stylized Q mark */}
            <circle cx="12" cy="11" r="7" />
            <path d="M15 14l4 4" />
          </svg>
        </div>
      )}
      
      {/* Text is included in logo.svg - remove this block if using icon-only logo */}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
