"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/lib/data/navigation";
import { Icon } from "../ui/Icon";
import { APP_NAME } from "@/lib/config";

export interface TopNavProps {
  readonly activeSlug?: string;
}

export function TopNav({ activeSlug }: TopNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [initials, setInitials] = useState("DR");

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: staff } = await supabase
            .from("staff_profiles")
            .select("avatar_initials")
            .eq("id", user.id)
            .single();

          if (staff?.avatar_initials) {
            setInitials(staff.avatar_initials);
          } else {
            const { data: donor } = await supabase
              .from("donor_profiles")
              .select("full_name")
              .eq("id", user.id)
              .single();

            if (donor?.full_name) {
              const parts = donor.full_name.trim().split(/\s+/);
              const init = parts.map((p: string) => p[0]).join("").substring(0, 2).toUpperCase();
              setInitials(init || "U");
            } else {
              // Fallback lookup in users table in case profile tables are not fully seeded
              const { data: dbUser } = await supabase
                .from("users")
                .select("id, role, email")
                .eq("email", user.email)
                .single();

              if (dbUser) {
                if (dbUser.role === "donor") {
                  const { data: d } = await supabase.from("donor_profiles").select("full_name").eq("id", dbUser.id).single();
                  if (d?.full_name) {
                    const parts = d.full_name.trim().split(/\s+/);
                    const init = parts.map((p: string) => p[0]).join("").substring(0, 2).toUpperCase();
                    setInitials(init || "U");
                  }
                } else {
                  const { data: s } = await supabase.from("staff_profiles").select("avatar_initials").eq("id", dbUser.id).single();
                  if (s?.avatar_initials) {
                    setInitials(s.avatar_initials);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading user initials in TopNav:", err);
      }
    }
    loadUserProfile();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    window.location.href = "/login";
  };

  const isActive = (href: string, slug: string) => {
    if (slug === "donor-directory") {
      return (
        activeSlug === "donor-directory" ||
        activeSlug === "donor-community-map" ||
        pathname === "/donor-directory" ||
        pathname === "/donor-community-map"
      );
    }
    if (slug === "collection-point-logistics") {
      return (
        activeSlug === "collection-point-logistics" ||
        activeSlug === "onsite-collection-terminal" ||
        pathname === "/collection-point-logistics" ||
        pathname === "/onsite-collection-terminal"
      );
    }
    return activeSlug === slug || pathname === href || pathname.startsWith(`${href}/`);
  };

  const isMinimalNav =
    activeSlug === "donor-registration" ||
    activeSlug === "milk-donation-log" ||
    pathname === "/donor-registration" ||
    pathname === "/milk-donation-log";

  return (
    <>
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/10 bg-primary-dark px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-8">
          <span className="text-lg font-extrabold tracking-tight text-white">
            {APP_NAME}
          </span>
          {!isMinimalNav && (
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
          )}
        </div>
        {!isMinimalNav && (
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
            <div className="mx-1 hidden h-8 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-white">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="hidden text-sm font-bold text-white hover:opacity-80 sm:inline"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {!isMinimalNav && mobileOpen ? (
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
            <button
              onClick={handleLogout}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
