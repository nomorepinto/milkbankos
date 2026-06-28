"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { supabase } from "@/lib/supabaseClient";

const beneficiaryFormSections = [
  {
    title: "Infant Information",
    fields: ["Infant Name", "Date of Birth", "Gestational Age", "Medical Record #"],
  },
  {
    title: "Clinical Site",
    fields: ["Hospital / NICU", "Attending Physician", "Ward / Room"],
  },
  {
    title: "Guardian Info",
    fields: ["Guardian Name", "Relationship", "Contact Phone"],
  },
  {
    title: "Feeding Order",
    fields: ["Daily Volume (ml)", "Frequency", "Special Instructions"],
  },
];

export interface BeneficiaryRegistrationScreenProps { }

export function BeneficiaryRegistrationScreen(_props: Readonly<BeneficiaryRegistrationScreenProps>) {
  const [formData, setFormData] = useState<Record<string, string>>({
    "Infant Name": "",
    "Date of Birth": "",
    "Gestational Age": "",
    "Medical Record #": "",
    "Hospital / NICU": "",
    "Attending Physician": "",
    "Ward / Room": "",
    "Guardian Name": "",
    "Relationship": "",
    "Contact Phone": "",
    "Daily Volume (ml)": "",
    "Frequency": "",
    "Special Instructions": "",
  });

  const [milkAvailable, setMilkAvailable] = useState("0.0L Pasteurised Milk Available");
  const [status, setStatus] = useState<"healthy" | "critical">("healthy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMilkAvailable() {
      try {
        const { data } = await supabase
          .from("inventory_batches")
          .select("volume_ml")
          .eq("lab_status", "verified");
        if (data && data.length > 0) {
          const totalMl = data.reduce((sum, b) => sum + Number(b.volume_ml), 0);
          const totalL = (totalMl / 1000).toFixed(1);
          setMilkAvailable(`${totalL}L Pasteurised Milk Available`);
        }
      } catch (err) {
        console.error("Error loading milk volume:", err);
      }
    }
    loadMilkAvailable();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        infant_name: formData["Infant Name"],
        date_of_birth: formData["Date of Birth"] || null,
        gestational_age: formData["Gestational Age"] || null,
        medical_record_number: formData["Medical Record #"] || null,
        hospital_name: formData["Hospital / NICU"] || null,
        attending_physician: formData["Attending Physician"] || null,
        ward: formData["Ward / Room"] || null,
        guardian_name: formData["Guardian Name"] || null,
        guardian_relationship: formData["Relationship"] || null,
        guardian_contact: formData["Contact Phone"] || null,
        daily_volume_ml: formData["Daily Volume (ml)"] ? Number(formData["Daily Volume (ml)"]) : null,
        feeding_frequency: formData["Frequency"] || null,
        special_instructions: formData["Special Instructions"] || null,
        status: status,
      };

      if (!payload.infant_name) {
        throw new Error("Infant Name is required.");
      }

      const { error: dbError } = await supabase.from("beneficiaries").insert([payload]);
      if (dbError) throw dbError;

      setSuccessMessage(`Successfully registered ${payload.infant_name}!`);
      // Reset form
      setFormData({
        "Infant Name": "",
        "Date of Birth": "",
        "Gestational Age": "",
        "Medical Record #": "",
        "Hospital / NICU": "",
        "Attending Physician": "",
        "Ward / Room": "",
        "Guardian Name": "",
        "Relationship": "",
        "Contact Phone": "",
        "Daily Volume (ml)": "",
        "Frequency": "",
        "Special Instructions": "",
      });
      setStatus("healthy");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit beneficiary registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBeneficiaryFormComplete = Object.entries(formData).every(
    ([key, value]) => key === "Special Instructions" || value.trim() !== ""
  );

  return (
    <AppShell activeSlug="beneficiary-registration">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8 bg-background">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Beneficiary Registration</h2>
          </div>

          {successMessage && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-container/10 p-4 text-primary">
              <Icon name="check_circle" />
              <p className="text-sm font-semibold">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-3 rounded-lg border border-error/20 bg-error-container p-4 text-error">
              <Icon name="report" />
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
              <span className="text-sm font-semibold text-on-background">
                {milkAvailable}
              </span>
            </div>
            <div className="rounded-lg border border-secondary/30 bg-secondary-container/10 p-4">
              <span className="text-sm font-semibold text-secondary">
                Optimal (14ms)
              </span>
            </div>
          </div>

          {/* Health Status Toggle Switch */}
          <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Health Status</h3>
              <p className="text-xs text-on-surface-variant mt-1 font-medium">
                Set priority status for dispensing allocation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${status === "critical" ? "text-error" : "text-secondary"}`}>
                {status === "critical" ? "Critical Priority" : "Healthy / Standard"}
              </span>
              <button
                type="button"
                onClick={() => setStatus(prev => prev === "healthy" ? "critical" : "healthy")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  status === "critical" ? "bg-error" : "bg-outline-variant"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    status === "critical" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
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
                      type={field === "Date of Birth" ? "date" : "text"}
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                      placeholder={`Enter ${field.toLowerCase()}`}
                      value={formData[field]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting || !isBeneficiaryFormComplete}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon name={isSubmitting ? "hourglass_empty" : "check"} />
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
