export default function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-2 text-text-primary">{children}</div>;
}
