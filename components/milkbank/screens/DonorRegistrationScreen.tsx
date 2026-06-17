"use client";

import { useState } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { donorRegistrationSteps } from "@/lib/data/mockData";

export interface DonorRegistrationScreenProps {}

export function DonorRegistrationScreen(_props: Readonly<DonorRegistrationScreenProps>) {
  const [step, setStep] = useState(0);

  return (
    <AppShell activeSlug="donor-registration">
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/30 bg-primary-dark px-8 py-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container">
              <Icon name="volunteer_activism" className="text-2xl text-white" filled />
            </div>
            <h1 className="text-xl font-semibold text-white">MilkBankMS</h1>
            <p className="text-sm text-white/70">Donor Registration Portal</p>
          </div>

          <div className="flex border-b border-outline-variant/30">
            {donorRegistrationSteps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  step === index
                    ? "border-b-2 border-primary-container bg-primary-container/5 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          <div className="space-y-6 p-8">
            {step === 0 ? (
              <>
                <h2 className="text-2xl font-semibold text-on-surface">Personal Profile</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {["Full Name", "Date of Birth", "Phone Number", "Email Address"].map(
                    (field) => (
                      <div key={field} className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-on-surface-variant">
                          {field}
                        </label>
                        <input
                          className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder={`Enter ${field.toLowerCase()}`}
                        />
                      </div>
                    ),
                  )}
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <h2 className="text-xl font-semibold text-on-surface">Health Intake</h2>
                <p className="text-sm text-on-surface-variant">
                  Complete the clinical screening questionnaire for donor eligibility.
                </p>
                <div className="space-y-3">
                  {[
                    "No active infections in the last 12 months",
                    "Not taking prohibited medications",
                    "No alcohol or tobacco use within 24h of donation",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-outline-variant/40 p-4"
                    >
                      <input type="checkbox" className="mt-1 rounded border-outline-variant" />
                      <span className="text-sm text-on-surface">{item}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="text-xl font-semibold text-on-surface">
                  Consent & Verification
                </h2>
                <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  I consent to donor screening, milk testing, and secure storage per
                  MilkBankMS clinical protocols.
                </div>
              </>
            ) : null}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  setStep((s) => Math.min(donorRegistrationSteps.length - 1, s + 1))
                }
                className="rounded-lg bg-primary-container px-6 py-2 text-sm font-semibold text-white"
              >
                {step === donorRegistrationSteps.length - 1 ? "Submit Registration" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
