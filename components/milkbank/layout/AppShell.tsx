import { TopNav } from "./TopNav";

export interface AppShellProps {
  readonly children: React.ReactNode;
  readonly activeSlug?: string;
  readonly fullBleed?: boolean;
}

export function AppShell({
  children,
  activeSlug,
  fullBleed = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav activeSlug={activeSlug} />
      <div className={`pt-16 ${fullBleed ? "" : "custom-scrollbar"}`}>
        {children}
      </div>
    </div>
  );
}
