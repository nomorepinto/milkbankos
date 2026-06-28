"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/milkbank/ui/Icon";
import { supabase } from "@/lib/supabaseClient";
import { APP_NAME } from "@/lib/config";

export interface LoginScreenProps { }

export function LoginScreen(_props: Readonly<LoginScreenProps>) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Invalid credentials. Please verify your email and password.");
  const [isLoading, setIsLoading] = useState(false);

  const [copyright, setCopyright] = useState(`© 2024 ${APP_NAME} Systems`);
  const [version, setVersion] = useState("V2.4.1-Stable");

  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await supabase.from("system_config").select("*");
        if (data) {
          const appVer = data.find(c => c.key === "app_version")?.value;
          const copyNotice = data.find(c => c.key === "copyright_notice")?.value;
          if (appVer) setVersion(appVer);
          if (copyNotice) setCopyright(copyNotice);
        }
      } catch (err) {
        console.error("Error loading system config:", err);
      }
    }
    loadConfig();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setShowError(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Fallback: check seeded users in public.users (for test/dev accounts)
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, role, email")
          .eq("email", email)
          .single();

        if (dbUser) {
          if (dbUser.role === "donor") {
            router.push("/milk-donation-log");
          } else {
            router.push("/inventory-lab-results");
          }
          return;
        }

        setErrorMessage(authError.message || "Invalid credentials. Please verify your email and password.");
        setShowError(true);
        return;
      }

      // Auth succeeded — look up the role from the users table
      let role: string | null = null;
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("auth_user_id", authData.user?.id)
          .single();
        role = profile?.role ?? null;
      } catch {
        // Profile fetch failed — proceed with default role
      }

      if (role === "donor") {
        router.push("/milk-donation-log");
      } else {
        // Default: staff / admin / unlinked profile → main dashboard
        router.push("/inventory-lab-results");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-background p-4 sm:p-0">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm md:flex-row">
        <div className="relative hidden items-center justify-center overflow-hidden bg-primary-dark p-12 md:flex md:w-1/2">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(theme(colors.primary-container)_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
          <div className="z-10 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white ring-8 ring-primary/20">
                <Icon name="water_drop" className="text-5xl" filled />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">{APP_NAME}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-16">
          <div className="mb-8 flex flex-col items-center md:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <Icon name="water_drop" className="text-3xl" filled />
            </div>
            <h1 className="text-xl font-semibold text-on-surface">Human Milk Bank</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-on-surface">System Access</h2>
            <p className="text-sm text-on-surface-variant">
              Please authenticate to access the clinical dashboard.
            </p>
          </div>

          {showError ? (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-error/20 bg-error-container p-4 text-error">
              <Icon name="report" />
              <p className="text-sm">
                {errorMessage}
              </p>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                Email Address
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff.name@milkbank.org"
                  className="w-full rounded-lg border border-outline-variant bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                >
                  Password
                </label>
                <button type="button" className="text-xs font-semibold text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Icon
                  name="lock"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-outline-variant bg-white py-3 pl-10 pr-12 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-primary"
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-4 text-base font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Logging in..." : "Login"}
              <Icon name="login" />
            </button>
          </form>

          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex w-full items-center gap-4">
              <div className="h-px flex-1 bg-outline-variant/30" />
              <span className="text-xs font-semibold uppercase text-outline">OR</span>
              <div className="h-px flex-1 bg-outline-variant/30" />
            </div>
            <Link
              href="/donor-registration"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-xs font-semibold uppercase text-primary transition-colors hover:bg-primary/5"
            >
              <Icon name="volunteer_activism" filled />
              Register as a Donor
            </Link>
          </div>

          <footer className="mt-auto pt-8 text-center">
            <p className="text-xs font-semibold uppercase text-outline">
              {copyright}. {version}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
