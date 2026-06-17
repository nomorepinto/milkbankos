"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/lib/data/navigation";
import { Icon } from "../ui/Icon";

export interface TopNavProps {
  readonly activeSlug?: string;
}

export function TopNav({ activeSlug }: TopNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, slug: string) =>
    activeSlug === slug || pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/10 bg-primary-dark px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            href="/inventory-lab-results"
            className="text-lg font-extrabold tracking-tight text-white"
          >
            MilkBankMS
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {APP_NAV_ITEMS.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className={`text-sm font-semibold transition-colors ${
                  isActive(item.href, item.slug)
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            type="button"
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 sm:block"
          >
            <Icon name="notifications" />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 sm:block"
          >
            <Icon name="settings" />
          </button>
          <div className="mx-1 hidden h-8 w-px bg-white/20 sm:block" />
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-white">
              DR
            </div>
            <Link
              href="/login"
              className="hidden text-sm font-bold text-white hover:opacity-80 sm:inline"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-16 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-outline-variant/30 bg-primary-dark p-4 lg:hidden">
          <div className="space-y-1">
            {[...APP_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive(item.href, item.slug)
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10"
            >
              Logout
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
