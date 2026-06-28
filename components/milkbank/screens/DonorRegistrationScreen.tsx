"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { supabase } from "@/lib/supabaseClient";

const donorRegistrationSteps = [
  "Personal Profile",
  "Health Intake",
  "Consent & Verification",
];

export interface DonorRegistrationScreenProps {}

export function DonorRegistrationScreen(_props: Readonly<DonorRegistrationScreenProps>) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Form State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("donorpassword123");

  // Location Form State
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [healthChecks, setHealthChecks] = useState([false, false, false]);

  const isStep1Complete =
    fullName.trim() !== "" &&
    dob !== "" &&
    phone.trim() !== "" &&
    email.trim() !== "" &&
    address.trim() !== "" &&
    area.trim() !== "" &&
    region.trim() !== "";

  const isStep2Complete = healthChecks.every((val) => val === true);

  const handleLocateAddress = async () => {
    if (!address.trim()) {
      setGeocodingError("Please enter an address first.");
      return;
    }
    setIsGeocoding(true);
    setGeocodingError("");
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setGeocodingError(data.error || "Geocoding failed.");
        setLatitude(null);
        setLongitude(null);
      } else {
        setLatitude(data.lat);
        setLongitude(data.lng);
        const components = data.addressComponents || [];
        
        let foundArea = "";
        let foundRegion = "";
        
        for (const comp of components) {
          if (comp.types.includes("neighborhood") || comp.types.includes("sublocality") || comp.types.includes("locality")) {
            foundArea = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            foundRegion = comp.long_name;
          }
        }
        
        if (foundArea && !area) setArea(foundArea);
        if (foundRegion && !region) setRegion(foundRegion);
      }
    } catch (err: any) {
      setGeocodingError(err.message || "An error occurred while geocoding.");
      setLatitude(null);
      setLongitude(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmitRegistration = async () => {
    setIsLoading(true);
    try {
      const { data: newUser, error: userErr } = await supabase
        .from("users")
        .insert({
          email: email,
          encrypted_password: password,
          role: "donor",
          is_active: true
        })
        .select("id")
        .single();

      if (userErr) {
        alert("Registration failed: " + userErr.message);
        return;
      }

      const displayId = "DON-" + Math.floor(1000 + Math.random() * 9000);
      const { error: profileErr } = await supabase
        .from("donor_profiles")
        .insert({
          id: newUser.id,
          display_id: displayId,
          full_name: fullName,
          status: "pending",
          status_label: "Pending",
          screening_due: true,
          contact_phone: phone,
          donation_cycles: 0,
          verification_note: "Pending Re-cert",
          region: region,
          area: area,
          latitude: latitude,
          longitude: longitude
        });

      if (profileErr) {
        alert("Profile creation failed: " + profileErr.message);
        return;
      }

      alert(`Success! Account created under Display ID: ${displayId}`);
      router.push("/login");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === donorRegistrationSteps.length - 1) {
      handleSubmitRegistration();
    } else {
      setStep((s) => s + 1);
    }
  };

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
            {donorRegistrationSteps.map((label, index) => {
              const isDisabled =
                (index === 1 && !isStep1Complete) ||
                (index === 2 && (!isStep1Complete || !isStep2Complete));
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setStep(index)}
                  className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    step === index
                      ? "border-b-2 border-primary-container bg-primary-container/5 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {index + 1}. {label}
                </button>
              );
            })}
          </div>

          <div className="space-y-6 p-8">
            {step === 0 ? (
              <>
                <h2 className="text-2xl font-semibold text-on-surface">Personal Profile</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Full Name</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Phone Number</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Email Address</label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Address</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                        placeholder="Enter street address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleLocateAddress}
                        disabled={isGeocoding}
                        className="rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isGeocoding ? "Locating..." : "Locate"}
                      </button>
                    </div>
                    {geocodingError && (
                      <p className="text-xs text-red-500 mt-1">{geocodingError}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Area</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                      placeholder="e.g. Castro"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-on-surface-variant">Region</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm focus:border-primary"
                      placeholder="e.g. Northern California"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    />
                  </div>

                  {latitude !== null && longitude !== null && (
                    <div className="space-y-1 sm:col-span-2 mt-2">
                      <label className="text-xs font-semibold uppercase text-on-surface-variant">Location Verification</label>
                      <div className="overflow-hidden rounded-lg border border-outline-variant">
                        <iframe
                          src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                          width="100%"
                          height="250"
                          style={{ border: 0 }}
                          allowFullScreen
                        />
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Coordinates found: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    </div>
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
                  ].map((item, idx) => (
                    <label
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-outline-variant/40 p-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-outline-variant text-primary focus:ring-primary"
                        checked={healthChecks[idx]}
                        onChange={(e) => {
                          const updated = [...healthChecks];
                          updated[idx] = e.target.checked;
                          setHealthChecks(updated);
                        }}
                      />
                      <span className="text-sm text-on-surface">{item}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-on-surface">
                  Consent & Verification
                </h2>
                <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  I consent to donor screening, milk testing, and secure storage per
                  MilkBankMS clinical protocols.
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-outline-variant/40 p-4 cursor-pointer hover:bg-surface-container-low transition-colors">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                  />
                  <span className="text-sm text-on-surface">
                    I agree to the terms and consent to proceed.
                  </span>
                </label>
              </div>
            ) : null}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  if (step === 0) {
                    router.push("/login");
                  } else {
                    setStep((s) => s - 1);
                  }
                }}
                className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                disabled={
                  isLoading ||
                  (step === 0 && !isStep1Complete) ||
                  (step === 1 && !isStep2Complete) ||
                  (step === 2 && (!isStep1Complete || !isStep2Complete || !consentChecked))
                }
                onClick={handleNext}
                className="rounded-lg bg-primary-container px-6 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? "Submitting..." : step === donorRegistrationSteps.length - 1 ? "Submit Registration" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
