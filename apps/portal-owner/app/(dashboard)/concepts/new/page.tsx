"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXTERIOR_CONCEPT_FORM_STEPS } from "@kealee/shared";
import type { IntakeFormStep } from "@kealee/shared";

export default function NewConceptPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep: IntakeFormStep = EXTERIOR_CONCEPT_FORM_STEPS[step];
  const isLastStep = step === EXTERIOR_CONCEPT_FORM_STEPS.length - 1;
  const progress = Math.round(((step + 1) / EXTERIOR_CONCEPT_FORM_STEPS.length) * 100);

  function updateField(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateStep(): boolean {
    const stepErrors: Record<string, string> = {};
    for (const field of currentStep.fields) {
      if (field.required) {
        const val = formData[field.key];
        if (!val || (Array.isArray(val) && val.length === 0) || val === "") {
          stepErrors[field.key] = `${field.label} is required`;
        }
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (isLastStep) handleSubmit();
    else setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const normalized = {
        ...formData,
        goals:
          typeof formData.goals === "string"
            ? (formData.goals as string)
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : (formData.goals as string[]) ?? [],
        knownConstraints:
          typeof formData.knownConstraints === "string"
            ? (formData.knownConstraints as string)
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : (formData.knownConstraints as string[]) ?? [],
        stylePreferences: (formData.stylePreferences as string[]) ?? [],
        uploadedPhotos: (formData.uploadedPhotos as string[]) ?? [],
      };

      const res = await fetch("/api/concepts/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeData: normalized, source: "portal_owner" }),
      });

      if (!res.ok) throw new Error("Submission failed");
      const { intakeId } = await res.json();
      router.push(`/concepts/pay?intakeId=${intakeId}`);
    } catch {
      setErrors({ _form: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span>
            Step {step + 1} of {EXTERIOR_CONCEPT_FORM_STEPS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{currentStep.title}</h1>
        {currentStep.description && (
          <p className="mt-1 text-slate-500">{currentStep.description}</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {currentStep.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {(field.type === "text" ||
              field.type === "email" ||
              field.type === "tel" ||
              field.type === "address") && (
              <input
                type={field.type === "address" ? "text" : field.type}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  errors[field.key] ? "border-red-400" : "border-slate-200"
                }`}
                placeholder={field.placeholder}
                value={(formData[field.key] as string) ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  errors[field.key] ? "border-red-400" : "border-slate-200"
                }`}
                placeholder={field.placeholder}
                rows={4}
                value={(formData[field.key] as string) ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            )}

            {field.type === "select" && (
              <select
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  errors[field.key] ? "border-red-400" : "border-slate-200"
                }`}
                value={(formData[field.key] as string) ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
              >
                <option value="">Select an option...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "radio" && (
              <div className="grid gap-2 sm:grid-cols-3">
                {field.options?.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                      formData[field.key] === opt.value
                        ? "border-black bg-slate-50 font-medium"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={field.key}
                      value={opt.value}
                      checked={formData[field.key] === opt.value}
                      onChange={() => updateField(field.key, opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}

            {field.type === "multiselect" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {field.options?.map((opt) => {
                  const selected: string[] = Array.isArray(formData[field.key])
                    ? (formData[field.key] as string[])
                    : [];
                  const isSelected = selected.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                        isSelected
                          ? "border-black bg-slate-50 font-medium"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          updateField(
                            field.key,
                            isSelected
                              ? selected.filter((v) => v !== opt.value)
                              : [...selected, opt.value],
                          );
                        }}
                        className="rounded"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            )}

            {field.type === "file" && (
              <div
                className={`rounded-xl border-2 border-dashed p-6 text-center ${
                  errors[field.key] ? "border-red-300" : "border-slate-200"
                }`}
              >
                <p className="text-sm text-slate-500">
                  📷 Paste a photo URL to continue (full upload UI coming soon)
                </p>
                <p className="mt-1 text-xs text-slate-400">{field.helperText}</p>
                <input
                  type="text"
                  className="mt-3 w-full rounded-xl border px-3 py-2 text-xs"
                  placeholder="https://example.com/photo.jpg"
                  onChange={(e) => {
                    updateField(field.key, e.target.value ? [e.target.value] : []);
                  }}
                />
              </div>
            )}

            {field.helperText && field.type !== "file" && (
              <p className="mt-1 text-xs text-slate-400">{field.helperText}</p>
            )}
            {errors[field.key] && (
              <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      {errors._form && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl border px-5 py-2.5 text-sm hover:bg-slate-50"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="rounded-xl bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting
            ? "Saving..."
            : isLastStep
            ? "Continue to packages →"
            : "Next →"}
        </button>
      </div>
    </div>
  );
}
