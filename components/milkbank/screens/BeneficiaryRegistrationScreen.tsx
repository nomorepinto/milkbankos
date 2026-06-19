import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { beneficiaryFormDefaults, beneficiaryFormSections } from "@/lib/data/mockData";

export interface BeneficiaryRegistrationScreenProps {}

export function BeneficiaryRegistrationScreen(_props: Readonly<BeneficiaryRegistrationScreenProps>) {
  return (
    <AppShell activeSlug="beneficiary-registration">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-on-surface">Beneficiary Registration</h2>
            <p className="text-sm text-on-surface-variant">
              Register infants and guardians for milk bank dispensing programs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
              <span className="text-sm font-semibold text-on-background">
                {beneficiaryFormDefaults.milkAvailable}
              </span>
            </div>
            <div className="rounded-lg border border-secondary/30 bg-secondary-container/10 p-4">
              <span className="text-sm font-semibold text-secondary">
                {beneficiaryFormDefaults.latency}
              </span>
            </div>
          </div>

          {beneficiaryFormSections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6"
            >
              <h3 className="mb-4 text-lg font-semibold text-on-surface">{section.title}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">
                      {field}
                    </label>
                    <input
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder={`Enter ${field.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary"
            >
              Save Draft
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Icon name="check" />
              Submit Registration
            </button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
