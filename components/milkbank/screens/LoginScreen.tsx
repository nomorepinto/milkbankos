"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/milkbank/ui/Icon";
import { systemConfig } from "@/lib/data/mockData";

export interface LoginScreenProps {}

export function LoginScreen(_props: Readonly<LoginScreenProps>) {
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowError(true);
    window.setTimeout(() => setShowError(false), 5000);
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
                <h1 className="text-3xl font-bold text-white">MilkBankMS</h1>
                <p className="mx-auto max-w-xs text-sm text-white/70">
                  The MilkBankMS precision standard for donor management and human
                  milk pasteurization tracking.
                </p>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <Icon name="verified_user" className="mb-2 text-primary-container" />
                <p className="text-xs font-semibold uppercase text-white">
                  Clinical Compliance
                </p>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <Icon name="biotech" className="mb-2 text-primary-container" />
                <p className="text-xs font-semibold uppercase text-white">
                  Batch Precision
                </p>
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
                Invalid credentials. Please verify your email and password.
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

            <Link
              href="/inventory-lab-results"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-4 text-base font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
            >
              Login
              <Icon name="login" />
            </Link>
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
              {systemConfig.copyright}. {systemConfig.version}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
